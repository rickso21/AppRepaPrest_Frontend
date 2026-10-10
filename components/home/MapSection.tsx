import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GoogleMapView, { GoogleMapViewRef } from "../maps/GoogleMapView";

type Props = {
  mapRef: React.RefObject<GoogleMapViewRef | null>;
  conectado: boolean;
  ubicacionLista: boolean;
  sinPermiso: boolean;
  usuarioActual: {
    id: number;
    nombre: string;
    rol: string;
    telefono: string;
  };
  onMapReady: () => void;
  height: number;
};

export default function MapSection({
  mapRef,
  conectado,
  ubicacionLista,
  sinPermiso,
  usuarioActual,
  onMapReady,
  height,
}: Props) {
  return (
    <View
      style={[
        styles.mapWrapper,
        {
          height: Platform.OS === "android" ? height * 0.53 : height * 0.5,
        },
      ]}
    >
      <View style={styles.mapCard}>
        <GoogleMapView
          ref={mapRef}
          onMapReady={onMapReady}
          usuarioActual={usuarioActual}
        />

        {!ubicacionLista && !sinPermiso && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#FF6B35" size="small" />
            <Text style={styles.loadingText}>Conectando GPS...</Text>
          </View>
        )}

        <View
          style={[
            styles.statusBadge,
            conectado ? styles.statusConectado : styles.statusDesconectado,
          ]}
        >
          <View
            style={[styles.statusDot, conectado && styles.statusDotVerde]}
          />
          <Text style={styles.statusBadgeText}>
            {conectado ? "En línea" : "Desconectado"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    marginHorizontal: 20,
    marginBottom: Platform.OS === "android" ? 12 : 6,
    borderRadius: 22,
    overflow: "hidden",
    ...(Platform.OS === "ios" && { flex: 1 }),
  },
  mapCard: {
    height: "100%",
    backgroundColor: "#1C1C28",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  loadingOverlay: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15,15,23,0.92)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
  },
  loadingText: { fontSize: 12.5, color: "#fff", fontWeight: "600" },
  statusBadge: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,15,23,0.9)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    top: Platform.select({ ios: 315, android: 410, default: 55 }),
    left: 14,
    zIndex: 10,
  },
  statusConectado: { borderColor: "rgba(76,175,80,0.4)" },
  statusDesconectado: { borderColor: "rgba(107,114,128,0.4)" },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6B7280",
  },
  statusDotVerde: { backgroundColor: "#4CAF50" },
  statusBadgeText: { fontSize: 11, color: "#fff", fontWeight: "600" },
});
