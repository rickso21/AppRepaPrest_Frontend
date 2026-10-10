import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { asesorService } from "@/services/admin/AsesorService";

const BRAND = "#FF6B35";
const BG = "#0F0F17";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.07)";
const WHATSAPP_GREEN = "#25D366";

/** Intervalo de auto-refresco del detalle (ms) */
const AUTO_REFRESH_INTERVAL = 15000;

const COLORES_ESTADO: Record<number, string> = {
  1: "#F59E0B", // Solicitado
  2: "#3B82F6", // Aprobado
  3: "#10B981", // Activo
  4: "#8B5CF6", // Pagado
  5: "#EF4444", // Rechazado
};

type AlertaPago = "normal" | "precaucion" | "urgente" | "vencido";

type PrestamoDetalle = {
  id: number;
  folio: string;
  usuario_id: number;
  monto_inicial: number;
  monto_total: number;
  monto_pagado: number;
  monto_restante: number;
  numero_pagos: number;
  pagos_realizados: number;
  pagos_pendientes: number;
  estado: string;
  estado_id: number;
  porcentaje_avance: number;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  fecha_desembolso: string | null;
  fecha_activacion: string | null;
  fecha_liquidacion: string | null;
  fecha_ultimo_pago: string | null;
  linea_credito_id: number;
  dias_restantes_pago: number | null;
  alerta_pago: AlertaPago;
  fecha_proximo_pago: string | null;

  // WhatsApp
  telefono: string | null;
  whatsapp_valido: boolean;
  whatsapp_url: string | null;
};

export default function PrestamoDetalle() {
  const router = useRouter();
  const { prestamoId } = useLocalSearchParams<{ prestamoId?: string }>();

  const [prestamo, setPrestamo] = useState<PrestamoDetalle | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState(false);

  // Modal para motivo de rechazo
  const [modalRechazo, setModalRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // Modal de alerta de pago próximo
  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaMostrada, setAlertaMostrada] = useState(false);

  // WhatsApp: loading del botón
  const [abriendoWhatsApp, setAbriendoWhatsApp] = useState(false);

  // Ref para saber si el componente sigue montado
  const mountedRef = useRef(true);

  // ============================================================
  // Cargar detalle (con soporte silencioso)
  // ============================================================
  const cargarDetalle = useCallback(
    async (silencioso = false) => {
      if (!prestamoId) return;

      if (!silencioso && mountedRef.current && !prestamo) {
        setLoading(true);
      }

      try {
        const data = await asesorService.consultarEstadoCuenta(
          Number(prestamoId),
        );

        if (!mountedRef.current) return;

        if (data?.success) {
          setPrestamo(data.data.prestamo);
          setHistorial(data.data.historial_pagos ?? []);
        }
      } catch (e: any) {
        console.error("[asesor.prestamo] error:", e?.message);

        if (!silencioso) {
          Alert.alert("Error", e?.message ?? "No se pudo cargar el préstamo");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [prestamoId, prestamo],
  );

  // ------------------------------------------------------------
  // Cleanup
  // ------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ------------------------------------------------------------
  // Carga inicial + recarga al ganar foco
  // ------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      cargarDetalle(true);
    }, [cargarDetalle]),
  );

  // ------------------------------------------------------------
  // Auto-refresco cada 15s
  // ------------------------------------------------------------
  useEffect(() => {
    if (!prestamoId) return;

    const interval = setInterval(() => {
      cargarDetalle(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [prestamoId, cargarDetalle]);

  // ------------------------------------------------------------
  // Auto-mostrar modal de alerta de pago próximo
  // ------------------------------------------------------------
  useEffect(() => {
    if (!prestamo || alertaMostrada) return;

    if (
      prestamo.alerta_pago === "urgente" ||
      prestamo.alerta_pago === "vencido"
    ) {
      const timer = setTimeout(() => {
        setAlertaVisible(true);
        setAlertaMostrada(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [prestamo, alertaMostrada]);

  // ============================================================
  // Cambiar estado
  // ============================================================
  const cambiarEstado = async (nuevoEstado: number, motivo?: string) => {
    if (!prestamo) return;

    setAccionando(true);

    try {
      const data = await asesorService.cambiarEstado(
        prestamo.id,
        nuevoEstado as any,
        motivo,
      );

      if (data?.success) {
        Alert.alert("Éxito", data.message ?? "Estado actualizado");
        cargarDetalle(true);
      } else {
        Alert.alert("Error", data?.message ?? "No se pudo actualizar");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? e?.msg ?? "Error de red");
    } finally {
      setAccionando(false);
    }
  };

  // ============================================================
  // Confirmaciones
  // ============================================================
  const confirmarAprobar = () => {
    Alert.alert(
      "Aprobar préstamo",
      "¿Confirmas la aprobación de este préstamo? Se generará el PDF y se enviará al cliente.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Aprobar", onPress: () => cambiarEstado(2) },
      ],
    );
  };

  const confirmarRechazar = () => {
    setMotivoRechazo("");
    setModalRechazo(true);
  };

  const handleEnviarRechazo = () => {
    const motivo = motivoRechazo.trim() || "No especificado";
    setModalRechazo(false);
    cambiarEstado(5, motivo);
  };

  const confirmarLiquidar = () => {
    Alert.alert(
      "Marcar como pagado",
      "¿Confirmas que el cliente liquidó el préstamo? Se generará el PDF de liquidación.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => cambiarEstado(4) },
      ],
    );
  };

  // ============================================================
  // WhatsApp: abrir chat del cliente
  // ============================================================
  const abrirWhatsApp = async () => {
    if (!prestamo) return;

    // 1) Si el detalle ya trae el link listo, úsalo
    if (prestamo.whatsapp_valido && prestamo.whatsapp_url) {
      try {
        await Linking.openURL(prestamo.whatsapp_url);
      } catch {
        Alert.alert("Error", "No se pudo abrir WhatsApp");
      }
      return;
    }

    // 2) Fallback: pedirlo al backend (registra auditoría)
    try {
      setAbriendoWhatsApp(true);
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
      setAbriendoWhatsApp(false);
    }
  };

  // ============================================================
  // Loading inicial
  // ============================================================
  if (loading && !prestamo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={BRAND} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!prestamo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Préstamo no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // Lógica de estados
  // ============================================================
  const estadoId = prestamo.estado_id ?? 0;
  const puedeAprobar = estadoId === 1;
  const puedeRechazar = estadoId === 1 || estadoId === 2;
  const puedeLiquidar = estadoId === 2 || estadoId === 3;
  const esEstadoFinal = estadoId === 4 || estadoId === 5;

  const colorEstado = COLORES_ESTADO[estadoId] ?? "rgba(255,255,255,0.5)";

  const tieneAlertaPago =
    prestamo.alerta_pago === "urgente" ||
    prestamo.alerta_pago === "vencido" ||
    prestamo.alerta_pago === "precaucion";

  const colorAlerta =
    prestamo.alerta_pago === "precaucion" ? "#F59E0B" : "#EF4444";

  const whatsappHabilitado = prestamo.whatsapp_valido;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Detalle del préstamo</Text>

          {/*Acción WhatsApp en el header (siempre disponible) */}
          {whatsappHabilitado ? (
            <Pressable
              onPress={abrirWhatsApp}
              hitSlop={8}
              disabled={abriendoWhatsApp}
            >
              {abriendoWhatsApp ? (
                <ActivityIndicator size="small" color={WHATSAPP_GREEN} />
              ) : (
                <Ionicons
                  name="logo-whatsapp"
                  size={22}
                  color={WHATSAPP_GREEN}
                />
              )}
            </Pressable>
          ) : (
            <View style={{ width: 22 }} />
          )}
        </View>

        {/* Card principal */}
        <View style={styles.card}>
          <View style={styles.folioRow}>
            <Text style={styles.folio}>{prestamo.folio}</Text>

            <View
              style={[
                styles.estadoBadge,
                { backgroundColor: colorEstado + "22" },
              ]}
            >
              <View
                style={[styles.estadoDot, { backgroundColor: colorEstado }]}
              />
              <Text style={[styles.estadoText, { color: colorEstado }]}>
                {prestamo.estado.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Badge de alerta de pago */}
          {tieneAlertaPago && (
            <View
              style={[
                styles.alertaPrincipal,
                {
                  backgroundColor: colorAlerta + "12",
                  borderColor: colorAlerta,
                },
              ]}
            >
              <Ionicons
                name={
                  prestamo.alerta_pago === "precaucion"
                    ? "time-outline"
                    : "warning"
                }
                size={16}
                color={colorAlerta}
              />
              <Text
                style={[styles.alertaPrincipalText, { color: colorAlerta }]}
              >
                {prestamo.alerta_pago === "vencido"
                  ? `Pago VENCIDO hace ${Math.abs(
                      prestamo.dias_restantes_pago ?? 0,
                    )} día(s)`
                  : prestamo.dias_restantes_pago === 0
                    ? "El pago vence HOY"
                    : `Pago vence en ${prestamo.dias_restantes_pago} día(s)`}
              </Text>
            </View>
          )}

          <View style={styles.montoBox}>
            <Text style={styles.montoLabel}>Monto solicitado</Text>
            <Text style={styles.montoBig}>
              ${prestamo.monto_inicial.toLocaleString()}
            </Text>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${prestamo.porcentaje_avance}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {prestamo.porcentaje_avance}% pagado
            </Text>
          </View>

          <View style={styles.grid}>
            <DataItem
              label="Total a pagar"
              value={`$${prestamo.monto_total.toLocaleString()}`}
            />
            <DataItem
              label="Pagado"
              value={`$${prestamo.monto_pagado.toLocaleString()}`}
            />
            <DataItem
              label="Restante"
              value={`$${prestamo.monto_restante.toLocaleString()}`}
            />
            <DataItem
              label="Pagos"
              value={`${prestamo.pagos_realizados}/${prestamo.numero_pagos}`}
            />
            <DataItem label="Estado" value={prestamo.estado} highlight />
            <DataItem
              label="Faltantes"
              value={String(prestamo.pagos_pendientes)}
            />
          </View>
        </View>

        {/* Fechas */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fechas</Text>
          <DataRow label="Solicitud" value={prestamo.fecha_solicitud ?? "—"} />
          <DataRow
            label="Aprobación"
            value={prestamo.fecha_aprobacion ?? "—"}
          />
          <DataRow
            label="Desembolso"
            value={prestamo.fecha_desembolso ?? "—"}
          />
          <DataRow
            label="Activación"
            value={prestamo.fecha_activacion ?? "—"}
          />
          <DataRow
            label="Liquidación"
            value={prestamo.fecha_liquidacion ?? "—"}
          />
          <DataRow
            label="Último pago"
            value={prestamo.fecha_ultimo_pago ?? "—"}
          />
        </View>

        {/* Historial */}
        {historial.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Historial de pagos</Text>
            {historial.map((pago) => (
              <View key={pago.id} style={styles.pagoItem}>
                <View>
                  <Text style={styles.pagoMonto}>
                    ${pago.monto.toLocaleString()}
                  </Text>
                  <Text style={styles.pagoFecha}>{pago.fecha}</Text>
                </View>
                <Text style={styles.pagoMetodo}>{pago.metodo_pago}</Text>
              </View>
            ))}
          </View>
        )}

        {whatsappHabilitado && (
          <Pressable
            style={[styles.btn, styles.btnWhatsApp]}
            onPress={abrirWhatsApp}
            disabled={abriendoWhatsApp}
          >
            {abriendoWhatsApp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.btnText}>Contactar por WhatsApp</Text>
              </>
            )}
          </Pressable>
        )}

        {/* Acciones */}
        <View style={styles.actions}>
          {puedeAprobar && (
            <>
              <Pressable
                style={[styles.btn, styles.btnSuccess]}
                onPress={confirmarAprobar}
                disabled={accionando}
              >
                {accionando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.btnText}>Aprobar</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[styles.btn, styles.btnDanger]}
                onPress={confirmarRechazar}
                disabled={accionando}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.btnText}>Rechazar</Text>
              </Pressable>
            </>
          )}

          {puedeLiquidar && (
            <>
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                onPress={confirmarLiquidar}
                disabled={accionando}
              >
                {accionando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cash-outline" size={20} color="#fff" />
                    <Text style={styles.btnText}>Marcar como pagado</Text>
                  </>
                )}
              </Pressable>

              {puedeRechazar && (
                <Pressable
                  style={[styles.btn, styles.btnDanger]}
                  onPress={confirmarRechazar}
                  disabled={accionando}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.btnText}>Rechazar</Text>
                </Pressable>
              )}
            </>
          )}

          {esEstadoFinal && (
            <View style={styles.finalBox}>
              <Ionicons
                name={estadoId === 4 ? "checkmark-done-circle" : "close-circle"}
                size={20}
                color={colorEstado}
              />
              <Text style={[styles.finalText, { color: colorEstado }]}>
                {estadoId === 4
                  ? "Préstamo liquidado — sin acciones disponibles"
                  : "Préstamo rechazado — sin acciones disponibles"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ============================================================ */}
      {/* MODALES */}
      {/* ============================================================ */}

      {/* Modal de alerta de pago próximo */}
      <Modal
        visible={alertaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertaVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAlertaVisible(false)}
        >
          <Pressable style={styles.alertaCard} onPress={() => {}}>
            {/* Icono */}
            <View
              style={[
                styles.alertaIconWrap,
                {
                  backgroundColor:
                    prestamo.alerta_pago === "vencido"
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(245,158,11,0.15)",
                  borderColor:
                    prestamo.alerta_pago === "vencido" ? "#EF4444" : "#F59E0B",
                },
              ]}
            >
              <Ionicons
                name={
                  prestamo.alerta_pago === "vencido"
                    ? "warning"
                    : "time-outline"
                }
                size={36}
                color={
                  prestamo.alerta_pago === "vencido" ? "#EF4444" : "#F59E0B"
                }
              />
            </View>

            <Text style={styles.alertaTitle}>
              {prestamo.alerta_pago === "vencido"
                ? "⚠️ Pago VENCIDO"
                : "🔔 Pago próximo a vencer"}
            </Text>

            <Text style={styles.alertaSubtitle}>
              {prestamo.alerta_pago === "vencido"
                ? `Este préstamo tenía que pagarse hace ${Math.abs(
                    prestamo.dias_restantes_pago ?? 0,
                  )} día${
                    Math.abs(prestamo.dias_restantes_pago ?? 0) === 1 ? "" : "s"
                  }.`
                : prestamo.dias_restantes_pago === 0
                  ? "El pago vence HOY."
                  : `El pago vence en ${prestamo.dias_restantes_pago} día${
                      prestamo.dias_restantes_pago === 1 ? "" : "s"
                    }.`}
            </Text>

            {/* Info */}
            <View style={styles.alertaInfoBox}>
              <View style={styles.alertaInfoRow}>
                <Text style={styles.alertaInfoLabel}>Folio</Text>
                <Text style={styles.alertaInfoValue}>{prestamo.folio}</Text>
              </View>
              <View style={styles.alertaInfoRow}>
                <Text style={styles.alertaInfoLabel}>Monto pendiente</Text>
                <Text style={styles.alertaInfoValue}>
                  ${prestamo.monto_restante.toLocaleString()}
                </Text>
              </View>
              {prestamo.fecha_proximo_pago && (
                <View style={styles.alertaInfoRow}>
                  <Text style={styles.alertaInfoLabel}>Fecha límite</Text>
                  <Text
                    style={[
                      styles.alertaInfoValue,
                      {
                        color:
                          prestamo.alerta_pago === "vencido"
                            ? "#EF4444"
                            : "#F59E0B",
                        fontWeight: "800",
                      },
                    ]}
                  >
                    {prestamo.fecha_proximo_pago}
                  </Text>
                </View>
              )}
            </View>

            {/* Recomendación */}
            <View style={styles.alertaRecomendacion}>
              <Ionicons name="chatbubble-ellipses" size={16} color={BRAND} />
              <Text style={styles.alertaRecomendacionText}>
                Es importante contactar al cliente para recordarle su pago
                pendiente.
              </Text>
            </View>

            {/* Acciones del modal */}
            <View style={styles.alertaActions}>
              {whatsappHabilitado && (
                <Pressable
                  style={[styles.alertaBtn, styles.alertaBtnWhatsApp]}
                  onPress={() => {
                    setAlertaVisible(false);
                    abrirWhatsApp();
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  <Text style={styles.alertaBtnText}>
                    Contactar por WhatsApp
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.alertaBtn, styles.alertaBtnGhost]}
                onPress={() => setAlertaVisible(false)}
              >
                <Text style={[styles.alertaBtnText, { color: "#E5E7EB" }]}>
                  Entendido
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal custom para motivo de rechazo */}
      <Modal
        visible={modalRechazo}
        transparent
        animationType="fade"
        onRequestClose={() => setModalRechazo(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalRechazo(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Motivo del rechazo</Text>
            <Text style={styles.modalSubtitle}>
              Explica al cliente por qué se rechaza el préstamo.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Documentación incompleta"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              multiline
              numberOfLines={4}
              autoFocus
              editable={!accionando}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => setModalRechazo(false)}
                disabled={accionando}
              >
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnDanger]}
                onPress={handleEnviarRechazo}
                disabled={accionando}
              >
                {accionando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnDangerText}>Rechazar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function DataItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[styles.dataValue, highlight && { color: BRAND }]}>
        {value}
      </Text>
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataRowLabel}>{label}</Text>
      <Text style={styles.dataRowValue}>{value}</Text>
    </View>
  );
}

// ============================================================
// Estilos
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },

  folioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  folio: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  estadoDot: { width: 6, height: 6, borderRadius: 3 },
  estadoText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  alertaPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertaPrincipalText: {
    fontSize: 12,
    fontWeight: "700",
  },

  montoBox: { alignItems: "center", marginVertical: 8 },
  montoLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  montoBig: {
    color: BRAND,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },

  progressWrap: { marginVertical: 12 },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: BRAND,
    borderRadius: 3,
  },
  progressText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  dataItem: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    padding: 10,
  },
  dataLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dataValue: { color: "#fff", fontSize: 14, fontWeight: "700" },

  sectionTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  dataRowLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  dataRowValue: { color: "#fff", fontSize: 13, fontWeight: "600" },

  pagoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  pagoMonto: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pagoFecha: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },
  pagoMetodo: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    textTransform: "capitalize",
  },

  actions: { gap: 10, marginTop: 8 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnPrimary: { backgroundColor: BRAND },
  btnSuccess: { backgroundColor: "#10B981" },
  btnDanger: { backgroundColor: "#EF4444" },
  btnWhatsApp: { backgroundColor: WHATSAPP_GREEN, marginBottom: 12 },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  finalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
  },
  finalText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ============================================================
  // Modal backdrop (común)
  // ============================================================
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  // ============================================================
  // Modal de rechazo
  // ============================================================
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    color: "#fff",
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalBtnGhostText: {
    color: "#E5E7EB",
    fontWeight: "700",
    fontSize: 14,
  },
  modalBtnDanger: {
    backgroundColor: "#EF4444",
  },
  modalBtnDangerText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  // ============================================================
  // Modal de alerta de pago próximo
  // ============================================================
  alertaCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(245,158,11,0.35)",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  alertaIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
  },
  alertaTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  alertaSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  alertaInfoBox: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  alertaInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertaInfoLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  alertaInfoValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  alertaRecomendacion: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,107,53,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  alertaRecomendacionText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 18,
  },

  alertaActions: {
    width: "100%",
    gap: 8,
  },
  alertaBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  alertaBtnWhatsApp: {
    backgroundColor: WHATSAPP_GREEN,
  },
  alertaBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  alertaBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
