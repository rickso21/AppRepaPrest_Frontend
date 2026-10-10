import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const POLLING_INTERVAL_MS = 20000;

type RefreshOptions = { silencioso?: boolean };

type Props = {
  folio: string;
  montoSolicitado: number;
  pagoQuincenal: number;
  numeroPagos: number;
  onRefresh?: (opts?: RefreshOptions) => void | Promise<void>;
  estadoActual?: "solicitado" | "aprobado" | "rechazado";
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
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(
    new Date(),
  );

  // REF ESTABLE PARA onRefresh
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // REF ESTABLE PARA refrescando (para el polling)
  const refrescandoRef = useRef(refrescando);
  useEffect(() => {
    refrescandoRef.current = refrescando;
  }, [refrescando]);

  // REFRESH INMEDIATO AL MONTAR (silencioso)
  useEffect(() => {
    if (!onRefreshRef.current) return;

    Promise.resolve(onRefreshRef.current({ silencioso: true }))
      .then(() => setUltimaActualizacion(new Date()))
      .catch((e) => console.error(" [Hijo] Error en montaje:", e));
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

  // POLLING CADA 20s (silencioso, sin colisión)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (refrescandoRef.current) return;

      try {
        await Promise.resolve(onRefreshRef.current?.({ silencioso: true }));
        setUltimaActualizacion(new Date());
      } catch (e) {
        // silencioso
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // PULL-TO-REFRESH
  const handleRefresh = async () => {
    if (refrescando) return;
    if (!onRefreshRef.current) return;

    setRefrescando(true);
    setFeedback(null);

    try {
      await Promise.resolve(onRefreshRef.current({ silencioso: false }));
      setUltimaActualizacion(new Date());
      setFeedback("Estado actualizado");
      setTimeout(() => setFeedback(null), 2500);
    } catch (error) {
      setFeedback("No se pudo actualizar. Intenta de nuevo.");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setRefrescando(false);
    }
  };

  const tiempoDesdeActualizacion = (() => {
    const segundos = Math.floor(
      (Date.now() - ultimaActualizacion.getTime()) / 1000,
    );
    if (segundos < 10) return "hace unos segundos";
    if (segundos < 60) return `hace ${segundos} segundos`;
    const minutos = Math.floor(segundos / 60);
    if (minutos === 1) return "hace 1 minuto";
    return `hace ${minutos} minutos`;
  })();

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
            tintColor="#FF6B35"
            colors={["#FF6B35"]}
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
          <LinearGradient
            colors={["#FF6B35", "#E8552E"]}
            style={styles.iconCircle}
          >
            <Ionicons name="time" size={64} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* TÍTULO */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Text style={styles.title}>¡Solicitud enviada!</Text>
          <Text style={styles.subtitle}>
            Estamos evaluando tu solicitud{"\n"}
            Te notificaremos cuando sea aprobada
          </Text>
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
              <View style={[styles.timelineDot, styles.timelineDotCurrent]}>
                <View style={styles.timelineDotInner} />
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[styles.timelineTitle, styles.timelineTitleCurrent]}
                >
                  En revisión
                </Text>
                <Text style={styles.timelineDesc}>
                  Estamos evaluando tu perfil
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotPending]}>
                <Ionicons
                  name="checkmark"
                  size={12}
                  color="rgba(255,255,255,0.3)"
                />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Aprobada</Text>
                <Text style={styles.timelineDesc}>
                  Recibirás tu dinero en minutos
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* INFO */}
        <Animated.View style={[styles.infoBox, { opacity: fadeAnim }]}>
          <Ionicons name="information-circle" size={20} color="#60A5FA" />
          <Text style={styles.infoText}>
            Puedes seguir usando la app mientras evaluamos tu solicitud. Te
            notificaremos cuando esté lista. Desliza hacia abajo para
            actualizar.
          </Text>
        </Animated.View>

        {/* ÚLTIMA ACTUALIZACIÓN */}
        <Animated.View style={[styles.lastUpdateBox, { opacity: fadeAnim }]}>
          <Ionicons
            name="time-outline"
            size={14}
            color="rgba(255,255,255,0.4)"
          />
          <Text style={styles.lastUpdateText}>
            Última actualización {tiempoDesdeActualizacion}
          </Text>
        </Animated.View>

        {/* FEEDBACK */}
        {feedback && (
          <Animated.View style={[styles.feedbackBox, { opacity: fadeAnim }]}>
            <Ionicons
              name={
                feedback.toLowerCase().includes("no se pudo")
                  ? "alert-circle"
                  : "checkmark-circle"
              }
              size={16}
              color={
                feedback.toLowerCase().includes("no se pudo")
                  ? "#EF4444"
                  : "#4ADE80"
              }
            />
            <Text
              style={[
                styles.feedbackText,
                feedback.toLowerCase().includes("no se pudo") && {
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
    shadowColor: "#FF6B35",
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
    color: "#FF6B35",
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
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
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
  timelineTitleCurrent: { color: "#FF6B35" },
  timelineDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(96,165,250,0.08)",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.15)",
  },
  infoText: {
    flex: 1,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    lineHeight: 18,
  },
  lastUpdateBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  lastUpdateText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "500",
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
