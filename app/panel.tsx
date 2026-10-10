import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authService } from "@/services/auth/AuthService";
import { api } from "@/services/conector/api";

const BRAND = "#FF6B35";
const BG = "#0F0F17";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.07)";

type Ad = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  status_id: number;
  status_text: string;
  impressions: number;
  clicks: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
};

// Colores según estado
const STATUS_COLORS: Record<
  number,
  { bg: string; text: string; icon: string }
> = {
  0: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B", icon: "time-outline" },
  1: {
    bg: "rgba(16,185,129,0.15)",
    text: "#10B981",
    icon: "checkmark-circle-outline",
  },
  2: {
    bg: "rgba(107,114,128,0.2)",
    text: "#9CA3AF",
    icon: "close-circle-outline",
  },
  3: {
    bg: "rgba(239,68,68,0.15)",
    text: "#EF4444",
    icon: "alert-circle-outline",
  },
};

export default function PanelComercio() {
  const router = useRouter();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================
  // Cargar anuncios al ganar foco
  // ============================================================
  const cargarAnuncios = useCallback(async () => {
    try {
      const { data } = await api.get("/ads/my-ads");
      if (data?.res && Array.isArray(data.ads)) {
        setAds(data.ads);
      }
    } catch (e) {
      console.warn("[panel] error cargando anuncios:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarAnuncios();
    }, [cargarAnuncios]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarAnuncios();
  }, [cargarAnuncios]);

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoWrap}>
              <Ionicons name="storefront-outline" size={22} color={BRAND} />
            </View>
            <View>
              <Text style={styles.title}>Panel de Comercio</Text>
              <Text style={styles.subtitle}>
                {ads.length} anuncio{ads.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>

          <Pressable onPress={handleLogout} hitSlop={8}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </Pressable>
        </View>

        {/* Botón crear anuncio */}
        <Pressable
          style={styles.createBtn}
          onPress={() => router.push("/crear-anuncio")}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Crear nuevo anuncio</Text>
        </Pressable>

        {/* Lista de anuncios */}
        <Text style={styles.sectionTitle}>Mis anuncios</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={BRAND} size="large" />
          </View>
        ) : ads.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="albums-outline"
              size={52}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyText}>
              Aún no tienes anuncios publicados
            </Text>
            <Text style={styles.emptyHint}>
              Crea tu primer anuncio para llegar a más clientes
            </Text>
          </View>
        ) : (
          ads.map((ad) => {
            const status = STATUS_COLORS[ad.status_id] ?? STATUS_COLORS[0];

            return (
              <View key={ad.id} style={styles.adCard}>
                {/* Imagen */}
                {ad.image_url && (
                  <Image
                    source={{ uri: ad.image_url }}
                    style={styles.adImage}
                    resizeMode="cover"
                  />
                )}

                {/* Contenido */}
                <View style={styles.adBody}>
                  {/* Status badge */}
                  <View
                    style={[styles.statusBadge, { backgroundColor: status.bg }]}
                  >
                    <Ionicons
                      name={status.icon as any}
                      size={12}
                      color={status.text}
                    />
                    <Text style={[styles.statusText, { color: status.text }]}>
                      {ad.status_text}
                    </Text>
                  </View>

                  <Text style={styles.adTitle} numberOfLines={2}>
                    {ad.title}
                  </Text>

                  {!!ad.description && (
                    <Text style={styles.adDesc} numberOfLines={2}>
                      {ad.description}
                    </Text>
                  )}

                  {/* Métricas */}
                  {ad.status_id === 1 && (
                    <View style={styles.metricsRow}>
                      <View style={styles.metric}>
                        <Ionicons
                          name="eye-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text style={styles.metricText}>
                          {ad.impressions} vistas
                        </Text>
                      </View>
                      <View style={styles.metric}>
                        <Ionicons
                          name="hand-left-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text style={styles.metricText}>{ad.clicks} clics</Text>
                      </View>
                    </View>
                  )}

                  {/* Fechas */}
                  {ad.status_id === 1 && ad.end_at && (
                    <View style={styles.dateRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color="#6B7280"
                      />
                      <Text style={styles.dateText}>Vence: {ad.end_at}</Text>
                    </View>
                  )}

                  {ad.status_id === 0 && (
                    <Pressable
                      style={styles.payBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/crear-anuncio",
                          params: { adId: String(ad.id) },
                        })
                      }
                    >
                      <Ionicons name="card-outline" size={14} color="#fff" />
                      <Text style={styles.payBtnText}>Completar pago</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,107,53,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 12 },

  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: BRAND,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  createBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  sectionTitle: {
    color: "#9CA3AF",
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 12,
  },

  center: { padding: 40, alignItems: "center" },

  emptyBox: {
    alignItems: "center",
    padding: 40,
    gap: 10,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  adCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  adImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#000",
  },
  adBody: { padding: 14 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  adTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  adDesc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  metric: { flexDirection: "row", alignItems: "center", gap: 4 },
  metricText: { color: "#9CA3AF", fontSize: 11 },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  dateText: { color: "#6B7280", fontSize: 11 },

  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: BRAND,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
