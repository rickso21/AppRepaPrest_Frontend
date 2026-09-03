import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Vibration,
  Linking,
  Modal,
  Dimensions,
  Animated,
  AppState,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  LatLng,
} from 'react-native-maps';
import * as Speech from 'expo-speech';
import { 
  MapTheme, 
  getMapStyle, 
  getThemeIcon, 
  getThemeLabel 
} from './MapStyles';

const { width, height } = Dimensions.get('window');

// ============================================
// TIPOS
// ============================================
interface Rider {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  estado: 'conectado' | 'ocupado' | 'desconectado';
  en_panico: boolean;
  tipo_emergencia?: string;
  telefono?: string;
  ultima_actualizacion?: string;
  vehiculo?: string;
  placas?: string;
  direccion?: string;
}

interface GoogleMapViewProps {
  onMapReady?: () => void;
  usuarioActual?: {
    id: number;
    nombre: string;
    rol: string;
    telefono?: string;
    direccion?: string;
    vehiculo?: string;
    placas?: string;
  };
}

export interface GoogleMapViewRef {
  updateMyLocation: (lat: number, lng: number) => void;
  updateRider: (rider: Rider) => void;
  removeRider: (userId: number) => void;
  loadAllRiders: (riders: Rider[]) => void;
  clearAllRiders: () => void;
  navigateTo: (lat: number, lng: number, userName: string) => void;
  cancelarNavegacion: () => void;
  toggleVoz: () => void;
  centrarUbicacion: () => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const GoogleMapView = forwardRef<GoogleMapViewRef, GoogleMapViewProps>(
  ({ onMapReady, usuarioActual }, ref) => {
    // ========== ESTADOS ==========
    const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
    const [riders, setRiders] = useState<Map<number, Rider>>(new Map());
    const [panicMarkers, setPanicMarkers] = useState<Map<number, Rider>>(new Map());
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [mapReadyState, setMapReadyState] = useState(false);
    const [isFirstLocationUpdate, setIsFirstLocationUpdate] = useState(true);
    const [isGoogleMapsInstalled, setIsGoogleMapsInstalled] = useState(false);
    
    // ===== ESTADOS PARA EL TEMA =====
    const [currentTheme, setCurrentTheme] = useState<MapTheme>('light');
    const [showThemeModal, setShowThemeModal] = useState(false);

    // ===== ESTADO PARA BURBUJAS DE USUARIO =====
    const [showMiniBubble, setShowMiniBubble] = useState(false);
    const [showExpandedBubble, setShowExpandedBubble] = useState(false);
    const [bubbleUser, setBubbleUser] = useState<Rider | null>(null);
    
    const [bubbleScreenPos, setBubbleScreenPos] = useState<{x: number, y: number} | null>(null);
    const [ridersPositions, setRidersPositions] = useState<Map<number, {x: number, y: number}>>(new Map());
    
    // ===== CONTADORES DE TIEMPO =====
    const [onlineTime, setOnlineTime] = useState(0);
    const [isUserOnline, setIsUserOnline] = useState(false);
    const onlineTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    const [ridersOnlineTime, setRidersOnlineTime] = useState<Map<number, number>>(new Map());
    const ridersTimerRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
    
    // ===== CONTROL DE ALERTAS DE PÁNICO =====
    // 🔥 Usamos dos Mapas: uno para el cooldown por rider
    const panicAlertCooldownRef = useRef<Map<number, number>>(new Map());
    // 🔥 Y otro para saber qué riders ya han tenido alerta activa
    const panicAlertShownRef = useRef<Map<number, boolean>>(new Map());
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;

    // ========== REFS ==========
    const mapRef = useRef<MapView>(null);
    const locationUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
    const currentLocationRef = useRef<LatLng | null>(null);
    const appState = useRef(AppState.currentState);

    // ========== FUNCIONES PARA EL CONTADOR DE TIEMPO DEL USUARIO ACTUAL ==========
    const iniciarContadorTiempo = () => {
      detenerContadorTiempo();
      setOnlineTime(0);
      setIsUserOnline(true);
      
      onlineTimerRef.current = setInterval(() => {
        setOnlineTime(prev => prev + 1);
      }, 1000);
    };

    const detenerContadorTiempo = () => {
      if (onlineTimerRef.current) {
        clearInterval(onlineTimerRef.current);
        onlineTimerRef.current = null;
      }
      setIsUserOnline(false);
      setOnlineTime(0);
    };

    // ========== FUNCIONES PARA EL CONTADOR DE TIEMPO DE CADA RIDER ==========
    const iniciarContadorRider = (riderId: number) => {
      detenerContadorRider(riderId);
      
      const timer = setInterval(() => {
        setRidersOnlineTime(prev => {
          const newMap = new Map(prev);
          const currentTime = newMap.get(riderId) || 0;
          newMap.set(riderId, currentTime + 1);
          return newMap;
        });
      }, 1000);
      
      ridersTimerRef.current.set(riderId, timer);
    };

    const detenerContadorRider = (riderId: number) => {
      const timer = ridersTimerRef.current.get(riderId);
      if (timer) {
        clearInterval(timer);
        ridersTimerRef.current.delete(riderId);
      }
      setRidersOnlineTime(prev => {
        const newMap = new Map(prev);
        newMap.delete(riderId);
        return newMap;
      });
    };

    const formatearTiempo = (segundos: number): string => {
      const horas = Math.floor(segundos / 3600);
      const minutos = Math.floor((segundos % 3600) / 60);
      const segs = segundos % 60;
      
      if (horas > 0) {
        return `${horas}h ${minutos}m ${segs}s`;
      } else if (minutos > 0) {
        return `${minutos}m ${segs}s`;
      } else {
        return `${segs}s`;
      }
    };

    // ========== FUNCIONES PARA ALERTA DE PÁNICO ==========
 const mostrarAlertaPanico = (rider: Rider) => {
  const now = Date.now();
  const lastAlert = panicAlertCooldownRef.current.get(rider.id) || 0;
  
  // 🔥 Si ya se mostró una alerta en los últimos 10 segundos, ignorar
  if (now - lastAlert < 2000) {
    return;
  }
  
  // 🔥 Actualizar el cooldown
  panicAlertCooldownRef.current.set(rider.id, now);
  
  // 🔥 Marcar que ya se mostró la alerta para este rider
  panicAlertShownRef.current.set(rider.id, true);
  
  // Mostrar alerta con opciones
  Alert.alert(
    '🚨 ¡SOLICITUD DE APOYO!',
    `${rider.nombre} solicito apoyo acude a su auxilio`,
    [
      {
        text: '📍 Cómo llegar',
        onPress: async () => {
          if (!currentLocationRef.current) {
            Alert.alert('Error', 'No se puede obtener tu ubicación');
            return;
          }
          const success = await abrirGoogleMaps(
            rider.latitud,
            rider.longitud,
            rider.nombre
          );
          if (!success) {
            Alert.alert('Error', 'No se pudo abrir Google Maps');
          }
        }
      },
      {
        text: '📞 Llamar',
        onPress: () => {
          if (rider.telefono) {
            Linking.openURL(`tel:${rider.telefono}`);
          } else {
            Alert.alert('Error', 'El usuario no tiene teléfono registrado');
          }
        }
      },
      {
        text: 'Cerrar',
        style: 'cancel'
      }
    ],
    { cancelable: true }
  );
  
  // Vibración más intensa para alerta de pánico
  Vibration.vibrate([100, 200, 100, 200, 100]);
  
  // 🔥 Limpiar el cooldown después de 10 segundos
  setTimeout(() => {
    panicAlertCooldownRef.current.delete(rider.id);
  }, 10000);
};
    // ========== FUNCIÓN PARA VERIFICAR SI DEBE MOSTRAR ALERTA ==========
    const verificarYMostrarAlertaPanico = (rider: Rider) => {
      // 🔥 Solo mostrar si está en pánico
      if (!rider.en_panico) {
        return;
      }
      
      // 🔥 Verificar si ya se mostró la alerta para este rider
      const alreadyShown = panicAlertShownRef.current.get(rider.id) || false;
      
      // 🔥 Si ya se mostró, no volver a mostrar
      if (alreadyShown) {
        return;
      }
      
      // 🔥 Mostrar la alerta
      mostrarAlertaPanico(rider);
    };

    // ========== FUNCIÓN PARA LIMPIAR ESTADO DE ALERTA DE UN RIDER ==========
    const limpiarAlertaPanico = (riderId: number) => {
      panicAlertShownRef.current.delete(riderId);
      panicAlertCooldownRef.current.delete(riderId);
    };

    // ========== FUNCIÓN PARA ACTUALIZAR POSICIONES DE TODOS LOS RIDERS ==========
    const updateAllRidersPositions = async () => {
      if (!mapRef.current) return;
      
      const newPositions = new Map();
      
      for (const [id, rider] of riders) {
        try {
          const point = await mapRef.current.pointForCoordinate({
            latitude: rider.latitud,
            longitude: rider.longitud
          });
          if (point) {
            newPositions.set(id, {
              x: point.x,
              y: point.y - 60
            });
          }
        } catch {
          // Silenciar error
        }
      }
      
      for (const [id, rider] of panicMarkers) {
        try {
          const point = await mapRef.current.pointForCoordinate({
            latitude: rider.latitud,
            longitude: rider.longitud
          });
          if (point) {
            newPositions.set(id, {
              x: point.x,
              y: point.y - 60
            });
          }
        } catch {
          // Silenciar error
        }
      }
      
      setRidersPositions(newPositions);
    };

    // ========== FUNCIÓN PARA ACTUALIZAR POSICIÓN DE UN RIDER ESPECÍFICO ==========
    const updateBubblePositionForRider = async (rider: Rider) => {
      if (!mapRef.current || !rider) return false;
      
      try {
        const point = await mapRef.current.pointForCoordinate({
          latitude: rider.latitud,
          longitude: rider.longitud
        });
        if (point) {
          setBubbleScreenPos({
            x: point.x,
            y: point.y - 180
          });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // ========== FUNCIONES DE NAVEGACIÓN EXTERNA ==========
    const abrirGoogleMaps = async (destLat: number, destLng: number, destName?: string) => {
      const location = currentLocationRef.current;
      
      if (!location) {
        Alert.alert('Error', 'No se puede obtener tu ubicación actual. Activa el GPS.');
        return false;
      }

      try {
        const googleMapsInstalled = await Linking.canOpenURL('comgooglemaps://');
        
        if (googleMapsInstalled) {
          const url = `comgooglemaps://?daddr=${destLat},${destLng}&saddr=${location.latitude},${location.longitude}&directionsmode=driving`;
          await Linking.openURL(url);
          return true;
        } else {
          const url = `https://www.google.com/maps/dir/${location.latitude},${location.longitude}/${destLat},${destLng}/`;
          await Linking.openURL(url);
          return true;
        }
      } catch {
        try {
          const url = `https://www.google.com/maps/dir/${location.latitude},${location.longitude}/${destLat},${destLng}/`;
          await Linking.openURL(url);
          return true;
        } catch {
          Alert.alert('Error', 'No se pudo abrir Google Maps.');
          return false;
        }
      }
    };

    // ========== FUNCIONES PARA BURBUJAS ==========
    const expandirBurbuja = async (rider: Rider) => {
      setBubbleUser(rider);
      setSelectedRider(rider);
      setShowExpandedBubble(true);
      setShowMiniBubble(false);
      
      const positionSet = await updateBubblePositionForRider(rider);
      
      if (!positionSet) {
        setTimeout(async () => {
          await updateBubblePositionForRider(rider);
        }, 200);
      }
      
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      Vibration.vibrate(20);
    };

    const contraerBurbuja = () => {
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowExpandedBubble(false);
        setBubbleUser(null);
        setSelectedRider(null);
        setBubbleScreenPos(null);
        setShowMiniBubble(true);
      });
    };

    const ocultarTodasBurbujas = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowMiniBubble(false);
        setShowExpandedBubble(false);
        setBubbleUser(null);
        setSelectedRider(null);
        setBubbleScreenPos(null);
      });
    };

    // ========== FUNCIÓN PARA CAMBIAR TEMA ==========
    const cambiarTema = (theme: MapTheme) => {
      setCurrentTheme(theme);
      setShowThemeModal(false);
      Vibration.vibrate(20);
    };

    // ========== EFECTOS ==========
    useEffect(() => {
      const checkGoogleMaps = async () => {
        try {
          const installed = await Linking.canOpenURL('comgooglemaps://');
          setIsGoogleMapsInstalled(installed);
        } catch {
          setIsGoogleMapsInstalled(false);
        }
      };
      checkGoogleMaps();
    }, []);

    useEffect(() => {
      return () => {
        if (locationUpdateTimeout.current) {
          clearTimeout(locationUpdateTimeout.current);
        }
        detenerContadorTiempo();
        
        ridersTimerRef.current.forEach((_, riderId) => {
          detenerContadorRider(riderId);
        });
        
        // Limpiar alertas de pánico
        panicAlertCooldownRef.current.clear();
        panicAlertShownRef.current.clear();
        
        Speech.stop();
      };
    }, []);

    useEffect(() => {
      if (mapReadyState && (riders.size > 0 || panicMarkers.size > 0)) {
        setTimeout(() => {
          updateAllRidersPositions();
          setShowMiniBubble(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 500);
      }
    }, [riders, panicMarkers, mapReadyState]);

    useEffect(() => {
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          if (showExpandedBubble && bubbleUser) {
            updateBubblePositionForRider(bubbleUser);
          }
        }
        appState.current = nextAppState;
      });

      return () => subscription.remove();
    }, [showExpandedBubble, bubbleUser]);

    useEffect(() => {
      if (currentLocation && usuarioActual) {
        if (!isUserOnline) {
          iniciarContadorTiempo();
        }
        
        const userRider: Rider = {
          id: usuarioActual.id,
          nombre: usuarioActual.nombre,
          latitud: currentLocation.latitude,
          longitud: currentLocation.longitude,
          estado: 'conectado',
          en_panico: false,
          telefono: usuarioActual.telefono || '-',
          direccion: usuarioActual.direccion,
          vehiculo: usuarioActual.vehiculo,
          placas: usuarioActual.placas,
          ultima_actualizacion: new Date().toLocaleString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        
        setRiders(prev => {
          const newMap = new Map(prev);
          newMap.set(userRider.id, userRider);
          return newMap;
        });
        
        setTimeout(() => {
          updateAllRidersPositions();
          setShowMiniBubble(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 500);
      } else {
        detenerContadorTiempo();
      }
    }, [currentLocation, usuarioActual]);

    // ========== MANEJADOR DEL MAPA ==========
    const handleMapMove = () => {
      if (riders.size > 0 || panicMarkers.size > 0) {
        updateAllRidersPositions();
      }
      
      if (showExpandedBubble && bubbleUser) {
        updateBubblePositionForRider(bubbleUser);
      }
    };

    // ========== EXPONER FUNCIONES ==========
    useImperativeHandle(ref, () => ({
      updateMyLocation: (lat: number, lng: number) => {
        if (currentLocationRef.current && 
            Math.abs(currentLocationRef.current.latitude - lat) < 0.00001 && 
            Math.abs(currentLocationRef.current.longitude - lng) < 0.00001) {
          return;
        }
        
        if (locationUpdateTimeout.current) {
          clearTimeout(locationUpdateTimeout.current);
        }

        locationUpdateTimeout.current = setTimeout(() => {
          const newLocation = { latitude: lat, longitude: lng };
          setCurrentLocation(newLocation);
          currentLocationRef.current = newLocation;

          if (mapRef.current && mapReadyState && isFirstLocationUpdate) {
            mapRef.current.animateToRegion({
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
            setIsFirstLocationUpdate(false);
          }
        }, 100);
      },

      updateRider: (rider: Rider) => {
  const wasInPanic = panicMarkers.has(rider.id);
  
  setRiders(prev => {
    const newMap = new Map(prev);
    newMap.delete(rider.id);
    return newMap;
  });

  setPanicMarkers(prev => {
    const newMap = new Map(prev);
    newMap.delete(rider.id);
    return newMap;
  });

  if (rider.en_panico) {
    setPanicMarkers(prev => new Map(prev).set(rider.id, rider));
    
    if (!wasInPanic) {
      const alreadyShown = panicAlertShownRef.current.get(rider.id) || false;
      if (!alreadyShown) {
        mostrarAlertaPanico(rider);
      }
    }
    
    if (showExpandedBubble && bubbleUser?.id === rider.id) {
      setBubbleUser(rider);
    }
  } else {
    // 🔥 CORREGIDO: Limpiar alerta en TODOS los casos donde NO está en pánico
    // Esto incluye 'conectado', 'ocupado' Y 'desconectado'
    limpiarAlertaPanico(rider.id);
    
    // Si está conectado u ocupado, agregarlo a riders
    if (rider.estado === 'conectado' || rider.estado === 'ocupado') {
      setRiders(prev => new Map(prev).set(rider.id, rider));
    }
  }
  
  // Manejar contadores de tiempo
  if (rider.estado === 'conectado' || rider.estado === 'ocupado') {
    if (!ridersTimerRef.current.has(rider.id)) {
      iniciarContadorRider(rider.id);
    }
  } else if (rider.estado === 'desconectado') {
    detenerContadorRider(rider.id);
  }
},

      removeRider: (userId: number) => {
        setRiders(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        setPanicMarkers(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        
        detenerContadorRider(userId);
        limpiarAlertaPanico(userId);
        
        if (selectedRider?.id === userId) {
          ocultarTodasBurbujas();
        }
      },

      loadAllRiders: (ridersList: Rider[]) => {
  const newRiders = new Map();
  const newPanic = new Map();
  
  // 🔥 Limpiar flags de alerta para riders que ya no están en pánico
  const ridersInPanic = new Set(
    ridersList.filter(r => r.en_panico).map(r => r.id)
  );
  
  // Limpiar flags de riders que ya no están en pánico
  for (const [id] of panicAlertShownRef.current) {
    if (!ridersInPanic.has(id)) {
      limpiarAlertaPanico(id);
    }
  }
  
  ridersList.forEach(rider => {
    if (rider.en_panico) {
      newPanic.set(rider.id, rider);
    } else if (rider.estado === 'conectado' || rider.estado === 'ocupado') {
      newRiders.set(rider.id, rider);
      if (!ridersTimerRef.current.has(rider.id)) {
        iniciarContadorRider(rider.id);
      }
    }
  });
        
        setRiders(newRiders);
        setPanicMarkers(newPanic);
        
        // 🔥 Verificar riders en pánico y mostrar alerta si es necesario
       ridersList.forEach(rider => {
    if (rider.en_panico) {
      const alreadyShown = panicAlertShownRef.current.get(rider.id) || false;
      if (!alreadyShown) {
        setTimeout(() => {
          verificarYMostrarAlertaPanico(rider);
        }, 500);
      }
    }
  });
  
  setTimeout(() => {
    updateAllRidersPositions();
    setShowMiniBubble(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, 300);
},

      clearAllRiders: () => {
  setRiders(new Map());
  setPanicMarkers(new Map());
  ocultarTodasBurbujas();
  detenerContadorTiempo();
  
  ridersTimerRef.current.forEach((_, riderId) => {
    detenerContadorRider(riderId);
  });
  
  panicAlertCooldownRef.current.clear();
  panicAlertShownRef.current.clear();
},

      navigateTo: async (lat: number, lng: number, userName: string) => {
        const success = await abrirGoogleMaps(lat, lng, userName);
        if (!success) {
          Alert.alert('Error', 'No se pudo abrir Google Maps');
        }
      },

      cancelarNavegacion: () => {},

      toggleVoz: () => {},

      centrarUbicacion: () => {
        const location = currentLocationRef.current;
        if (location && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      },
    }));

    const getMarkerColor = (estado: string) => {
      switch (estado) {
        case 'conectado': return '#34A853';
        case 'ocupado': return '#FBBC04';
        default: return '#9E9E9E';
      }
    };

    // ========== RENDER ==========
    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          showsUserLocation={false}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsIndoors={true}
          showsTraffic={false}
          zoomControlEnabled={true}
          mapType="standard"
          customMapStyle={getMapStyle(currentTheme)}
          onMapReady={() => {
            setMapReadyState(true);
            if (onMapReady) onMapReady();
          }}
          onRegionChange={handleMapMove}
          onRegionChangeComplete={handleMapMove}
        >
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.currentLocationMarker}>
                <View style={styles.currentLocationDot}>
                  <View style={styles.currentLocationPulse} />
                </View>
              </View>
            </Marker>
          )}

          {Array.from(riders.values()).map(rider => (
            <Marker
              key={`rider-${rider.id}`}
              coordinate={{ latitude: rider.latitud, longitude: rider.longitud }}
              tracksViewChanges={true}
              onPress={() => expandirBurbuja(rider)}
            >
              <View style={[styles.riderMarker, { backgroundColor: getMarkerColor(rider.estado) }]} />
            </Marker>
          ))}

          {Array.from(panicMarkers.values()).map(rider => (
            <Marker
              key={`panic-${rider.id}`}
              coordinate={{ latitude: rider.latitud, longitude: rider.longitud }}
              tracksViewChanges={true}
              onPress={() => expandirBurbuja(rider)}
            >
              <View style={styles.panicMarker}>
                <View style={styles.panicPulse} />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* ===== BURBUJAS MINI ===== */}
        {showMiniBubble && Array.from(riders.values()).map(rider => {
          const riderPos = ridersPositions.get(rider.id);
          const isSelected = selectedRider?.id === rider.id;
          
          if (isSelected || !riderPos) return null;
          
          const riderOnlineTime = ridersOnlineTime.get(rider.id) || 0;
          const isCurrentUser = usuarioActual && rider.id === usuarioActual.id;
          
          return (
            <Animated.View 
              key={`mini-bubble-${rider.id}`}
              style={[
                styles.floatingBubble,
                {
                  left: riderPos.x - 130,
                  top: riderPos.y - 90,
                  opacity: fadeAnim,
                }
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => expandirBurbuja(rider)}
                style={styles.miniBubbleTouchable}
              >
                <View style={styles.miniBubbleContent}>
                  <View style={styles.miniBubbleAvatar}>
                    <Text style={styles.miniBubbleAvatarText}>
                      {rider.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.miniBubbleInfo}>
                    <Text style={styles.miniBubbleName} numberOfLines={1}>
                      {rider.nombre} {isCurrentUser && '⭐'}
                    </Text>
                    <View style={styles.miniBubbleStatusRow}>
                      <View style={[styles.miniBubbleStatusDot, { backgroundColor: rider.en_panico ? '#FF0000' : '#34A853' }]} />
                      <Text style={[styles.miniBubbleStatusText, rider.en_panico && styles.miniBubbleStatusTextPanic]}>
                        {rider.en_panico ? '🚨 EMERGENCIA' : 'Disponible'}
                      </Text>
                    </View>
                    {rider.estado !== 'desconectado' && riderOnlineTime > 0 && (
                      <Text style={styles.miniBubbleTimerText}>
                        ⏱ {formatearTiempo(riderOnlineTime)}
                      </Text>
                    )}
                    {rider.telefono && (
                      <Text style={styles.miniBubblePhoneText} numberOfLines={1}>
                        📱 {rider.telefono}
                      </Text>
                    )}
                  </View>
                  <View style={styles.miniBubbleExpandIcon}>
                    <Text style={styles.miniBubbleExpandText}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={[styles.bubbleConnector, rider.en_panico && styles.bubbleConnectorPanic]} />
            </Animated.View>
          );
        })}

        {/* ===== BURBUJA EXPANDIDA ===== */}
        {showExpandedBubble && bubbleUser && bubbleScreenPos && (
          <Animated.View 
            style={[
              styles.floatingExpandedBubble,
              {
                left: bubbleScreenPos.x - 200,
                top: bubbleScreenPos.y,
                opacity: expandAnim,
                transform: [{ scale: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                })}]
              }
            ]}
            pointerEvents="box-none"
          >
            <View style={[
              styles.expandedBubbleContainer,
              bubbleUser.en_panico && styles.expandedBubbleContainerPanic
            ]}>
              <View style={styles.bubbleHeader}>
                <View style={[
                  styles.bubbleAvatar,
                  bubbleUser.en_panico && styles.bubbleAvatarPanic
                ]}>
                  <Text style={styles.bubbleAvatarText}>
                    {bubbleUser.nombre.charAt(0).toUpperCase()}
                  </Text>
                  <View style={[
                    styles.bubbleStatusDot,
                    { backgroundColor: bubbleUser.en_panico ? '#FF0000' : '#34A853' }
                  ]} />
                </View>
                <View style={styles.bubbleHeaderInfo}>
                  <Text style={styles.bubbleName}>{bubbleUser.nombre}</Text>
                  <View style={styles.bubbleStatusRow}>
                    <View style={[
                      styles.bubbleStatusSmallDot,
                      { backgroundColor: bubbleUser.en_panico ? '#FF0000' : '#34A853' }
                    ]} />
                    <Text style={[
                      styles.bubbleStatusText,
                      bubbleUser.en_panico && styles.bubbleStatusTextPanic
                    ]}>
                      {bubbleUser.en_panico ? '🚨 EMERGENCIA' : 'Disponible'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.bubbleClose}
                  onPress={contraerBurbuja}
                >
                  <Text style={styles.bubbleCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bubbleDivider} />

              <View style={styles.bubbleDetails}>
                {bubbleUser.estado !== 'desconectado' && (
                  <View style={styles.bubbleDetailRow}>
                    <Text style={styles.bubbleDetailLabel}>⏱ Tiempo en línea</Text>
                    <Text style={[styles.bubbleDetailValue, styles.bubbleTimerValue]}>
                      {formatearTiempo(ridersOnlineTime.get(bubbleUser.id) || 0)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailLabel}>📍 Ubicación</Text>
                  <Text style={styles.bubbleDetailValue} numberOfLines={1}>
                    {bubbleUser.direccion || `${bubbleUser.latitud.toFixed(6)}, ${bubbleUser.longitud.toFixed(6)}`}
                  </Text>
                </View>

                {bubbleUser.vehiculo && (
                  <View style={styles.bubbleDetailRow}>
                    <Text style={styles.bubbleDetailLabel}>🚗 Vehículo</Text>
                    <Text style={styles.bubbleDetailValue}>{bubbleUser.vehiculo}</Text>
                  </View>
                )}

                {bubbleUser.placas && (
                  <View style={styles.bubbleDetailRow}>
                    <Text style={styles.bubbleDetailLabel}>🔢 Placas</Text>
                    <Text style={styles.bubbleDetailValue}>{bubbleUser.placas}</Text>
                  </View>
                )}

                {bubbleUser.telefono && (
                  <View style={styles.bubbleDetailRow}>
                    <Text style={styles.bubbleDetailLabel}>📱 Teléfono</Text>
                    <Text style={styles.bubbleDetailValue}>{bubbleUser.telefono}</Text>
                  </View>
                )}
                
                {bubbleUser.en_panico && bubbleUser.tipo_emergencia && (
  <View style={styles.bubbleDetailRow}>
    <Text style={[styles.bubbleDetailLabel, styles.bubbleDetailLabelPanic]}>🚨 Emergencia</Text>
    <Text style={[styles.bubbleDetailValue, styles.bubbleDetailValuePanic]}>
      activada
    </Text>
  </View>
)}
              </View>

              <View style={styles.bubbleDivider} />

              <View style={styles.bubbleActions}>
                <TouchableOpacity
                  style={[styles.bubbleActionBtn, styles.bubbleActionPrimary]}
                  onPress={async () => {
                    if (!currentLocationRef.current) {
                      Alert.alert('Error', 'No se puede obtener tu ubicación');
                      return;
                    }
                    const success = await abrirGoogleMaps(
                      bubbleUser.latitud,
                      bubbleUser.longitud,
                      bubbleUser.nombre
                    );
                    if (!success) {
                      Alert.alert('Error', 'No se pudo abrir Google Maps');
                    }
                  }}
                >
                  <Text style={styles.bubbleActionIcon}>📍</Text>
                  <Text style={styles.bubbleActionText}>Cómo llegar</Text>
                </TouchableOpacity>

                {bubbleUser.telefono && (
                  <TouchableOpacity
                    style={[styles.bubbleActionBtn, styles.bubbleActionSecondary]}
                    onPress={() => Linking.openURL(`tel:${bubbleUser.telefono}`)}
                  >
                    <Text style={styles.bubbleActionIcon}>📞</Text>
                    <Text style={[styles.bubbleActionText, { color: '#1A1A1A' }]}>
                      Llamar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.bubbleFooter}>
                <Text style={styles.bubbleFooterText}>
                  Última actualización: {bubbleUser.ultima_actualizacion || 'Hoy, ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={[
                  styles.liveIndicator,
                  bubbleUser.en_panico && styles.liveIndicatorPanic
                ]}>
                  <View style={[
                    styles.liveDot,
                    bubbleUser.en_panico && styles.liveDotPanic
                  ]} />
                  <Text style={[
                    styles.liveText,
                    bubbleUser.en_panico && styles.liveTextPanic
                  ]}>
                    {bubbleUser.en_panico ? 'EMERGENCIA' : 'EN VIVO'}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ===== BOTÓN PARA CAMBIAR TEMA ===== */}
        <TouchableOpacity
          style={styles.themeButton}
          onPress={() => setShowThemeModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.themeButtonText}>
            {getThemeIcon(currentTheme)}
          </Text>
          <View style={styles.themeIndicator} />
        </TouchableOpacity>

        {/* ===== MODAL DE SELECCIÓN DE TEMA ===== */}
        <Modal
          visible={showThemeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowThemeModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowThemeModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎨 Tema del Mapa</Text>
                <TouchableOpacity
                  onPress={() => setShowThemeModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.themeGrid}>
                {(['light', 'dark'] as MapTheme[]).map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={[
                      styles.themeOption,
                      currentTheme === theme && styles.themeOptionActive,
                    ]}
                    onPress={() => cambiarTema(theme)}
                  >
                    <Text style={styles.themeOptionIcon}>{getThemeIcon(theme)}</Text>
                    <Text style={[
                      styles.themeOptionLabel,
                      currentTheme === theme && styles.themeOptionLabelActive,
                    ]}>
                      {getThemeLabel(theme)}
                    </Text>
                    {currentTheme === theme && (
                      <View style={styles.themeCheckmark}>
                        <Text style={styles.themeCheckmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ===== INDICADOR DE GOOGLE MAPS ===== */}
        <View style={styles.infoIndicator}>
          <Text style={styles.infoIndicatorText}>
            {isGoogleMapsInstalled ? '📱 Google Maps' : '🌐 Navegador'}
          </Text>
        </View>
      </View>
    );
  }
);

GoogleMapView.displayName = 'GoogleMapView';

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },

  floatingBubble: {
    position: 'absolute',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingExpandedBubble: {
    position: 'absolute',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniBubbleTouchable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    minWidth: 220,
  },
  miniBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  miniBubbleAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  miniBubbleAvatarText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
  miniBubbleInfo: {
    flex: 1,
    minWidth: 100,
  },
  miniBubbleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  miniBubbleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniBubbleStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  miniBubbleStatusText: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  miniBubbleStatusTextPanic: {
    color: '#FF0000',
    fontWeight: '700',
  },
  miniBubblePhoneText: {
    fontSize: 11,
    color: '#1A73E8',
    fontWeight: '500',
    marginTop: 1,
  },
  miniBubbleTimerText: {
    fontSize: 11,
    color: '#1A73E8',
    fontWeight: '600',
    marginTop: 1,
  },
  miniBubbleExpandIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F3F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBubbleExpandText: {
    fontSize: 16,
    color: '#5F6368',
    fontWeight: 'bold',
  },

  bubbleConnector: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleConnectorPanic: {
    borderColor: '#FF0000',
    borderWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },

  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34A853',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 168, 83, 0.15)',
    position: 'absolute',
    top: -10,
    left: -10,
  },

  riderMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  panicMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF0000',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panicPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },

  expandedBubbleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    width: 380,
    maxWidth: width - 30,
  },
  expandedBubbleContainerPanic: {
    borderColor: '#FF0000',
    borderWidth: 1.5,
    shadowColor: '#FF0000',
    shadowOpacity: 0.3,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bubbleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleAvatarPanic: {
    backgroundColor: '#FF0000',
    shadowColor: '#FF0000',
  },
  bubbleAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bubbleStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bubbleHeaderInfo: {
    flex: 1,
  },
  bubbleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bubbleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bubbleStatusSmallDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  bubbleStatusText: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  bubbleStatusTextPanic: {
    color: '#FF0000',
    fontWeight: '700',
  },
  bubbleClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleCloseText: {
    fontSize: 16,
    color: '#5F6368',
    fontWeight: 'bold',
  },
  bubbleDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  bubbleDetails: {
    marginBottom: 4,
  },
  bubbleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bubbleDetailLabel: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  bubbleDetailLabelPanic: {
    color: '#FF0000',
    fontWeight: '600',
  },
  bubbleDetailValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  bubbleDetailValuePanic: {
    color: '#FF0000',
    fontWeight: '700',
  },
  bubbleTimerValue: {
    color: '#1A73E8',
    fontWeight: '700',
  },
  bubbleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  bubbleActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  bubbleActionPrimary: {
    backgroundColor: '#1A73E8',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleActionSecondary: {
    backgroundColor: '#F1F3F4',
  },
  bubbleActionIcon: {
    fontSize: 16,
  },
  bubbleActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bubbleFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  bubbleFooterText: {
    fontSize: 11,
    color: '#6B6B6B',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveIndicatorPanic: {
    backgroundColor: '#FFEBEE',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34A853',
    marginRight: 5,
  },
  liveDotPanic: {
    backgroundColor: '#FF0000',
  },
  liveText: {
    fontSize: 10,
    color: '#34A853',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  liveTextPanic: {
    color: '#FF0000',
  },

  themeButton: {
    position: 'absolute',
    bottom: 160,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  themeButtonText: {
    fontSize: 28,
    lineHeight: 32,
  },
  themeIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1A73E8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: width * 0.8,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F3F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#5F6368',
    fontWeight: 'bold',
  },
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  themeOptionActive: {
    borderColor: '#1A73E8',
    backgroundColor: '#E8F0FE',
  },
  themeOptionIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  themeOptionLabel: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '500',
  },
  themeOptionLabelActive: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  themeCheckmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  infoIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  infoIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
});

export default GoogleMapView;