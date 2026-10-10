import * as Speech from "expo-speech";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  AppState,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import MapView, { LatLng, Marker, PROVIDER_GOOGLE } from "react-native-maps";

const { width } = Dimensions.get("window");

// ============================================
// ESTILOS DEL MAPA (antes en MapStyles.ts)
// ============================================
const lightMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5f5e0" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0e0e0" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c0c0c0" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9e7f5" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#3a3a3a" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#2a2a2a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1f3a2a" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3d3d3d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#3a3a3a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4d4d4d" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2a2a2a" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d1f2d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a6a7a" }],
  },
];

export type MapTheme = "light" | "dark" | "satellite" | "hybrid";

const getMapStyle = (theme: MapTheme): any[] => {
  switch (theme) {
    case "light":
      return lightMapStyle;
    case "dark":
      return darkMapStyle;
    default:
      return lightMapStyle;
  }
};

const getThemeIcon = (theme: MapTheme): string => {
  switch (theme) {
    case "light":
      return "☀️";
    case "dark":
      return "🌙";
    default:
      return "🗺️";
  }
};

const getThemeLabel = (theme: MapTheme): string => {
  switch (theme) {
    case "light":
      return "Día";
    case "dark":
      return "Noche";
    default:
      return "Mapa";
  }
};

// ============================================
// TIPOS
// ============================================
export interface Rider {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  estado: "conectado" | "ocupado" | "desconectado";
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
    const [panicMarkers, setPanicMarkers] = useState<Map<number, Rider>>(
      new Map(),
    );
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [mapReadyState, setMapReadyState] = useState(false);
    const [isFirstLocationUpdate, setIsFirstLocationUpdate] = useState(true);
    const [isGoogleMapsInstalled, setIsGoogleMapsInstalled] = useState(false);

    // ===== ESTADOS PARA EL TEMA =====
    const [currentTheme, setCurrentTheme] = useState<MapTheme>("light");
    const [showThemeModal, setShowThemeModal] = useState(false);

    // ===== ESTADO PARA BURBUJAS DE USUARIO =====
    const [showMiniBubble, setShowMiniBubble] = useState(false);
    const [showExpandedBubble, setShowExpandedBubble] = useState(false);
    const [bubbleUser, setBubbleUser] = useState<Rider | null>(null);
    const [bubbleScreenPos, setBubbleScreenPos] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [ridersPositions, setRidersPositions] = useState<
      Map<number, { x: number; y: number }>
    >(new Map());

    // ===== CONTADORES DE TIEMPO =====
    const [onlineTime, setOnlineTime] = useState(0);
    const [isUserOnline, setIsUserOnline] = useState(false);
    const onlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [ridersOnlineTime, setRidersOnlineTime] = useState<
      Map<number, number>
    >(new Map());
    const ridersTimerRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
      new Map(),
    );

    // ===== CONTROL DE ALERTAS DE PÁNICO =====
    const panicAlertCooldownRef = useRef<Map<number, number>>(new Map());
    const panicAlertShownRef = useRef<Map<number, boolean>>(new Map());

    const usuarioActualIdRef = useRef<number | null>(usuarioActual?.id ?? null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;

    // ========== REFS ==========
    const mapRef = useRef<MapView>(null);
    const locationUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const currentLocationRef = useRef<LatLng | null>(null);
    const appState = useRef(AppState.currentState);

    // ========== TEMA: DERIVADOS ==========
    const isDark = currentTheme === "dark";

    // Paleta que reacciona al tema
    const palette = useMemo(
      () => ({
        // Fondos
        bg: isDark ? "#1a1a1a" : "#FFFFFF",
        bgSecondary: isDark ? "#2a2a2a" : "#F1F3F4",
        bgTertiary: isDark ? "#333333" : "#F8F9FA",
        // Textos
        text: isDark ? "#F5F5F5" : "#1A1A1A",
        textSecondary: isDark ? "#AAAAAA" : "#6B6B6B",
        textMuted: isDark ? "#888888" : "#5F6368",
        // Bordes / divisores
        border: isDark ? "#3a3a3a" : "#F0F0F0",
        borderStrong: isDark ? "#4a4a4a" : "rgba(0,0,0,0.08)",
        // Marca
        primary: "#1A73E8",
        // Estados
        success: "#34A853",
        warning: "#FBBC04",
        danger: "#FF0000",
        // Específicos
        liveBg: isDark ? "#1f3a2a" : "#E8F5E9",
        liveText: isDark ? "#66BB6A" : "#34A853",
        panicBg: isDark ? "#3a1a1a" : "#FFEBEE",
      }),
      [isDark],
    );

    // ========== ESTILOS ==========
    const styles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            flex: 1,
            minHeight: 200,
            backgroundColor: palette.bg,
            borderRadius: 22,
            overflow: "hidden",
          },
          map: {
            flex: 1,
          },

          floatingBubble: {
            position: "absolute",
            zIndex: 999,
            alignItems: "center",
            justifyContent: "center",
          },

          floatingExpandedBubble: {
            position: "absolute",
            zIndex: 999,
            alignItems: "center",
            justifyContent: "center",
          },

          miniBubbleTouchable: {
            backgroundColor: palette.bg,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.5 : 0.25,
            shadowRadius: 16,
            elevation: 10,
            borderWidth: 0.5,
            borderColor: palette.borderStrong,
            minWidth: 220,
          },
          miniBubbleContent: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: 18,
            gap: 12,
          },
          miniBubbleAvatar: {
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: palette.primary,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2.5,
            borderColor: palette.bg,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4,
          },
          miniBubbleAvatarText: {
            color: "#FFFFFF",
            fontSize: 19,
            fontWeight: "bold",
          },
          miniBubbleInfo: {
            flex: 1,
            minWidth: 100,
          },
          miniBubbleName: {
            fontSize: 15,
            fontWeight: "600",
            color: palette.text,
            marginBottom: 2,
          },
          miniBubbleStatusRow: {
            flexDirection: "row",
            alignItems: "center",
          },
          miniBubbleStatusDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            marginRight: 4,
          },
          miniBubbleStatusText: {
            fontSize: 12,
            color: palette.textSecondary,
          },
          miniBubbleStatusTextPanic: {
            color: palette.danger,
            fontWeight: "700",
          },
          miniBubblePhoneText: {
            fontSize: 11,
            color: palette.primary,
            fontWeight: "500",
            marginTop: 1,
          },
          miniBubbleTimerText: {
            fontSize: 11,
            color: palette.primary,
            fontWeight: "600",
            marginTop: 1,
          },
          miniBubbleExpandIcon: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: palette.bgSecondary,
            justifyContent: "center",
            alignItems: "center",
          },
          miniBubbleExpandText: {
            fontSize: 16,
            color: palette.textMuted,
            fontWeight: "bold",
          },

          bubbleConnector: {
            position: "absolute",
            bottom: -8,
            left: "50%",
            marginLeft: -8,
            width: 16,
            height: 16,
            backgroundColor: palette.bg,
            transform: [{ rotate: "45deg" }],
            borderWidth: 0.5,
            borderColor: palette.borderStrong,
            borderTopWidth: 0,
            borderLeftWidth: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          },
          bubbleConnectorPanic: {
            borderColor: palette.danger,
            borderWidth: 1,
            borderTopWidth: 0,
            borderLeftWidth: 0,
          },

          currentLocationMarker: {
            alignItems: "center",
            justifyContent: "center",
          },
          currentLocationDot: {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: palette.success,
            borderWidth: 3,
            borderColor: "#FFFFFF",
            shadowColor: palette.success,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 8,
            justifyContent: "center",
            alignItems: "center",
          },
          currentLocationPulse: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(52, 168, 83, 0.15)",
            position: "absolute",
            top: -10,
            left: -10,
          },

          riderMarker: {
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          },
          panicMarker: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.danger,
            borderWidth: 3,
            borderColor: "#FFFFFF",
            shadowColor: palette.danger,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 30,
            elevation: 15,
            justifyContent: "center",
            alignItems: "center",
          },
          panicPulse: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255, 0, 0, 0.7)",
          },

          expandedBubbleContainer: {
            backgroundColor: palette.bg,
            borderRadius: 20,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.5 : 0.2,
            shadowRadius: 20,
            elevation: 15,
            borderWidth: 0.5,
            borderColor: palette.borderStrong,
            width: 380,
            maxWidth: width - 30,
          },
          expandedBubbleContainerPanic: {
            borderColor: palette.danger,
            borderWidth: 1.5,
            shadowColor: palette.danger,
            shadowOpacity: 0.3,
          },
          bubbleHeader: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          },
          bubbleAvatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: palette.primary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 14,
            position: "relative",
            borderWidth: 2,
            borderColor: palette.bg,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          },
          bubbleAvatarPanic: {
            backgroundColor: palette.danger,
            shadowColor: palette.danger,
          },
          bubbleAvatarText: {
            color: "#FFFFFF",
            fontSize: 20,
            fontWeight: "bold",
          },
          bubbleStatusDot: {
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: palette.bg,
          },
          bubbleHeaderInfo: {
            flex: 1,
          },
          bubbleName: {
            fontSize: 17,
            fontWeight: "700",
            color: palette.text,
          },
          bubbleStatusRow: {
            flexDirection: "row",
            alignItems: "center",
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
            color: palette.textSecondary,
          },
          bubbleStatusTextPanic: {
            color: palette.danger,
            fontWeight: "700",
          },
          bubbleClose: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: palette.bgSecondary,
            alignItems: "center",
            justifyContent: "center",
          },
          bubbleCloseText: {
            fontSize: 16,
            color: palette.textMuted,
            fontWeight: "bold",
          },
          bubbleDivider: {
            height: 1,
            backgroundColor: palette.border,
            marginVertical: 10,
          },
          bubbleDetails: {
            marginBottom: 4,
          },
          bubbleDetailRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 4,
          },
          bubbleDetailLabel: {
            fontSize: 13,
            color: palette.textSecondary,
          },
          bubbleDetailLabelPanic: {
            color: palette.danger,
            fontWeight: "600",
          },
          bubbleDetailValue: {
            fontSize: 13,
            color: palette.text,
            fontWeight: "500",
            flex: 1,
            textAlign: "right",
            marginLeft: 12,
          },
          bubbleDetailValuePanic: {
            color: palette.danger,
            fontWeight: "700",
          },
          bubbleTimerValue: {
            color: palette.primary,
            fontWeight: "700",
          },
          bubbleActions: {
            flexDirection: "row",
            gap: 8,
            marginTop: 6,
          },
          bubbleActionBtn: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            gap: 6,
          },
          bubbleActionPrimary: {
            backgroundColor: palette.primary,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          },
          bubbleActionSecondary: {
            backgroundColor: palette.bgSecondary,
          },
          bubbleActionIcon: {
            fontSize: 16,
          },
          bubbleActionText: {
            fontSize: 13,
            fontWeight: "600",
            color: "#FFFFFF",
          },
          bubbleActionTextSecondary: {
            fontSize: 13,
            fontWeight: "600",
            color: palette.text,
          },
          bubbleFooter: {
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: palette.border,
            alignItems: "center",
          },
          bubbleFooterText: {
            fontSize: 11,
            color: palette.textSecondary,
          },
          liveIndicator: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
            backgroundColor: palette.liveBg,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
          },
          liveIndicatorPanic: {
            backgroundColor: palette.panicBg,
          },
          liveDot: {
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: palette.liveText,
            marginRight: 5,
          },
          liveDotPanic: {
            backgroundColor: palette.danger,
          },
          liveText: {
            fontSize: 10,
            color: palette.liveText,
            fontWeight: "700",
            letterSpacing: 0.3,
          },
          liveTextPanic: {
            color: palette.danger,
          },

          themeButton: {
            position: "absolute",
            bottom: 160,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: palette.bg,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.6 : 0.3,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 1,
            borderColor: palette.borderStrong,
          },
          themeButtonText: {
            fontSize: 28,
            lineHeight: 32,
          },
          themeIndicator: {
            position: "absolute",
            bottom: 4,
            right: 4,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: palette.primary,
            borderWidth: 2,
            borderColor: palette.bg,
          },

          modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          },
          modalContent: {
            backgroundColor: palette.bg,
            borderRadius: 20,
            padding: 20,
            width: width * 0.8,
            maxWidth: 350,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
          },
          modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          },
          modalTitle: {
            fontSize: 20,
            fontWeight: "bold",
            color: palette.text,
          },
          modalCloseButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: palette.bgSecondary,
            justifyContent: "center",
            alignItems: "center",
          },
          modalCloseText: {
            fontSize: 16,
            color: palette.textMuted,
            fontWeight: "bold",
          },
          themeGrid: {
            flexDirection: "row",
            justifyContent: "space-around",
            gap: 12,
          },
          themeOption: {
            flex: 1,
            paddingVertical: 20,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: palette.bgTertiary,
            borderWidth: 2,
            borderColor: "transparent",
            alignItems: "center",
            position: "relative",
          },
          themeOptionActive: {
            borderColor: palette.primary,
            backgroundColor: isDark ? "#1e3a5f" : "#E8F0FE",
          },
          themeOptionIcon: {
            fontSize: 36,
            marginBottom: 8,
          },
          themeOptionLabel: {
            fontSize: 14,
            color: palette.textMuted,
            fontWeight: "500",
          },
          themeOptionLabelActive: {
            color: palette.primary,
            fontWeight: "600",
          },
          themeCheckmark: {
            position: "absolute",
            top: -6,
            right: -6,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: palette.primary,
            justifyContent: "center",
            alignItems: "center",
          },
          themeCheckmarkText: {
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: "bold",
          },

          infoIndicator: {
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 20,
          },
          infoIndicatorText: {
            color: "#FFFFFF",
            fontSize: 10,
          },
        }),
      [palette, isDark],
    );

    // ========== SINCRONIZAR ID DEL USUARIO ACTUAL ==========
    useEffect(() => {
      usuarioActualIdRef.current = usuarioActual?.id ?? null;
    }, [usuarioActual]);

    // ========== CONTADOR DE TIEMPO DEL USUARIO ACTUAL ==========
    const iniciarContadorTiempo = () => {
      detenerContadorTiempo();
      setOnlineTime(0);
      setIsUserOnline(true);

      onlineTimerRef.current = setInterval(() => {
        setOnlineTime((prev) => prev + 1);
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

    // ========== CONTADOR DE TIEMPO DE CADA RIDER ==========
    const iniciarContadorRider = (riderId: number) => {
      detenerContadorRider(riderId);

      const timer = setInterval(() => {
        setRidersOnlineTime((prev) => {
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
      setRidersOnlineTime((prev) => {
        const newMap = new Map(prev);
        newMap.delete(riderId);
        return newMap;
      });
    };

    const formatearTiempo = (segundos: number): string => {
      const horas = Math.floor(segundos / 3600);
      const minutos = Math.floor((segundos % 3600) / 60);
      const segs = segundos % 60;

      if (horas > 0) return `${horas}h ${minutos}m ${segs}s`;
      if (minutos > 0) return `${minutos}m ${segs}s`;
      return `${segs}s`;
    };

    // ========== ALERTA DE PÁNICO ==========
    const mostrarAlertaPanico = (rider: Rider) => {
      if (
        usuarioActualIdRef.current !== null &&
        rider.id === usuarioActualIdRef.current
      ) {
        console.log(
          "[GoogleMapView] Ignorando auto-alerta de pánico para mi propio usuario:",
          rider.id,
        );
        return;
      }

      const now = Date.now();
      const lastAlert = panicAlertCooldownRef.current.get(rider.id) || 0;

      if (now - lastAlert < 2000) return;

      panicAlertCooldownRef.current.set(rider.id, now);
      panicAlertShownRef.current.set(rider.id, true);

      Alert.alert(
        "🚨 ¡SOLICITUD DE APOYO!",
        `${rider.nombre} solicitó apoyo, acude a su auxilio`,
        [
          {
            text: "📍 Cómo llegar",
            onPress: async () => {
              if (!currentLocationRef.current) {
                Alert.alert("Error", "No se puede obtener tu ubicación");
                return;
              }
              const success = await abrirGoogleMaps(
                rider.latitud,
                rider.longitud,
                rider.nombre,
              );
              if (!success) {
                Alert.alert("Error", "No se pudo abrir Google Maps");
              }
            },
          },
          {
            text: "📞 Llamar",
            onPress: () => {
              if (rider.telefono) {
                Linking.openURL(`tel:${rider.telefono}`);
              } else {
                Alert.alert("Error", "El usuario no tiene teléfono registrado");
              }
            },
          },
          { text: "Cerrar", style: "cancel" },
        ],
        { cancelable: true },
      );

      Vibration.vibrate([100, 200, 100, 200, 100]);

      setTimeout(() => {
        panicAlertCooldownRef.current.delete(rider.id);
      }, 10000);
    };

    const verificarYMostrarAlertaPanico = (rider: Rider) => {
      if (!rider.en_panico) return;

      if (
        usuarioActualIdRef.current !== null &&
        rider.id === usuarioActualIdRef.current
      ) {
        return;
      }

      const alreadyShown = panicAlertShownRef.current.get(rider.id) || false;
      if (alreadyShown) return;

      mostrarAlertaPanico(rider);
    };

    const limpiarAlertaPanico = (riderId: number) => {
      panicAlertShownRef.current.delete(riderId);
      panicAlertCooldownRef.current.delete(riderId);
    };

    // ========== ACTUALIZAR POSICIONES DE RIDERS ==========
    const updateAllRidersPositions = async () => {
      if (!mapRef.current) return;

      const newPositions = new Map<number, { x: number; y: number }>();

      const allRiders = [...riders.values(), ...panicMarkers.values()];

      for (const rider of allRiders) {
        try {
          const point = await mapRef.current.pointForCoordinate({
            latitude: rider.latitud,
            longitude: rider.longitud,
          });
          if (point) {
            newPositions.set(rider.id, {
              x: point.x,
              y: point.y - 60,
            });
          }
        } catch {
          /* silencioso */
        }
      }

      setRidersPositions(newPositions);
    };

    const updateBubblePositionForRider = async (
      rider: Rider,
    ): Promise<boolean> => {
      if (!mapRef.current || !rider) return false;

      try {
        const point = await mapRef.current.pointForCoordinate({
          latitude: rider.latitud,
          longitude: rider.longitud,
        });
        if (point) {
          setBubbleScreenPos({
            x: point.x,
            y: point.y - 180,
          });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // ========== NAVEGACIÓN EXTERNA ==========
    const abrirGoogleMaps = async (
      destLat: number,
      destLng: number,
      _destName?: string,
    ): Promise<boolean> => {
      const location = currentLocationRef.current;

      if (!location) {
        Alert.alert(
          "Error",
          "No se puede obtener tu ubicación actual. Activa el GPS.",
        );
        return false;
      }

      try {
        const googleMapsInstalled =
          await Linking.canOpenURL("comgooglemaps://");

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
          Alert.alert("Error", "No se pudo abrir Google Maps.");
          return false;
        }
      }
    };

    // ========== BURBUJAS ==========
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
        }),
      ]).start(() => {
        setShowMiniBubble(false);
        setShowExpandedBubble(false);
        setBubbleUser(null);
        setSelectedRider(null);
        setBubbleScreenPos(null);
      });
    };

    // ========== CAMBIAR TEMA ==========
    const cambiarTema = (theme: MapTheme) => {
      setCurrentTheme(theme);
      setShowThemeModal(false);
      Vibration.vibrate(20);
    };

    // ========== EFECTOS ==========
    useEffect(() => {
      const checkGoogleMaps = async () => {
        try {
          const installed = await Linking.canOpenURL("comgooglemaps://");
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

        panicAlertCooldownRef.current.clear();
        panicAlertShownRef.current.clear();

        Speech.stop();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [riders, panicMarkers, mapReadyState]);

    useEffect(() => {
      const subscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (
            appState.current.match(/inactive|background/) &&
            nextAppState === "active"
          ) {
            if (showExpandedBubble && bubbleUser) {
              updateBubblePositionForRider(bubbleUser);
            }
          }
          appState.current = nextAppState;
        },
      );

      return () => subscription.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showExpandedBubble, bubbleUser]);

    useEffect(() => {
      if (currentLocation && usuarioActual) {
        if (!isUserOnline) {
          iniciarContadorTiempo();
        }

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
        if (
          currentLocationRef.current &&
          Math.abs(currentLocationRef.current.latitude - lat) < 0.00001 &&
          Math.abs(currentLocationRef.current.longitude - lng) < 0.00001
        ) {
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
            mapRef.current.animateToRegion(
              {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              1000,
            );
            setIsFirstLocationUpdate(false);
          }
        }, 100);
      },

      updateRider: (rider: Rider) => {
        const wasInPanic = panicMarkers.has(rider.id);

        setRiders((prev) => {
          const newMap = new Map(prev);
          newMap.delete(rider.id);
          return newMap;
        });

        setPanicMarkers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(rider.id);
          return newMap;
        });

        const esMiPropioUsuario =
          usuarioActualIdRef.current !== null &&
          rider.id === usuarioActualIdRef.current;

        if (rider.en_panico) {
          setPanicMarkers((prev) => new Map(prev).set(rider.id, rider));

          if (!wasInPanic && !esMiPropioUsuario) {
            const alreadyShown =
              panicAlertShownRef.current.get(rider.id) || false;
            if (!alreadyShown) {
              mostrarAlertaPanico(rider);
            }
          }

          if (showExpandedBubble && bubbleUser?.id === rider.id) {
            setBubbleUser(rider);
          }
        } else {
          limpiarAlertaPanico(rider.id);

          if (rider.estado === "conectado" || rider.estado === "ocupado") {
            setRiders((prev) => new Map(prev).set(rider.id, rider));
          }
        }

        if (rider.estado === "conectado" || rider.estado === "ocupado") {
          if (!ridersTimerRef.current.has(rider.id)) {
            iniciarContadorRider(rider.id);
          }
        } else if (rider.estado === "desconectado") {
          detenerContadorRider(rider.id);
        }
      },

      removeRider: (userId: number) => {
        setRiders((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        setPanicMarkers((prev) => {
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
        const newRiders = new Map<number, Rider>();
        const newPanic = new Map<number, Rider>();

        const ridersInPanic = new Set(
          ridersList.filter((r) => r.en_panico).map((r) => r.id),
        );

        for (const [id] of panicAlertShownRef.current) {
          if (!ridersInPanic.has(id)) {
            limpiarAlertaPanico(id);
          }
        }

        const miId = usuarioActualIdRef.current;

        ridersList.forEach((rider) => {
          if (rider.en_panico) {
            newPanic.set(rider.id, rider);
          } else if (
            rider.estado === "conectado" ||
            rider.estado === "ocupado"
          ) {
            newRiders.set(rider.id, rider);
            if (!ridersTimerRef.current.has(rider.id)) {
              iniciarContadorRider(rider.id);
            }
          }
        });

        setRiders(newRiders);
        setPanicMarkers(newPanic);

        ridersList.forEach((rider) => {
          if (rider.en_panico && rider.id !== miId) {
            const alreadyShown =
              panicAlertShownRef.current.get(rider.id) || false;
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
          Alert.alert("Error", "No se pudo abrir Google Maps");
        }
      },

      cancelarNavegacion: () => {},

      toggleVoz: () => {},

      centrarUbicacion: () => {
        const location = currentLocationRef.current;
        if (location && mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000,
          );
        }
      },
    }));

    const getMarkerColor = (estado: string) => {
      switch (estado) {
        case "conectado":
          return "#34A853";
        case "ocupado":
          return "#FBBC04";
        default:
          return "#9E9E9E";
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
          onLayout={(e) => console.log("[MAP] layout:", e.nativeEvent.layout)}
          onMapLoaded={() => console.log("[MAP] onMapLoaded")}
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

          {Array.from(riders.values()).map((rider) => (
            <Marker
              key={`rider-${rider.id}`}
              coordinate={{
                latitude: rider.latitud,
                longitude: rider.longitud,
              }}
              tracksViewChanges={false}
              onPress={() => expandirBurbuja(rider)}
            >
              <View
                style={[
                  styles.riderMarker,
                  { backgroundColor: getMarkerColor(rider.estado) },
                ]}
              />
            </Marker>
          ))}

          {Array.from(panicMarkers.values()).map((rider) => (
            <Marker
              key={`panic-${rider.id}`}
              coordinate={{
                latitude: rider.latitud,
                longitude: rider.longitud,
              }}
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
        {showMiniBubble &&
          Array.from(riders.values()).map((rider) => {
            const riderPos = ridersPositions.get(rider.id);
            const isSelected = selectedRider?.id === rider.id;

            if (isSelected || !riderPos) return null;

            const riderOnlineTime = ridersOnlineTime.get(rider.id) || 0;
            const isCurrentUser =
              usuarioActual && rider.id === usuarioActual.id;

            return (
              <Animated.View
                key={`mini-bubble-${rider.id}`}
                style={[
                  styles.floatingBubble,
                  {
                    left: riderPos.x - 130,
                    top: riderPos.y - 90,
                    opacity: fadeAnim,
                  },
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
                        {rider.nombre} {isCurrentUser && "⭐"}
                      </Text>
                      <View style={styles.miniBubbleStatusRow}>
                        <View
                          style={[
                            styles.miniBubbleStatusDot,
                            {
                              backgroundColor: rider.en_panico
                                ? palette.danger
                                : palette.success,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.miniBubbleStatusText,
                            rider.en_panico && styles.miniBubbleStatusTextPanic,
                          ]}
                        >
                          {rider.en_panico ? "🚨 EMERGENCIA" : "Disponible"}
                        </Text>
                      </View>
                      {rider.estado !== "desconectado" &&
                        riderOnlineTime > 0 && (
                          <Text style={styles.miniBubbleTimerText}>
                            ⏱ {formatearTiempo(riderOnlineTime)}
                          </Text>
                        )}
                      {rider.telefono && (
                        <Text
                          style={styles.miniBubblePhoneText}
                          numberOfLines={1}
                        >
                          📱 {rider.telefono}
                        </Text>
                      )}
                    </View>
                    <View style={styles.miniBubbleExpandIcon}>
                      <Text style={styles.miniBubbleExpandText}>›</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View
                  style={[
                    styles.bubbleConnector,
                    rider.en_panico && styles.bubbleConnectorPanic,
                  ]}
                />
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
                transform: [
                  {
                    scale: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.expandedBubbleContainer,
                bubbleUser.en_panico && styles.expandedBubbleContainerPanic,
              ]}
            >
              <View style={styles.bubbleHeader}>
                <View
                  style={[
                    styles.bubbleAvatar,
                    bubbleUser.en_panico && styles.bubbleAvatarPanic,
                  ]}
                >
                  <Text style={styles.bubbleAvatarText}>
                    {bubbleUser.nombre.charAt(0).toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.bubbleStatusDot,
                      {
                        backgroundColor: bubbleUser.en_panico
                          ? palette.danger
                          : palette.success,
                      },
                    ]}
                  />
                </View>
                <View style={styles.bubbleHeaderInfo}>
                  <Text style={styles.bubbleName}>{bubbleUser.nombre}</Text>
                  <View style={styles.bubbleStatusRow}>
                    <View
                      style={[
                        styles.bubbleStatusSmallDot,
                        {
                          backgroundColor: bubbleUser.en_panico
                            ? palette.danger
                            : palette.success,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.bubbleStatusText,
                        bubbleUser.en_panico && styles.bubbleStatusTextPanic,
                      ]}
                    >
                      {bubbleUser.en_panico ? "🚨 EMERGENCIA" : "Disponible"}
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
                {bubbleUser.estado !== "desconectado" && (
                  <View style={styles.bubbleDetailRow}>
                    <Text style={styles.bubbleDetailLabel}>
                      ⏱ Tiempo en línea
                    </Text>
                    <Text
                      style={[
                        styles.bubbleDetailValue,
                        styles.bubbleTimerValue,
                      ]}
                    >
                      {formatearTiempo(
                        ridersOnlineTime.get(bubbleUser.id) || 0,
                      )}
                    </Text>
                  </View>
                )}

                <View style={styles.bubbleDetailRow}>
                  <Text style={styles.bubbleDetailLabel}>📍 Ubicación</Text>
                  <Text style={styles.bubbleDetailValue} numberOfLines={1}>
                    {bubbleUser.direccion ||
                      `${bubbleUser.latitud.toFixed(6)}, ${bubbleUser.longitud.toFixed(6)}`}
                  </Text>
                </View>

                {bubbleUser.vehiculo && (
                  <View style={styles.bubbleDetailRow}>
                    <Text style={styles.bubbleDetailLabel}>🚗 Vehículo</Text>
                    <Text style={styles.bubbleDetailValue}>
                      {bubbleUser.vehiculo}
                    </Text>
                  </View>
                )}

                {bubbleUser.placas && (
                  <View style={styles.bubbleDetailRow}>
                    <Text style={styles.bubbleDetailLabel}>🔢 Placas</Text>
                    <Text style={styles.bubbleDetailValue}>
                      {bubbleUser.placas}
                    </Text>
                  </View>
                )}

                {bubbleUser.telefono && (
                  <View style={styles.bubbleDetailRow}>
                    <Text style={styles.bubbleDetailLabel}>📱 Teléfono</Text>
                    <Text style={styles.bubbleDetailValue}>
                      {bubbleUser.telefono}
                    </Text>
                  </View>
                )}

                {bubbleUser.en_panico && bubbleUser.tipo_emergencia && (
                  <View style={styles.bubbleDetailRow}>
                    <Text
                      style={[
                        styles.bubbleDetailLabel,
                        styles.bubbleDetailLabelPanic,
                      ]}
                    >
                      🚨 Emergencia
                    </Text>
                    <Text
                      style={[
                        styles.bubbleDetailValue,
                        styles.bubbleDetailValuePanic,
                      ]}
                    >
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
                      Alert.alert("Error", "No se puede obtener tu ubicación");
                      return;
                    }
                    const success = await abrirGoogleMaps(
                      bubbleUser.latitud,
                      bubbleUser.longitud,
                      bubbleUser.nombre,
                    );
                    if (!success) {
                      Alert.alert("Error", "No se pudo abrir Google Maps");
                    }
                  }}
                >
                  <Text style={styles.bubbleActionIcon}>📍</Text>
                  <Text style={styles.bubbleActionText}>Cómo llegar</Text>
                </TouchableOpacity>

                {bubbleUser.telefono && (
                  <TouchableOpacity
                    style={[
                      styles.bubbleActionBtn,
                      styles.bubbleActionSecondary,
                    ]}
                    onPress={() =>
                      Linking.openURL(`tel:${bubbleUser.telefono}`)
                    }
                  >
                    <Text style={styles.bubbleActionIcon}>📞</Text>
                    <Text style={styles.bubbleActionTextSecondary}>Llamar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.bubbleFooter}>
                <Text style={styles.bubbleFooterText}>
                  Última actualización:{" "}
                  {bubbleUser.ultima_actualizacion ||
                    "Hoy, " +
                      new Date().toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </Text>
                <View
                  style={[
                    styles.liveIndicator,
                    bubbleUser.en_panico && styles.liveIndicatorPanic,
                  ]}
                >
                  <View
                    style={[
                      styles.liveDot,
                      bubbleUser.en_panico && styles.liveDotPanic,
                    ]}
                  />
                  <Text
                    style={[
                      styles.liveText,
                      bubbleUser.en_panico && styles.liveTextPanic,
                    ]}
                  >
                    {bubbleUser.en_panico ? "EMERGENCIA" : "EN VIVO"}
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
                {(["light", "dark"] as MapTheme[]).map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={[
                      styles.themeOption,
                      currentTheme === theme && styles.themeOptionActive,
                    ]}
                    onPress={() => cambiarTema(theme)}
                  >
                    <Text style={styles.themeOptionIcon}>
                      {getThemeIcon(theme)}
                    </Text>
                    <Text
                      style={[
                        styles.themeOptionLabel,
                        currentTheme === theme && styles.themeOptionLabelActive,
                      ]}
                    >
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
            {isGoogleMapsInstalled ? "📱 Google Maps" : "🌐 Navegador"}
          </Text>
        </View>
      </View>
    );
  },
);

GoogleMapView.displayName = "GoogleMapView";

export default GoogleMapView;
