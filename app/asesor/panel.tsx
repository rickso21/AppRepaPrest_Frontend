import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  asesorService,
  type PrestamoResumen,
} from "@/services/admin/AsesorService";
import { authService } from "@/services/auth/AuthService";

const BRAND = "#FF6B35";
const BG = "#0F0F17";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.07)";
const WHATSAPP_GREEN = "#25D366";

const AUTO_REFRESH_INTERVAL = 15000;

const ESTADOS = [
  { id: 0, label: "Todos" },
  { id: 1, label: "Solicitados" },
  { id: 2, label: "Aprobados" },
  { id: 3, label: "Activos" },
  { id: 4, label: "Pagados" },
  { id: 5, label: "Rechazados" },
];

const COLORES_ESTADO: Record<number, string> = {
  1: "#F59E0B",
  2: "#3B82F6",
  3: "#10B981",
  4: "#8B5CF6",
  5: "#EF4444",
};

type AlertaConfig = {
  color: string;
  label: string;
  icon: string;
} | null;

const ALERTA_PAGO: Record<string, AlertaConfig> = {
  normal: null,
  precaucion: {
    color: "#F59E0B",
    label: "Por vencer",
    icon: "time-outline",
  },
  urgente: {
    color: "#EF4444",
    label: "Vence pronto",
    icon: "alert-circle",
  },
  vencido: {
    color: "#EF4444",
    label: "VENCIDO",
    icon: "warning",
  },
};

export default function AsesorPanel() {
  const router = useRouter();

  const [prestamos, setPrestamos] = useState<PrestamoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [abriendoWhatsApp, setAbriendoWhatsApp] = useState<number | null>(null);

  const mountedRef = useRef(true);

  const cargarPrestamos = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso && mountedRef.current) {
        setLoading(true);
      }

      const data = await asesorService.listarPrestamos();

      if (!mountedRef.current) return;

      setPrestamos(data);
    } catch (e: any) {
      console.error("[asesor] error cargando préstamos:", e?.message);

      if (!silencioso) {
        Alert.alert(
          "Error",
          e?.msg ?? e?.message ?? "No se pudieron cargar los préstamos",
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarPrestamos(true);
    }, [cargarPrestamos]),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      cargarPrestamos(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [cargarPrestamos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPrestamos(false);
  }, [cargarPrestamos]);

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/login");
  };

  // ============================================================
  // WhatsApp: abrir chat del cliente
  // ============================================================
  const abrirWhatsApp = async (prestamo: PrestamoResumen) => {
    // Si el listado ya trae el link listo, lo usamos directo.
    if (prestamo.whatsapp_valido && prestamo.whatsapp_url) {
      try {
        await Linking.openURL(prestamo.whatsapp_url);
      } catch {
        Alert.alert("Error", "No se pudo abrir WhatsApp");
      }
      return;
    }

    try {
      setAbriendoWhatsApp(prestamo.id);
      const data = await asesorService.whatsappCliente(prestamo.id);
      if (data?.res && data.link) {
        await Linking.openURL(data.link);
      } else {
        Alert.alert(
          "Sin WhatsApp",
          "El cliente no tiene un número válido registrado.",
        );
      }
    } catch (e: any) {
      Alert.alert(
        "Sin WhatsApp",
        e?.msg ?? "El cliente no tiene un número válido registrado.",
      );
    } finally {
      setAbriendoWhatsApp(null);
    }
  };

  const prestamosFiltrados = prestamos.filter((p) => {
    if (filtroEstado !== 0 && p.estado_id !== filtroEstado) return false;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const folio = (p.folio ?? "").toLowerCase();
      const nombre = (p.usuario ?? "").toLowerCase();
      if (!folio.includes(q) && !nombre.includes(q)) return false;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoWrap}>
            <Ionicons name="briefcase-outline" size={22} color={BRAND} />
          </View>
          <View>
            <Text style={styles.title}>Panel Asesor</Text>
            <Text style={styles.subtitle}>
              {prestamosFiltrados.length} préstamo
              {prestamosFiltrados.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        <Pressable onPress={handleLogout} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={18}
          color="rgba(255,255,255,0.4)"
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por folio o usuario..."
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
        />
        {busqueda.length > 0 && (
          <Pressable onPress={() => setBusqueda("")} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        data={ESTADOS}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrosContainer}
        renderItem={({ item }) => {
          const activo = filtroEstado === item.id;
          return (
            <Pressable
              style={[styles.chip, activo && styles.chipActive]}
              onPress={() => setFiltroEstado(item.id)}
            >
              <Text style={[styles.chipText, activo && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {loading && prestamos.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND} size="large" />
        </View>
      ) : (
        <FlatList
          data={prestamosFiltrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BRAND}
            />
          }
          renderItem={({ item }) => {
            const colorEstado =
              COLORES_ESTADO[item.estado_id] ?? "rgba(255,255,255,0.5)";

            const alerta = ALERTA_PAGO[item.alerta_pago];
            const tieneAlerta = !!alerta;
            const whatsappHabilitado = item.whatsapp_valido;

            return (
              <Pressable
                style={[
                  styles.card,
                  tieneAlerta && {
                    borderColor: alerta.color,
                    borderWidth: 1.5,
                    shadowColor: alerta.color,
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 6,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/asesor/prestamo",
                    params: { prestamoId: String(item.id) },
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardFolio}>{item.folio}</Text>
                    <Text style={styles.cardNombre} numberOfLines={1}>
                      {item.usuario}
                    </Text>

                    {tieneAlerta && item.dias_restantes_pago !== null && (
                      <View
                        style={[
                          styles.alertaPago,
                          { backgroundColor: alerta.color + "22" },
                        ]}
                      >
                        <Ionicons
                          name={alerta.icon as any}
                          size={12}
                          color={alerta.color}
                        />
                        <Text
                          style={[
                            styles.alertaPagoText,
                            { color: alerta.color },
                          ]}
                        >
                          {alerta.label}
                          {item.dias_restantes_pago >= 0
                            ? ` · ${item.dias_restantes_pago} día${
                                item.dias_restantes_pago === 1 ? "" : "s"
                              }`
                            : ` · Hace ${Math.abs(
                                item.dias_restantes_pago,
                              )} día${
                                Math.abs(item.dias_restantes_pago) === 1
                                  ? ""
                                  : "s"
                              }`}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.estadoBadge,
                      { backgroundColor: colorEstado + "22" },
                    ]}
                  >
                    <View
                      style={[
                        styles.estadoDot,
                        { backgroundColor: colorEstado },
                      ]}
                    />
                    <Text style={[styles.estadoText, { color: colorEstado }]}>
                      {item.estado_texto.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.montosRow}>
                  <View style={styles.montoBox}>
                    <Text style={styles.montoLabel}>Solicitado</Text>
                    <Text style={styles.montoValue}>
                      ${item.monto_solicitado.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.montoBox}>
                    <Text style={styles.montoLabel}>Total a pagar</Text>
                    <Text style={styles.montoValue}>
                      ${item.monto_total_pagar.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.montoBox}>
                    <Text style={styles.montoLabel}>Pagos</Text>
                    <Text style={styles.montoValue}>
                      {item.pagos_realizados}/{item.numero_pagos}
                    </Text>
                  </View>
                </View>

                {/* 👇 Footer: WhatsApp + Ver detalle */}
                <View style={styles.cardFooter}>
                  {whatsappHabilitado ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.whatsappBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        abrirWhatsApp(item);
                      }}
                      hitSlop={6}
                      disabled={abriendoWhatsApp === item.id}
                    >
                      {abriendoWhatsApp === item.id ? (
                        <ActivityIndicator
                          size="small"
                          color={WHATSAPP_GREEN}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="logo-whatsapp"
                            size={16}
                            color={WHATSAPP_GREEN}
                          />
                          <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.whatsappBtnDisabled}>
                      <Ionicons
                        name="logo-whatsapp"
                        size={16}
                        color="rgba(255,255,255,0.25)"
                      />
                      <Text style={styles.whatsappBtnDisabledText}>
                        Sin WhatsApp
                      </Text>
                    </View>
                  )}

                  <View style={styles.verMasWrap}>
                    <Text style={styles.verMas}>Ver detalle</Text>
                    <Ionicons name="chevron-forward" size={16} color={BRAND} />
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="folder-open-outline"
                size={52}
                color="rgba(255,255,255,0.2)"
              />
              <Text style={styles.emptyText}>
                No hay préstamos con este filtro
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
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

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },

  filtrosContainer: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
    height: 44,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: BORDER,
    height: 36,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: BRAND, borderColor: BRAND },
  chipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: { color: "#fff", fontWeight: "800" },

  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
    flex: 1,
  },
  emptyText: { color: "rgba(255,255,255,0.4)", fontSize: 13 },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardFolio: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardNombre: { color: "#fff", fontSize: 15, fontWeight: "700" },

  alertaPago: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  alertaPagoText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },

  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  estadoDot: { width: 6, height: 6, borderRadius: 3 },
  estadoText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  montosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  montoBox: { flex: 1 },
  montoLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  montoValue: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // 👇 Footer con WhatsApp + Ver detalle
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(37,211,102,0.12)",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.35)",
  },
  whatsappBtnText: {
    color: WHATSAPP_GREEN,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  whatsappBtnDisabled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
  },
  whatsappBtnDisabledText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "700",
  },

  verMasWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verMas: { color: BRAND, fontSize: 12, fontWeight: "700" },
});
