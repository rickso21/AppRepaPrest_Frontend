import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const POLLING_INTERVAL_MS = 15000;

type RefreshOptions = { silencioso?: boolean };
type EstadoSolicitud = "solicitado" | "aprobado" | "rechazado";

type Props = {
  folio: string;
  montoSolicitado: number;
  pagoQuincenal: number;
  numeroPagos: number;
  onRefresh?: (opts?: RefreshOptions) => void | Promise<void>;
  estadoActual?: EstadoSolicitud;
};

export default function SolicitudEnviadaView({
  folio,
  montoSolicitado,
  pagoQuincenal,
  numeroPagos,
  onRefresh,
  estadoActual = "solicitado",
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [refrescando, setRefrescando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const estadoAnteriorRef = useRef<EstadoSolicitud>(estadoActual);

  // 🔗 REF ESTABLE PARA onRefresh
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    /*
    console.log(
      "[SolicitudEnviada] 🔗 onRefresh actualizado, es función?:",
      typeof onRefresh,
    );*/
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // REF ESTABLE PARA refrescando
  const refrescandoRef = useRef(refrescando);
  useEffect(() => {
    refrescandoRef.current = refrescando;
  }, [refrescando]);

  // REFRESH INMEDIATO AL MONTAR
  useEffect(() => {
    //.log("[SolicitudEnviada] 🚀 MONTADO, refresh inicial");

    if (!onRefreshRef.current) {
      //.log("[SolicitudEnviada] ⚠️ onRefresh es undefined en montaje");
      return;
    }

    Promise.resolve(onRefreshRef.current({ silencioso: true })).catch((e) =>
      console.error("[SolicitudEnviada] Error en montaje:", e),
    );

    return () => {
      //.log("[SolicitudEnviada] 💀 DESMONTADO");
    };
  }, []);

  // ANIMACIONES
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  // 🔄 POLLING CADA 15s
  useEffect(() => {
    /*
    console.log(
      "[SolicitudEnviada] 🕐 POLLING INICIADO, intervalo:",
      POLLING_INTERVAL_MS,
    );
    */

    const interval = setInterval(async () => {
      if (refrescandoRef.current) {
        //.log("[SolicitudEnviada] ⏸️ refresh en curso, se salta");
        return;
      }

      if (!onRefreshRef.current) {
        /*
        console.log(
          "[SolicitudEnviada] ⏸️ onRefresh desactivado (transición), se salta",
        );
        */
        return;
      }

      try {
        //.log("[SolicitudEnviada] 📡 llamando onRefresh...");
        await Promise.resolve(onRefreshRef.current({ silencioso: true }));
        // console.log("[SolicitudEnviada] ✅ onRefresh completado");
      } catch (e) {
        //.log("[SolicitudEnviada] ❌ error en polling:", e);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      //.log("[SolicitudEnviada] 🛑 POLLING DETENIDO");
      clearInterval(interval);
    };
  }, []);

  // 🎯 DETECTAR CAMBIO DE ESTADO
  useEffect(() => {
    /*
    console.log(
      "[SolicitudEnviada] 🔔 estadoActual cambió a:",
      estadoActual,
      "(anterior:",
      estadoAnteriorRef.current,
      ")",
    );
    */

    const anterior = estadoAnteriorRef.current;

    if (anterior !== estadoActual) {
      estadoAnteriorRef.current = estadoActual;
      console.log("[SolicitudEnviada] ✨ transición detectada");

      if (estadoActual === "aprobado") {
        setFeedback("¡Felicidades! Tu préstamo fue aprobado 🎉");
        Alert.alert(
          "¡Préstamo aprobado!",
          "Tu solicitud fue aprobada. Recibirás tu dinero en los próximos minutos.",
          [{ text: "Genial" }],
        );
        setTimeout(() => setFeedback(null), 5000);
      } else if (estadoActual === "rechazado") {
        setFeedback("Tu solicitud fue rechazada");
        Alert.alert(
          "Solicitud rechazada",
          "Lo sentimos, no pudimos aprobar tu solicitud en este momento. Puedes intentarlo de nuevo más tarde.",
          [{ text: "Entendido" }],
        );
        setTimeout(() => setFeedback(null), 5000);
      }
    }
  }, [estadoActual]);

  // PULL-TO-REFRESH
  const handleRefresh = async () => {
    if (refrescando) return;
    if (!onRefreshRef.current) return;

    setRefrescando(true);
    setFeedback(null);

    try {
      await Promise.resolve(onRefreshRef.current({ silencioso: false }));
      setFeedback("Estado actualizado");
      setTimeout(() => setFeedback(null), 2500);
    } catch (error) {
      setFeedback("No se pudo actualizar. Intenta de nuevo.");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setRefrescando(false);
    }
  };

  // ─── Valores dinámicos según el estado ───
  const iconGradient: [string, string] =
    estadoActual === "aprobado"
      ? ["#4ADE80", "#22C55E"]
      : estadoActual === "rechazado"
        ? ["#EF4444", "#DC2626"]
        : ["#940000", "#E8552E"];

  const iconName =
    estadoActual === "aprobado"
      ? "checkmark-circle"
      : estadoActual === "rechazado"
        ? "close-circle"
        : "time";

  const titulo =
    estadoActual === "aprobado"
      ? "¡Préstamo aprobado!"
      : estadoActual === "rechazado"
        ? "Solicitud rechazada"
        : "¡Solicitud enviada!";

  const subtitulo =
    estadoActual === "aprobado"
      ? "Tu dinero está en camino\nRecibirás una notificación pronto"
      : estadoActual === "rechazado"
        ? "Lo sentimos, no pudimos aprobar tu solicitud\nIntenta de nuevo más tarde"
        : "Estamos evaluando tu solicitud\nTe notificaremos cuando sea aprobada";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={handleRefresh}
            tintColor="#940000"
            colors={["#940000"]}
            progressBackgroundColor="#16161F"
          />
        }
      >
        {/* ICONO */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            },
          ]}
        >
          <LinearGradient colors={iconGradient} style={styles.iconCircle}>
            <Ionicons name={iconName as any} size={64} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* TÍTULO */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.subtitle}>{subtitulo}</Text>
        </Animated.View>

        {/* FOLIO */}
        <Animated.View style={[styles.folioCard, { opacity: fadeAnim }]}>
          <Text style={styles.folioLabel}>FOLIO DE TU SOLICITUD</Text>
          <Text style={styles.folioValue}>{folio}</Text>
        </Animated.View>

        {/* DETALLES */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Detalles de tu solicitud</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="cash-outline" size={18} color="#4ADE80" />
              <Text style={styles.detailLabel}>Monto solicitado</Text>
            </View>
            <Text style={styles.detailValue}>
              ${montoSolicitado.toLocaleString("es-MX")}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="calendar-outline" size={18} color="#FFD93D" />
              <Text style={styles.detailLabel}>Pago por quincena</Text>
            </View>
            <Text style={styles.detailValue}>
              ${pagoQuincenal.toLocaleString("es-MX")}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="time-outline" size={18} color="#60A5FA" />
              <Text style={styles.detailLabel}>Plazo</Text>
            </View>
            <Text style={styles.detailValue}>
              {numeroPagos} {numeroPagos === 1 ? "quincena" : "quincenas"}
            </Text>
          </View>
        </Animated.View>

        {/* TIMELINE */}
        <Animated.View style={[styles.timelineCard, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Estado de tu solicitud</Text>

          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotDone]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Solicitud enviada</Text>
                <Text style={styles.timelineDesc}>
                  Recibimos tu solicitud correctamente
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  estadoActual === "solicitado"
                    ? styles.timelineDotCurrent
                    : styles.timelineDotDone,
                ]}
              >
                {estadoActual === "solicitado" ? (
                  <View style={styles.timelineDotInner} />
                ) : (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineTitle,
                    estadoActual === "solicitado" &&
                      styles.timelineTitleCurrent,
                  ]}
                >
                  En revisión
                </Text>
                <Text style={styles.timelineDesc}>
                  {estadoActual === "solicitado"
                    ? "Estamos evaluando tu perfil"
                    : "Revisión completada"}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  estadoActual === "aprobado"
                    ? styles.timelineDotDone
                    : estadoActual === "rechazado"
                      ? styles.timelineDotRejected
                      : styles.timelineDotPending,
                ]}
              >
                {estadoActual === "aprobado" ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : estadoActual === "rechazado" ? (
                  <Ionicons name="close" size={12} color="#fff" />
                ) : (
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color="rgba(255,255,255,0.3)"
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineTitle,
                    estadoActual === "rechazado" && { color: "#EF4444" },
                  ]}
                >
                  {estadoActual === "rechazado" ? "Rechazada" : "Aprobada"}
                </Text>
                <Text style={styles.timelineDesc}>
                  {estadoActual === "aprobado"
                    ? "Recibirás tu dinero en minutos"
                    : estadoActual === "rechazado"
                      ? "Puedes intentar de nuevo más tarde"
                      : "Recibirás tu dinero en minutos"}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* FEEDBACK */}
        {feedback && (
          <Animated.View
            style={[
              styles.feedbackBox,
              feedback.toLowerCase().includes("rechazad") && {
                backgroundColor: "rgba(239,68,68,0.1)",
                borderColor: "rgba(239,68,68,0.25)",
              },
              feedback.toLowerCase().includes("aprobado") && {
                backgroundColor: "rgba(74,222,128,0.1)",
                borderColor: "rgba(74,222,128,0.3)",
              },
              { opacity: fadeAnim },
            ]}
          >
            <Ionicons
              name={
                feedback.toLowerCase().includes("no se pudo") ||
                feedback.toLowerCase().includes("rechazad")
                  ? "alert-circle"
                  : "checkmark-circle"
              }
              size={16}
              color={
                feedback.toLowerCase().includes("no se pudo") ||
                feedback.toLowerCase().includes("rechazad")
                  ? "#EF4444"
                  : "#4ADE80"
              }
            />
            <Text
              style={[
                styles.feedbackText,
                (feedback.toLowerCase().includes("no se pudo") ||
                  feedback.toLowerCase().includes("rechazad")) && {
                  color: "#EF4444",
                },
              ]}
            >
              {feedback}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A12" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    paddingBottom: 60,
  },
  iconContainer: { marginBottom: 24 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#940000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  folioCard: {
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
  },
  folioLabel: {
    color: "rgba(255,107,53,0.8)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  folioValue: {
    color: "#940000",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  detailsCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  detailValue: { color: "#fff", fontSize: 14, fontWeight: "700" },
  detailDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 10,
  },
  timelineCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  timeline: { paddingLeft: 4 },
  timelineStep: { flexDirection: "row", gap: 14 },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  timelineDotDone: { backgroundColor: "#4ADE80" },
  timelineDotCurrent: {
    backgroundColor: "#940000",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotRejected: { backgroundColor: "#EF4444" },
  timelineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  timelineDotPending: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 11,
    marginVertical: 4,
  },
  timelineContent: { flex: 1, paddingTop: 1 },
  timelineTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  timelineTitleCurrent: { color: "#940000" },
  timelineDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  feedbackBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(74,222,128,0.1)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.25)",
  },
  feedbackText: {
    color: "#4ADE80",
    fontSize: 12,
    fontWeight: "600",
  },
});
