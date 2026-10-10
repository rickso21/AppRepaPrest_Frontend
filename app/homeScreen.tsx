import { LiveKitRoom } from "@livekit/react-native";
import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  SafeAreaView,
  StyleSheet,
  Vibration,
  View,
} from "react-native";

import AppHeader from "@/components/AppHeader";
import UserDrawer from "@/components/UserDrawer";
import BottomZone from "@/components/home/BottomZone";
import MapSection from "@/components/home/MapSection";
import { GoogleMapViewRef } from "@/components/maps/GoogleMapView";

import { api } from "@/services/conector/api";
import { SoundService } from "@/services/home/SoundService";

import { useLiveKitToken } from "@/hooks/home/useLiveKitToken";
import { useLocationTracking } from "@/hooks/home/useLocationTracking";
import { usePanic } from "@/hooks/home/usePanic";
import { useRidersPolling } from "@/hooks/home/useRidersPolling";
import { useUserData } from "@/hooks/home/useUserData";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const PANEL_EXPANDED = 200;
const PANEL_COLLAPSED = 120;

// Rango de arrastre
const DRAG_RANGE = PANEL_EXPANDED - PANEL_COLLAPSED;

type Props = { route?: { params?: any } };

export default function HomeScreen({ route }: Props) {
  const router = useRouter();
  const raw = route?.params ?? {};

  //useUserData con callback de redirección al eliminar cuenta
  const user = useUserData(raw, {
    onAccountDisabled: () => {
      router.replace("/login");
    },
  });

  const [conectado, setConectado] = useState(false);
  const [cargandoConexion, setCargandoConexion] = useState(false);

  // Drawer + notificaciones
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notifications] = useState([
    {
      id: "1",
      titulo: "Bienvenido",
      mensaje: "Tu cuenta está activa.",
      fecha: "Hoy",
      leida: false,
    },
  ]);
  const noLeidas = notifications.filter((n) => !n.leida).length;

  useKeepAwake();
  const mapRef = useRef<GoogleMapViewRef | null>(null);

  // ============================================================
  // ANIMACIÓN DEL PANEL
  // ============================================================
  const translateY = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderGrant: () => {
        translateY.setOffset(currentOffset.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        let next = gesture.dy;
        if (next < 0) next = 0;
        if (next > DRAG_RANGE) next = DRAG_RANGE;
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        translateY.flattenOffset();

        const shouldCollapse =
          gesture.vy > 0.4 ||
          (gesture.vy >= -0.4 &&
            currentOffset.current + gesture.dy > DRAG_RANGE / 2);

        const finalValue = shouldCollapse ? DRAG_RANGE : 0;
        currentOffset.current = finalValue;

        Animated.spring(translateY, {
          toValue: finalValue,
          useNativeDriver: true,
          bounciness: 4,
          speed: 14,
        }).start();
      },
    }),
  ).current;

  // ============================================================

  const { livekitToken, livekitUrl, tokenRef } = useLiveKitToken(conectado);

  const { sinPermiso, ubicacionLista, iniciarMonitoreo, detenerMonitoreo } =
    useLocationTracking({ mapRef, tokenRef });

  const {
    obtenerRepartidores,
    suprimirAlertasRef,
    alertasPanicoMostradasRef,
    cooldownPanicoRef,
  } = useRidersPolling({
    conectado,
    userIdNum: user.userIdNum,
    mapRef,
    tokenRef,
  });

  const { panicoActivo, cargandoPanico, togglePanico } = usePanic({
    tokenRef,
    userIdNum: user.userIdNum,
    conectado,
    suprimirAlertasRef,
    alertasPanicoMostradasRef,
    cooldownPanicoRef,
  });

  const toggleConexion = useCallback(async (): Promise<boolean> => {
    if (cargandoConexion) return false;
    setCargandoConexion(true);
    const nuevoEstado = conectado ? "desconectado" : "conectado";
    try {
      if (!tokenRef.current) {
        Alert.alert("Error", "Sesión no válida.");
        return false;
      }
      const { data } = await api.post("/mapa/estado", { estado: nuevoEstado });
      if (data?.res) {
        setConectado(nuevoEstado === "conectado");
        if (nuevoEstado === "conectado") {
          iniciarMonitoreo().catch(() => {});
          setTimeout(obtenerRepartidores, 1000);
        } else {
          detenerMonitoreo();
          mapRef.current?.clearAllRiders();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setCargandoConexion(false);
    }
  }, [
    conectado,
    cargandoConexion,
    iniciarMonitoreo,
    detenerMonitoreo,
    obtenerRepartidores,
    tokenRef,
    mapRef,
  ]);

  const panicoActivoRef = useRef(panicoActivo);
  useEffect(() => {
    panicoActivoRef.current = panicoActivo;
  }, [panicoActivo]);

  useEffect(() => {
    return () => {
      SoundService.stopAll().catch(() => {});
      Vibration.cancel();
      if (panicoActivoRef.current && tokenRef.current) {
        api.post("/mapa/panico", { accion: "desactivar" }).catch(() => {});
      }
    };
  }, [tokenRef]);

  // Handlers del drawer
  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);

  const goToPerfil = useCallback(() => {
    closeDrawer();
    setTimeout(() => {
      router.push({
        pathname: "/perfil",
        params: { userName: user.nombreCompleto },
      });
    }, 180);
  }, [router, user.nombreCompleto, closeDrawer]);

  const handleLogout = useCallback(() => {
    closeDrawer();
    // TODO: limpiar token + router.replace("/login")
  }, [closeDrawer]);

  // NUEVO: eliminar cuenta
  const handleDisableAccount = useCallback(() => {
    closeDrawer();
    setTimeout(() => {
      user.handleInhabilitarCuenta();
    }, 250);
  }, [closeDrawer, user]);
  return (
    <LiveKitRoom
      serverUrl={livekitUrl ?? ""}
      token={livekitToken ?? ""}
      connect={conectado && !!livekitToken && !!livekitUrl}
      audio={true}
      video={false}
      onConnected={() => console.log("[LiveKit] Conectado")}
      onDisconnected={() => console.log("[LiveKit] Desconectado")}
    >
      <SafeAreaView
        style={[
          styles.container,
          { paddingTop: Platform.OS === "android" ? 49 : 0 },
        ]}
      >
        <AppHeader
          userName={user.nombreCompleto}
          subtitle={user.grupoNombre || "Delivery Sobre Ruedas"}
          avatarUrl={user.avatarUrl}
          onAvatarPress={openDrawer}
        />

        <View style={styles.mapContainer}>
          <MapSection
            mapRef={mapRef}
            conectado={conectado}
            ubicacionLista={ubicacionLista}
            sinPermiso={sinPermiso}
            height={SCREEN_HEIGHT}
            onMapReady={() => {
              if (conectado) iniciarMonitoreo();
            }}
            usuarioActual={{
              id: user.userIdNum,
              nombre: user.nombreCompleto,
              rol: "conductor",
              telefono: user.telefono || "",
            }}
          />
        </View>

        <Animated.View
          style={[
            styles.panel,
            {
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [0, DRAG_RANGE],
                    outputRange: [0, DRAG_RANGE],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <BottomZone
            conectado={conectado}
            cargandoConexion={cargandoConexion}
            cargandoPanico={cargandoPanico}
            panicoActivo={panicoActivo}
            onToggleConexion={toggleConexion}
            onTogglePanico={togglePanico}
            onMicChange={() => {}}
          />
        </Animated.View>

        {/*UserDrawer con onDeleteAccount */}
        <UserDrawer
          visible={drawerVisible}
          onClose={closeDrawer}
          user={{
            nombreCompleto: user.nombreCompleto,
            telefono: user.telefono,
            userIdNum: user.userIdNum,
            email: user.email,
            rol: "conductor",
            avatarUrl: user.avatarUrl,
          }}
          notifications={notifications}
          onOpenProfile={goToPerfil}
          onOpenNotifications={closeDrawer}
          onLogout={handleLogout}
          onDisableAccount={handleDisableAccount}
          disabling={user.inhabilitando}
        />
      </SafeAreaView>
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },

  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: PANEL_EXPANDED,
    backgroundColor: "#16161F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 18,
  },

  handleContainer: {
    width: "100%",
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },

  handle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ff3535",
  },
});
