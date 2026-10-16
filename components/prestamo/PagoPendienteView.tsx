import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PagoService } from "../../services/prestamos/PagoService";

const POLLING_INTERVAL_MS = 20000;
const SALDO_MINIMO = 10;

const formatMoney = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const floorTo2 = (n: number) => Math.floor(n * 100) / 100;

const montoToInput = (n: number) => {
  if (!isFinite(n) || n <= 0) return "";
  const floored = floorTo2(n);
  if (floored === Math.floor(floored)) return String(Math.floor(floored));
  return floored.toFixed(2).replace(/\.?0+$/, "");
};

type RefreshOptions = { silencioso?: boolean };

type Props = {
  pagoPendiente: {
    id: number;
    monto: number;
    fechaPago: string;
    referencia: string;
    initPoint?: string | null;
  };
  prestamoFolio: string;
  montoRestante: number;
  usuarioId: number;
  onRefresh?: (opts?: RefreshOptions) => void | Promise<void>;
  onPagoConfirmado?: () => void | Promise<void>;
};

export default function PagoPendienteView({
  pagoPendiente,
  prestamoFolio,
  montoRestante,
  usuarioId,
  onRefresh,
  onPagoConfirmado,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const onPagoConfirmadoRef = useRef(onPagoConfirmado);
  useEffect(() => {
    onPagoConfirmadoRef.current = onPagoConfirmado;
  }, [onPagoConfirmado]);

  // 👇 Ref para el polling sin colisiones
  const refrescandoRef = useRef(false);

  const [showCambiarMonto, setShowCambiarMonto] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState<string>(
    montoToInput(pagoPendiente.monto),
  );
  const [loading, setLoading] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(
    new Date(),
  );

  useEffect(() => {
    refrescandoRef.current = refrescando;
  }, [refrescando]);

  const deudaActual = Math.max(0, Number(montoRestante) || 0);

  const nuevoMontoNum = (() => {
    const n = parseFloat(nuevoMonto.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  })();

  const saldoResultante = Math.max(0, floorTo2(deudaActual - nuevoMontoNum));

  const validacionMonto = (() => {
    if (deudaActual <= 0) {
      return { valido: false, mensaje: "No tienes saldo pendiente." };
    }
    if (nuevoMontoNum <= 0) {
      return { valido: false, mensaje: "Ingresa un monto mayor a 0." };
    }
    if (nuevoMontoNum > deudaActual) {
      return {
        valido: false,
        mensaje: `El monto no puede exceder tu deuda ($${formatMoney(
          deudaActual,
        )}).`,
      };
    }
    if (saldoResultante === 0) {
      return { valido: true, mensaje: "Liquidarás tu préstamo por completo." };
    }
    if (saldoResultante >= SALDO_MINIMO) {
      return {
        valido: true,
        mensaje: `Te quedarán $${formatMoney(saldoResultante)} pendientes.`,
      };
    }

    const paraLiquidar = deudaActual;
    const paraDejarMinimo = floorTo2(deudaActual - SALDO_MINIMO);

    if (paraDejarMinimo <= 0) {
      return {
        valido: false,
        mensaje: `Tu deuda es menor a $${SALDO_MINIMO}. Debes liquidar todo: $${formatMoney(
          paraLiquidar,
        )}.`,
      };
    }

    return {
      valido: false,
      mensaje: `No puedes dejar un saldo menor a $${SALDO_MINIMO}. Paga $${formatMoney(
        paraLiquidar,
      )} para liquidar o $${formatMoney(
        paraDejarMinimo,
      )} para dejar $${SALDO_MINIMO}.`,
    };
  })();

  const montoValido = validacionMonto.valido;

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

  // REFRESH INMEDIATO AL MONTAR
  useEffect(() => {
    if (!onRefreshRef.current) return;

    Promise.resolve(onRefreshRef.current({ silencioso: true }))
      .then(() => setUltimaActualizacion(new Date()))
      .catch((e) => console.error("🔑 Error en montaje:", e));
  }, []);

  // POLLING CON GUARD
  useEffect(() => {
    const interval = setInterval(async () => {
      if (refrescandoRef.current) return; // 👈 no polling durante refresh manual
      try {
        await Promise.resolve(onRefreshRef.current?.({ silencioso: true }));
        setUltimaActualizacion(new Date());
      } catch (e) {}
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const handleIntentarCambiarMonto = () => {
    Alert.alert(
      "Cambiar monto de pago",
      "Si ya realizaste tu pago, espera a que Mercado Pago confirme la transaccion antes de generar un nuevo pago. " +
        "Si cambias el monto y el banco aun no confirma la transaccion y genera errores de transaccion deberas contactar a tu asesor.\n\n" +
        "¿Deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, cambiar",
          style: "destructive",
          onPress: () => setShowCambiarMonto(true),
        },
      ],
      { cancelable: true },
    );
  };

  const handleAbrirMercadoPago = async () => {
    if (!pagoPendiente.initPoint) {
      Alert.alert(
        "Error",
        "No se encontró la referencia de pago. Intenta de nuevo más tarde.",
      );
      return;
    }

    try {
      const puedeAbrir = await Linking.canOpenURL(pagoPendiente.initPoint);
      if (puedeAbrir) {
        await Linking.openURL(pagoPendiente.initPoint);
      } else {
        Alert.alert("Error", "No se pudo abrir Mercado Pago");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir Mercado Pago");
    }
  };

  const handlePagoConfirmado = async () => {
    try {
      if (onPagoConfirmadoRef.current) {
        await Promise.resolve(onPagoConfirmadoRef.current());
      } else if (onRefreshRef.current) {
        await Promise.resolve(onRefreshRef.current({ silencioso: false }));
      }
    } catch (e) {}
  };

  // ============================================
  // PULL-TO-REFRESH
  // ============================================
  const handleRefresh = async () => {
    if (refrescando || !onRefreshRef.current) return;

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

  const handleCambiarMonto = async () => {
    if (!montoValido) return;

    setLoading(true);

    try {
      const res = await PagoService.registrarPago({
        usuario_id: usuarioId,
        monto_pago: floorTo2(nuevoMontoNum),
        referencia: `PAGO-${prestamoFolio}-${Date.now()}`,
        observaciones: "Cambio de monto",
        metodo_pago: "Mercado Pago",
      });

      if (res.success) {
        setShowCambiarMonto(false);

        if (res.data.init_point) {
          try {
            await Linking.openURL(res.data.init_point);
          } catch (linkError) {
            console.error("Error al abrir MP:", linkError);
          }
        }

        if (onRefreshRef.current) {
          await Promise.resolve(onRefreshRef.current({ silencioso: true }));
        }
      } else {
        Alert.alert(
          "No se pudo generar el pago",
          res.message ?? "Intenta con otro monto.",
        );
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Error al actualizar el monto de pago";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarModal = () => {
    if (loading) return;
    setShowCambiarMonto(false);
    setNuevoMonto(montoToInput(pagoPendiente.monto));
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
        // 👇 Pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={handleRefresh}
            tintColor="#FFD93D"
            colors={["#FFD93D"]}
            progressBackgroundColor="#16161F"
          />
        }
      >
        {/* ICONO ANIMADO */}
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
            colors={["#FFD93D", "#F59E0B"]}
            style={styles.iconCircle}
          >
            <Ionicons name="time" size={64} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* TÍTULO */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Text style={styles.title}>Procesando tu pago</Text>
          <Text style={styles.subtitle}>
            Estamos verificando tu pago con Mercado Pago{"\n"}
            Este proceso puede tardar unas hora vuelve mas tarde
          </Text>
        </Animated.View>

        {/* INFO DEL PAGO */}
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <Text style={styles.infoTitle}>Detalles del pago</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Folio del préstamo</Text>
            <Text style={styles.infoValue}>{prestamoFolio}</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Monto enviado</Text>
            <Text style={styles.infoValue}>
              ${formatMoney(pagoPendiente.monto)}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de envío</Text>
            <Text style={styles.infoValue}>{pagoPendiente.fechaPago}</Text>
          </View>

          {pagoPendiente.referencia && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Referencia</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {pagoPendiente.referencia}
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* TIMELINE */}
        <Animated.View style={[styles.timelineCard, { opacity: fadeAnim }]}>
          <Text style={styles.infoTitle}>Estado del pago</Text>

          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotDone]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Pago enviado</Text>
                <Text style={styles.timelineDesc}>
                  Recibimos tu pago correctamente
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
                  Verificando con Mercado Pago
                </Text>
                <Text style={styles.timelineDesc}>
                  Confirmando la transacción
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
                <Text style={styles.timelineTitle}>Pago confirmado</Text>
                <Text style={styles.timelineDesc}>
                  Tu saldo será actualizado
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* INFO BOX */}
        <Animated.View style={[styles.infoBox, { opacity: fadeAnim }]}>
          <Ionicons name="information-circle" size={20} color="#60A5FA" />
          <Text style={styles.infoBoxText}>
            Si aún no completaste tu pago, puedes volver a Mercado Pago usando
            la misma referencia. Desliza hacia abajo para actualizar.
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

        {/* BOTÓN: VOLVER A MERCADO PAGO */}
        {pagoPendiente.initPoint && (
          <View style={{ width: "100%", marginTop: 16 }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAbrirMercadoPago}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#009EE3", "#0081B8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="open-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>
                  VOLVER A MERCADO PAGO
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* BOTÓN: SÍ, YA PAGUÉ */}
        <View style={{ width: "100%", marginTop: 12 }}>
          <TouchableOpacity
            style={styles.successButton}
            onPress={handlePagoConfirmado}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#4ADE80", "#22C55E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>SÍ, YA PAGUÉ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* BOTÓN: CAMBIAR MONTO */}
        <View style={{ width: "100%", marginTop: 12 }}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleIntentarCambiarMonto}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={20} color="#940000" />
            <Text style={styles.secondaryButtonText}>
              Cambiar monto a pagar
            </Text>
          </TouchableOpacity>
        </View>
        {/* ❌ Eliminado el botón "Actualizar estado" — ahora es pull-to-refresh */}
      </ScrollView>

      {/* MODAL: CAMBIAR MONTO */}
      <Modal
        visible={showCambiarMonto}
        transparent
        animationType="fade"
        onRequestClose={handleCerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="create-outline" size={32} color="#940000" />
            </View>

            <Text style={styles.modalTitle}>Cambiar monto</Text>
            <Text style={styles.modalSubtitle}>
              Ingresa el nuevo monto que deseas pagar
            </Text>

            <View style={styles.modalInfoBox}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Deuda restante:</Text>
                <Text style={styles.modalInfoValue}>
                  ${formatMoney(deudaActual)}
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Monto anterior:</Text>
                <Text style={styles.modalInfoValue}>
                  ${formatMoney(pagoPendiente.monto)}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Nuevo monto</Text>
            <View
              style={[
                styles.inputWrapper,
                nuevoMonto.length > 0 &&
                  !montoValido &&
                  styles.inputWrapperError,
                nuevoMonto.length > 0 &&
                  montoValido &&
                  styles.inputWrapperSuccess,
              ]}
            >
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={styles.input}
                value={nuevoMonto}
                onChangeText={(v) => {
                  const limpio = v.replace(/[^0-9.]/g, "");
                  const partes = limpio.split(".");
                  if (partes.length > 2) {
                    setNuevoMonto(`${partes[0]}.${partes.slice(1).join("")}`);
                  } else if (partes[1] && partes[1].length > 2) {
                    setNuevoMonto(`${partes[0]}.${partes[1].slice(0, 2)}`);
                  } else {
                    setNuevoMonto(limpio);
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                editable={!loading}
              />
              <Text style={styles.inputSuffix}>MXN</Text>
            </View>

            {nuevoMonto.length > 0 && (
              <View
                style={[
                  styles.validationBox,
                  montoValido
                    ? styles.validationSuccess
                    : styles.validationError,
                ]}
              >
                <Ionicons
                  name={montoValido ? "checkmark-circle" : "alert-circle"}
                  size={16}
                  color={montoValido ? "#4ADE80" : "#EF4444"}
                />
                <Text
                  style={[
                    styles.validationText,
                    { color: montoValido ? "#4ADE80" : "#EF4444" },
                  ]}
                >
                  {validacionMonto.mensaje}
                </Text>
              </View>
            )}

            <View style={styles.quickButtons}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => setNuevoMonto(montoToInput(deudaActual))}
                disabled={loading}
              >
                <Text style={styles.quickButtonText}>Liquidar todo</Text>
              </TouchableOpacity>
              {deudaActual - SALDO_MINIMO > 0 && (
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() =>
                    setNuevoMonto(montoToInput(deudaActual - SALDO_MINIMO))
                  }
                  disabled={loading}
                >
                  <Text style={styles.quickButtonText}>
                    Dejar ${SALDO_MINIMO}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => setNuevoMonto(montoToInput(pagoPendiente.monto))}
                disabled={loading}
              >
                <Text style={styles.quickButtonText}>Monto anterior</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCerrarModal}
                disabled={loading}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  !montoValido && styles.modalButtonDisabled,
                ]}
                onPress={handleCambiarMonto}
                disabled={loading || !montoValido}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A12" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  iconContainer: { marginBottom: 24 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFD93D",
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
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  infoTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  infoValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },
  infoDivider: {
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
    backgroundColor: "#FFD93D",
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
  timelineTitleCurrent: { color: "#FFD93D" },
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
  infoBoxText: {
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
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  successButton: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,107,53,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
    width: "100%",
  },
  secondaryButtonText: {
    color: "#940000",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1A1A26",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  modalInfoBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalInfoLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  modalInfoValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  inputLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  inputWrapperError: {
    borderColor: "#EF4444",
  },
  inputWrapperSuccess: {
    borderColor: "#4ADE80",
  },
  inputPrefix: {
    color: "#940000",
    fontSize: 22,
    fontWeight: "800",
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    paddingVertical: 14,
  },
  inputSuffix: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "600",
  },
  validationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  validationSuccess: {
    backgroundColor: "rgba(74,222,128,0.1)",
    borderColor: "rgba(74,222,128,0.25)",
  },
  validationError: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.25)",
  },
  validationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  quickButton: {
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.2)",
  },
  quickButtonText: {
    color: "#940000",
    fontSize: 11,
    fontWeight: "700",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalButtonConfirm: {
    backgroundColor: "#940000",
  },
  modalButtonDisabled: {
    backgroundColor: "rgba(255,107,53,0.3)",
  },
  modalButtonTextCancel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtonTextConfirm: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
