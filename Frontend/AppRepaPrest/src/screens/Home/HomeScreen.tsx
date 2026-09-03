// screens/HomeScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from './Home';
import AppHeader from '../../components/AppHeader';
import { api } from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import { SoundService } from '../../services/SoundService';
import * as Location from 'expo-location';
import GoogleMapView, { GoogleMapViewRef } from '../../components/maps/GoogleMapView';

type Props = BottomTabScreenProps<HomeTabParamList, 'Home'>;

const { height } = Dimensions.get('window');

export default function HomeScreen({ route }: Props): JSX.Element {
  const { userName, userId } = route.params;

  // ========== ESTADOS ==========
  const [conectado, setConectado] = useState(false);
  const [sinPermiso, setSinPermiso] = useState(false);
  const [ubicacionLista, setUbicacionLista] = useState(false);
  const [panicoActivo, setPanicoActivo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [alertasPanicoMostradas, setAlertasPanicoMostradas] = useState<Set<number>>(new Set());
  const [enviandoPanico, setEnviandoPanico] = useState(false);
  const [microfonoActivo, setMicrofonoActivo] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ========== REFS ==========
  const mapRef = useRef<GoogleMapViewRef>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(null);
const alertasPanicoMostradasRef = useRef<Set<number>>(new Set());
const cooldownPanicoRef = useRef<Map<number, number>>(new Map());


  // ========== OBTENER TOKEN ==========
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        tokenRef.current = token;
      } catch (error) {
        //console.error('Error obteniendo token:', error);
      }
    };
    getToken();
  }, []);

  // ========== FUNCIONES API ==========

  const enviarUbicacion = useCallback(async (lat: number, lng: number) => {
    if (!tokenRef.current) return;
    try {
      const response = await api.post('/mapa/ubicacion', {
        latitud: lat,
        longitud: lng
      });
      if (response.data.res) setUbicacionLista(true);
    } catch (error: any) {
      //console.error('Error enviando ubicación:', error?.response?.data || error.message);
    }
  }, []);

 const obtenerRepartidores = useCallback(async () => {
  if (!conectado || !tokenRef.current || !mapRef.current) return;

  try {
    const response = await api.get('/mapa/repartidores');

    if (response.data.res) {
      const usuariosConectados = response.data.data;
      const usuariosActivos = usuariosConectados.filter((user: any) =>
        user.estado === 'conectado' || user.en_panico === true
      );

      // Actualizar mapa
      mapRef.current.loadAllRiders(usuariosActivos);

      // 🔥 Obtener IDs de usuarios EN PÁNICO
      const idsEnPanico = new Set(
        usuariosConectados
          .filter((user: any) => user.en_panico === true)
          .map((user: any) => user.id)
      );

      // 🔥 LIMPIAR la ref: eliminar IDs que ya NO están en pánico
      const alertasMostradas = alertasPanicoMostradasRef.current;
      for (const id of alertasMostradas) {
        if (!idsEnPanico.has(id)) {
          alertasMostradas.delete(id);
          // 🔥 También limpiar cooldown cuando sale de pánico
          cooldownPanicoRef.current.delete(id);
        }
      }

      // 🔥 PROCESAR nuevas alertas de pánico
      const now = Date.now();
      usuariosConectados.forEach((user: any) => {
        if (user.en_panico && !alertasMostradas.has(user.id)) {
          // 🔥 Verificar cooldown (evitar duplicados en el mismo ciclo)
          const lastAlert = cooldownPanicoRef.current.get(user.id) || 0;
          if (now - lastAlert < 5000) {
            // Si pasaron menos de 5 segundos, ignorar
            return;
          }

          // Marcar como mostrada en la REF
          alertasMostradas.add(user.id);
          
          //Guardar timestamp del cooldown
          cooldownPanicoRef.current.set(user.id, now);

          // Reproducir sonido y vibración
          SoundService.playAlarma();
          Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
          
        }
      });
    }
  } catch (error: any) {
    //console.error('Error:', error?.response?.data || error.message);
  }
}, [conectado]);

  const cambiarEstado = useCallback(async (estado: 'conectado' | 'desconectado') => {
    if (!tokenRef.current) return;
    try {
      const response = await api.post('/mapa/estado', { estado });
      return response.data;
    } catch (error: any) {
      //console.error('Error cambiando estado:', error?.response?.data || error.message);
      throw error;
    }
  }, []);

  const togglePanicoAPI = useCallback(async (accion: 'activar' | 'desactivar', data?: any) => {
    if (!tokenRef.current) return;
    try {
      const response = await api.post('/mapa/panico', { accion, ...data });
      return response.data;
    } catch (error: any) {
      //console.error('Error en pánico:', error?.response?.data || error.message);
      throw error;
    }
  }, []);

  // ========== INICIAR MONITOREO ==========
  const iniciarMonitoreo = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setSinPermiso(true);
      return;
    }
    setSinPermiso(false);

    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      await enviarUbicacion(latitude, longitude);

      if (mapRef.current) {
        mapRef.current.updateMyLocation(latitude, longitude);
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const { latitude: lat, longitude: lng } = loc.coords;

          await enviarUbicacion(lat, lng);

          if (mapRef.current) {
            mapRef.current.updateMyLocation(lat, lng);
          }
        } catch (error) {
          //console.error('Error en intervalo de ubicación:', error);
        }
      }, 5000);

    } catch (error) {
      //console.error('Error iniciando monitoreo:', error);
      Alert.alert('Error', 'No se pudo iniciar el monitoreo de ubicación');
    }
  }, [enviarUbicacion]);

  // ========== OBTENER REPARTIDORES EN INTERVALO ==========
  useEffect(() => {
    let repartidoresInterval: NodeJS.Timeout | null = null;

    if (conectado) {
      obtenerRepartidores();
      repartidoresInterval = setInterval(() => {
        obtenerRepartidores();
      }, 3000);
    } else {
      if (mapRef.current) {
        mapRef.current.clearAllRiders();
      }
    }

    return () => {
      if (repartidoresInterval) {
        clearInterval(repartidoresInterval);
      }
    };
  }, [conectado, obtenerRepartidores]);

  // ========== CONECTAR/DESCONECTAR ==========
  const toggleConexion = async () => {
    setCargando(true);
    const nuevoEstado = conectado ? 'desconectado' : 'conectado';

    try {
      const data = await cambiarEstado(nuevoEstado);

      if (data?.res) {
        setConectado(nuevoEstado === 'conectado');

        if (nuevoEstado === 'conectado') {
          await iniciarMonitoreo();
          setTimeout(() => {
            obtenerRepartidores();
          }, 1000);
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setUbicacionLista(false);

          if (mapRef.current) {
            mapRef.current.clearAllRiders();
          }
        }
      } else {
        Alert.alert('Error', data?.msg || 'No se pudo cambiar el estado');
      }
    } catch (error: any) {
      console.error('Error en toggleConexion:', error);
      Alert.alert('Error', 'Ocurrió un error al cambiar el estado');
    }
    setCargando(false);
  };

  // ========== DESACTIVAR PÁNICO DIRECTO ==========
  const desactivarPanicoDirecto = useCallback(async () => {
    try {
      // Detener sonidos y vibración
      await SoundService.stopAll();
      Vibration.cancel();
      
      // Enviar desactivación al backend
      const response = await togglePanicoAPI('desactivar', { accion: 'desactivar' });
      
      if (response?.res) {
        setPanicoActivo(false);
        
        // Sonido de confirmación
        await SoundService.playConfirmacion();
        
        Alert.alert(
          'ALERTA DESACTIVADA',
          'La alerta de pánico ha sido desactivada correctamente.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', response?.msg || 'No se pudo desactivar la alerta');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al desactivar la alerta');
    }
  }, [togglePanicoAPI]);

  // ========== PÁNICO CON SONIDO Y VIBRACIÓN ==========
  const togglePanico = async () => {
    // Evitar múltiples envíos simultáneos
    if (enviandoPanico) {
      return;
    }

    if (!conectado) {
      Alert.alert('Error', 'Conéctate primero para usar el botón de pánico');
      return;
    }

    // Si ya está activo, usar desactivación directa
    if (panicoActivo) {
      await desactivarPanicoDirecto();
      return;
    }

    setCargando(true);
    setEnviandoPanico(true);

    try {
      const accion = 'activar';
      let data: any = { accion };

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      data.latitud = location.coords.latitude;
      data.longitud = location.coords.longitude;
      data.tipo_emergencia = 'asaltado';

      // Enviar al backend
      const response = await togglePanicoAPI(accion, data);

      if (response?.res) {
        setPanicoActivo(true);
        
        // Sonidos y vibración
        await SoundService.playAlarma();
        Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
        
        // Mostrar alerta con opciones
        Alert.alert(
          'ALERTA DE PELIGRO ACTIVO',
          'Se ha notificado a todos los repartidores cercanos.',
          [
            { 
              text: 'DESACTIVAR ALERTA', 
              onPress: () => {
                // Llamar a desactivación directa
                desactivarPanicoDirecto();
              },
              style: 'destructive' 
            },
            { text: 'OK', style: 'cancel' }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', response?.msg || 'No se pudo activar la alerta');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al activar el pánico');
    }
    
    setCargando(false);
    setEnviandoPanico(false);
  };

  // ========== MICRÓFONO ==========
  const toggleMicrofono = useCallback(async () => {
    if (!conectado) {
      Alert.alert('Error', 'Conéctate primero para usar el micrófono');
      return;
    }

    if (microfonoActivo) {
      // Desactivar micrófono
      setMicrofonoActivo(false);
      Alert.alert('Micrófono', 'Micrófono desactivado');
    } else {
      // Activar micrófono
      setMicrofonoActivo(true);
      Alert.alert('🎤 Micrófono Activado', 'Escuchando comandos de voz...');
    }
  }, [conectado, microfonoActivo]);

  // ========== LIMPIEZA ==========
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      SoundService.stopAll();
    };
  }, []);

  // ========== RENDER ==========
  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 49 : 0 }]}>
      <AppHeader userName={userName} subtitle="MONITOREO EN VIVO" />

      <View style={[styles.mapWrapper, Platform.OS === 'android' && { height: height * 0.53 }]}>
        <View style={styles.mapCard}>
          <GoogleMapView
  ref={mapRef}
  onMapReady={() => {
    setMapReady(true);
    if (conectado) iniciarMonitoreo();
  }}
  usuarioActual={{
    id: +(userId || 0), // Convierte a número
    nombre: userName || 'Usuario',
    rol: 'conductor',
    telefono: '',
    direccion: '',
    vehiculo: '',
    placas: '',
  }}
/>

          {!ubicacionLista && !sinPermiso && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#FF6B35" size="small" />
              <Text style={styles.loadingText}>Conectando GPS...</Text>
            </View>
          )}

          <View style={[styles.statusBadge, styles.statusBadgeLeft, conectado ? styles.statusConectado : styles.statusDesconectado]}>
            <View style={[styles.statusDot, conectado && styles.statusDotVerde]} />
            <Text style={styles.statusBadgeText}>{conectado ? 'En línea' : 'Desconectado'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomZone}>
        {/* Contenedor de botones principales (CONECTAR + MICRÓFONO) */}
        <View style={styles.buttonRow}>
          {/* Botón CONECTAR/DESCONECTAR */}
          <Pressable
            style={[styles.mainButton, conectado && styles.mainButtonActive, styles.flexButton]}
            onPress={toggleConexion}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={conectado ? '#4CAF50' : '#fff'} size="small" />
            ) : (
              <>
                <Ionicons 
                  name={conectado ? 'power' : 'flash'} 
                  size={22} 
                  color={conectado ? '#4CAF50' : '#fff'} 
                />
                <Text style={[styles.mainButtonText, conectado && styles.mainButtonTextActive]}>
                  {conectado ? 'DESACTIVAR UTR' : 'ACTIVAR UTR'}
                </Text>
              </>
            )}
          </Pressable>

          {/* Botón MICRÓFONO */}
          <Pressable
            style={[
              styles.microfonoButton,
              microfonoActivo && styles.microfonoButtonActive,
              !conectado && styles.microfonoButtonDisabled
            ]}
            onPress={toggleMicrofono}
            disabled={!conectado}
          >
            <Ionicons 
              name={microfonoActivo ? 'mic' : 'mic-outline'} 
              size={28} 
              color={microfonoActivo ? '#4CAF50' : '#fff'} 
            />
            {microfonoActivo && (
              <View style={styles.microfonoIndicador}>
                <View style={styles.puntoParpadeanteMic} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Botón PÁNICO */}
        <Pressable
          style={[
            styles.panicoButton, 
            panicoActivo && styles.panicoButtonActivo, 
            !conectado && styles.panicoButtonDisabled
          ]}
          onPress={togglePanico}
          disabled={cargando || !conectado}
        >
          <Ionicons name={panicoActivo ? 'alert-circle' : 'warning'} size={28} color="#000000" />
          <Text style={styles.panicoText}>
            {panicoActivo ? '¡EMERGENCIA ACTIVA!' : 'EMERGENCIA'}
          </Text>
          {panicoActivo && (
            <View style={styles.panicoIndicador}>
              <View style={styles.puntoParpadeante} />
            </View>
          )}
        </Pressable>

        {!conectado && (
          <Text style={styles.ayudaTexto}>Conéctate para ver a tu agrupacion buen camino!</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// ========== ESTILOS ==========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F17' },
  mapWrapper: {
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'android' ? 12 : 6,
    borderRadius: 22,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && { flex: 1 }),
  },
  mapCard: {
    height: '100%',
    backgroundColor: '#1C1C28',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15,15,23,0.92)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  loadingText: { fontSize: 12.5, color: '#fff', fontWeight: '600' },

  statusBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,15,23,0.9)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    top: Platform.select({
      ios: 315,
      android: 410,
      default: 55,
    }),
    left: 14,
    right: 'auto',
    zIndex: 10,
  },
  statusConectado: { borderColor: 'rgba(76,175,80,0.4)' },
  statusDesconectado: { borderColor: 'rgba(107,114,128,0.4)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6B7280' },
  statusDotVerde: { backgroundColor: '#4CAF50' },
  statusBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  microfonoButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  microfonoButtonActive: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderColor: 'rgba(76,175,80,0.4)',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.6,
  },
  microfonoButtonDisabled: {
    opacity: 0.4,
  },
  microfonoIndicador: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  puntoParpadeanteMic: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },

  bottomZone: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#63ce0c',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  mainButtonActive: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.4)',
    shadowOpacity: 0,
    elevation: 0,
  },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  mainButtonTextActive: { color: '#4CAF50' },
  panicoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    opacity: 0.8,
  },
  panicoButtonActivo: {
    opacity: 1,
    backgroundColor: '#B91C1C',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  panicoButtonDisabled: { opacity: 0.4 },
  panicoText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  panicoIndicador: { position: 'absolute', right: 12, top: '50%', transform: [{ translateY: -4 }] },
  puntoParpadeante: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  ayudaTexto: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
});