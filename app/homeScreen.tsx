import { authService } from "@/services/auth/AuthService";
import { AudioSession, LiveKitRoom } from "@livekit/react-native";
import { useKeepAwake } from "expo-keep-awake";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  PermissionsAndroid,
  Platform, // ✅ nuevo: para pedir permiso de micrófono en Android
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
import LkDebug from "@/components/monitoreo/Lkdebug";

import { api } from "@/services/conector/api";
import { SoundService } from "@/services/home/SoundService";
import { userService, type PerfilPublico } from "@/services/user/userService";

import { useUserData } from "@/hooks/home/useUserData";
import { useLocationTracking } from "@/hooks/monitoreo/useLocationTracking";
import { usePanic } from "@/hooks/monitoreo/usePanic";
import { useRidersRealtime } from "@/hooks/monitoreo/useRidersRealtime";
import { useLiveKitToken } from "@/services/monitoreo/useLiveKitToken";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const PANEL_EXPANDED = 200;
const PANEL_COLLAPSED = 120;
const DRAG_RANGE = PANEL_EXPANDED - PANEL_COLLAPSED;

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const raw = params ?? {};

  const user = useUserData(raw, {
    onAccountDisabled: () => {
      router.replace("/login");
    },
  });

  const [conectado, setConectado] = useState(false);
  const [cargandoConexion, setCargandoConexion] = useState(false);

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

  useKeepAwake();
  const mapRef = useRef<GoogleMapViewRef | null>(null);

  // ============================================================
  // ✅ Iniciar sesión de audio (necesario para que LiveKit capture)
  // ============================================================
  useEffect(() => {
    let start = async () => {
      try {
        await AudioSession.startAudioSession();
        console.log("[AudioSession] started");
      } catch (e: any) {
        console.log("[AudioSession] start error:", e?.message);
      }
    };
    start();
    return () => {
      AudioSession.stopAudioSession().catch(() => {});
      console.log("[AudioSession] stopped");
    };
  }, []);

  // ============================================================
  // PERFIL COMPLEMENTARIO
  // ============================================================
  const [perfilApi, setPerfilApi] = useState<PerfilPublico | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, []),
  );

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user.userIdNum) return;
      setCargandoPerfil(true);
      try {
        const perfil = await userService.getUserById(user.userIdNum);
        if (active && perfil) setPerfilApi(perfil);
      } catch (e: any) {
        console.log("[HomeScreen] getUserById error:", e?.message);
      } finally {
        if (active) setCargandoPerfil(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user.userIdNum, refreshKey]);

  const grupoMostrar =
    perfilApi?.grupo || user.grupoNombre || "Delivery Sobre Ruedas";
  const avatarMostrar = perfilApi?.avatar_url || user.avatarUrl || null;
  const ciudadMostrar = perfilApi?.ciudad || user.ciudad || "";
  const telefonoMostrar = perfilApi?.telefono || user.telefono || "";
  const emailMostrar = perfilApi?.email || user.email || "";

  // ============================================================
  // ANIMACIÓN DEL PANEL
  // ============================================================
  const translateY = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > Math.abs(gesture.dx),
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
  const { livekitToken, livekitUrl, tokenRef, audioReady } =
    useLiveKitToken(conectado);

  const { sinPermiso, ubicacionLista, iniciarMonitoreo, detenerMonitoreo } =
    useLocationTracking({ mapRef, tokenRef });

  const {
    obtenerRepartidores,
    suprimirAlertasRef,
    alertasPanicoMostradasRef,
    cooldownPanicoRef,
  } = useRidersRealtime({
    conectado,
    userIdNum: user.userIdNum,
    grupoId: user.grupoId,
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

  // ============================================================
  // ✅ toggleConexion con solicitud de permiso de micrófono
  // ============================================================
  const toggleConexion = useCallback(async (): Promise<boolean> => {
    if (cargandoConexion) return false;

    // ✅ Pedir permiso de micrófono en Android antes de conectar
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Micrófono",
            message:
              "Necesitamos el micrófono para el monitoreo por voz del grupo.",
            buttonPositive: "Permitir",
            buttonNegative: "Cancelar",
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permiso requerido",
            "Activa el micrófono en los ajustes del sistema para usar el monitoreo.",
          );
          return false;
        }
      } catch (e: any) {
        console.log("[HomeScreen] permission error:", e?.message);
        return false;
      }
    }

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

  const handleLogout = useCallback(async () => {
    closeDrawer();
    try {
      await authService.logout();
    } catch (e: any) {
      console.log("[HomeScreen] logout error:", e?.message);
    }
    router.replace("/login");
  }, [closeDrawer, router]);

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
      connect={conectado && audioReady && !!livekitToken && !!livekitUrl}
      audio={true} // ✅ publica automáticamente el micrófono al conectar
      video={false}
      onConnected={() => console.log("[LiveKit] Conectado")}
      onDisconnected={() => console.log("[LiveKit] Desconectado")}
      // ✅ requestPermissions eliminado (era inválido)
    >
      <LkDebug />
      <SafeAreaView
        style={[
          styles.container,
          { paddingTop: Platform.OS === "android" ? 49 : 0 },
        ]}
      >
        <AppHeader
          userName={user.nombreCompleto}
          subtitle={grupoMostrar}
          avatarUrl={avatarMostrar}
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

        <UserDrawer
          visible={drawerVisible}
          onClose={closeDrawer}
          user={{
            nombreCompleto: user.nombreCompleto,
            telefono: telefonoMostrar,
            userIdNum: user.userIdNum,
            email: emailMostrar,
            rol: "conductor",
            avatarUrl: avatarMostrar,
            grupoNombre: grupoMostrar,
            ciudad: ciudadMostrar,
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
  container: { flex: 1, backgroundColor: "#000000" },
  mapContainer: { flex: 1, overflow: "hidden" },
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
  handle: { width: 46, height: 5, borderRadius: 3, backgroundColor: "#940000" },
});
