import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PagoService } from "../../services/prestamos/PagoService";

// ============================================
// TIPOS
// ============================================

type Props = {
  visible: boolean;
  onClose: () => void;
  onPagoGenerado?: () => void;
  onPagoConfirmado?: () => void;
  usuarioId: number;
  prestamoFolio: string;
  montoSugerido: number;
  montoRestante: number;
  saldoMinimo?: number;
};

// ============================================
// HELPERS
// ============================================

const formatMoney = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 *Redondea un monto a 2 decimales SIN pasarse del límite superior.
 * Ej: 89.999 → 89.99 (no 90.00)
 */
const floorTo2 = (n: number) => Math.floor(n * 100) / 100;

/**
 *Formatea un monto para el input (sin ceros a la derecha innecesarios).
 * Ej: 90.00 → "90", 89.50 → "89.5", 89.99 → "89.99"
 */
const montoToInput = (n: number) => {
  if (!isFinite(n) || n <= 0) return "";
  const floored = floorTo2(n);
  // Si es entero, quitar decimales
  if (floored === Math.floor(floored)) return String(Math.floor(floored));
  // Si no, mostrar con hasta 2 decimales sin ceros finales
  return floored.toFixed(2).replace(/\.?0+$/, "");
};

// ============================================
// COMPONENTE
// ============================================

export default function ModalPago({
  visible,
  onClose,
  onPagoGenerado,
  onPagoConfirmado,
  usuarioId,
  prestamoFolio,
  montoSugerido,
  montoRestante,
  saldoMinimo = 10,
}: Props) {
  const [monto, setMonto] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pagoGenerado, setPagoGenerado] = useState<{
    pagoId: number;
    initPoint: string;
    instrucciones: { pasos: string[]; tiempo_estimado: string };
    monto: number;
  } | null>(null);

  // DERIVADOS

  const deudaActual = useMemo(
    () => Math.max(0, Number(montoRestante) || 0),
    [montoRestante],
  );

  /**
   *  Monto inicial óptimo según el saldo actual:
   * - Si la deuda es 0 → vacío
   * - Si la deuda <= saldo mínimo → liquidar (único válido)
   * - Si la cuota sugerida excede la deuda → liquidar
   * - Si la cuota sugerida deja saldo inválido (1..9) → ajustar a "dejar mínimo"
   * - En otro caso → usar la cuota sugerida
   *
   */
  const montoInicial = useMemo(() => {
    if (deudaActual <= 0) return "";
    if (deudaActual <= saldoMinimo) return montoToInput(deudaActual);
    if (montoSugerido <= 0) return montoToInput(deudaActual);
    if (montoSugerido >= deudaActual) return montoToInput(deudaActual);

    const saldoTrasCuota = deudaActual - montoSugerido;
    if (saldoTrasCuota > 0 && saldoTrasCuota < saldoMinimo) {
      // La cuota sugerida dejaría saldo inválido → ajustar
      return montoToInput(deudaActual - saldoMinimo);
    }

    return montoToInput(montoSugerido);
  }, [deudaActual, montoSugerido, saldoMinimo]);

  /**
   *  Sincroniza el input cuando:
   * - se abre el modal
   * - cambia el saldo restante (después de un pago)
   * - cambia la cuota sugerida
   */
  useEffect(() => {
    if (visible) {
      setMonto(montoInicial);
      setPagoGenerado(null);
    }
  }, [visible, montoInicial]);

  // VALIDACIÓN

  const montoNum = useMemo(() => {
    const n = parseFloat(monto.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }, [monto]);

  const saldoResultante = useMemo(
    () => Math.max(0, floorTo2(deudaActual - montoNum)),
    [deudaActual, montoNum],
  );

  /**
   * Reglas:
   * 1. monto > 0
   * 2. monto <= deudaActual
   * 3. saldo_resultante === 0 (liquidación) OR saldo_resultante >= saldoMinimo
   */
  const validacion = useMemo(() => {
    if (deudaActual <= 0) {
      return {
        valido: false,
        tipo: "sin_deuda" as const,
        mensaje: "No tienes saldo pendiente por pagar.",
      };
    }

    if (montoNum <= 0) {
      return {
        valido: false,
        tipo: "monto_invalido" as const,
        mensaje: "Ingresa un monto mayor a 0.",
      };
    }

    if (montoNum > deudaActual) {
      return {
        valido: false,
        tipo: "excede_deuda" as const,
        mensaje: `El monto no puede exceder tu saldo pendiente ($${formatMoney(
          deudaActual,
        )}).`,
      };
    }

    if (saldoResultante === 0) {
      return {
        valido: true,
        tipo: "liquidacion" as const,
        mensaje: "Pago válido. Liquidarás tu préstamo por completo.",
      };
    }

    if (saldoResultante >= saldoMinimo) {
      return {
        valido: true,
        tipo: "parcial" as const,
        mensaje: `Pago válido. Te quedarán $${formatMoney(
          saldoResultante,
        )} pendientes.`,
      };
    }

    // Saldo resultante entre 1 y (saldoMinimo - 1)
    const paraLiquidar = deudaActual;
    const paraDejarMinimo = floorTo2(deudaActual - saldoMinimo);

    if (paraDejarMinimo <= 0) {
      return {
        valido: false,
        tipo: "solo_liquidar" as const,
        mensaje: `Tu deuda es menor a $${saldoMinimo}, así que debes liquidar todo: $${formatMoney(
          paraLiquidar,
        )}.`,
        opciones: {
          liquidar: paraLiquidar,
        },
      };
    }

    return {
      valido: false,
      tipo: "saldo_bajo" as const,
      mensaje: `No puedes dejar un saldo menor a $${saldoMinimo}. Puedes pagar $${formatMoney(
        paraLiquidar,
      )} para liquidar o $${formatMoney(
        paraDejarMinimo,
      )} para dejar un saldo de $${saldoMinimo}.`,
      opciones: {
        liquidar: paraLiquidar,
        dejarMinimo: paraDejarMinimo,
      },
    };
  }, [deudaActual, montoNum, saldoResultante, saldoMinimo]);

  const montoValido = validacion.valido;

  // ACCIONES

  const handleMontoChange = (value: string) => {
    // Solo dígitos y un punto decimal
    let limpio = value.replace(/[^0-9.]/g, "");
    // Solo un punto
    const partes = limpio.split(".");
    if (partes.length > 2) {
      limpio = `${partes[0]}.${partes.slice(1).join("")}`;
    }
    // Máximo 2 decimales
    if (partes[1] && partes[1].length > 2) {
      limpio = `${partes[0]}.${partes[1].slice(0, 2)}`;
    }
    setMonto(limpio);
  };

  const handleGenerarPago = async () => {
    if (!montoValido) return;

    setLoading(true);

    try {
      const res = await PagoService.registrarPago({
        usuario_id: usuarioId,
        monto_pago: floorTo2(montoNum),
        referencia: `PAGO-${prestamoFolio}-${Date.now()}`,
        observaciones: "Pago quincenal",
        metodo_pago: "Mercado Pago",
      });

      if (res.success) {
        const pagoData = {
          pagoId: res.data.pago_id,
          initPoint: res.data.init_point,
          instrucciones: res.data.datos.instrucciones,
          monto: montoNum,
        };

        setPagoGenerado(pagoData);

        if (onPagoGenerado) onPagoGenerado();

        try {
          const puedeAbrir = await Linking.canOpenURL(pagoData.initPoint);
          if (puedeAbrir) {
            await Linking.openURL(pagoData.initPoint);
          }
        } catch (linkError) {
          console.error("Error al abrir MP:", linkError);
        }
      } else {
        Alert.alert(
          "No se pudo generar el pago",
          res.message ?? "Intenta con otro monto.",
        );
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Error al generar la preferencia de pago";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirMercadoPago = async () => {
    if (!pagoGenerado) return;

    try {
      const puedeAbrir = await Linking.canOpenURL(pagoGenerado.initPoint);
      if (puedeAbrir) {
        await Linking.openURL(pagoGenerado.initPoint);
      } else {
        Alert.alert("Error", "No se pudo abrir Mercado Pago");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir Mercado Pago");
    }
  };

  const handleCambiarMonto = () => {
    setPagoGenerado(null);
    setMonto(montoInicial);
  };

  const handlePagoConfirmado = () => {
    if (onPagoConfirmado) onPagoConfirmado();
    handleClose();
  };

  const handleClose = () => {
    setPagoGenerado(null);
    setMonto(montoInicial);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/*INGRESAR MONTO*/}
            {!pagoGenerado && (
              <>
                <View style={styles.headerIcon}>
                  <LinearGradient
                    colors={["#940000", "#940000"]}
                    style={styles.iconCircle}
                  >
                    <Ionicons name="card" size={40} color="#fff" />
                  </LinearGradient>
                </View>

                <Text style={styles.title}>Pagar cuota</Text>
                <Text style={styles.subtitle}>
                  Ingresa el monto que deseas pagar
                </Text>

                {/* INFO */}
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Folio:</Text>
                    <Text style={styles.infoValue}>{prestamoFolio}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Cuota sugerida:</Text>
                    <Text style={styles.infoValue}>
                      ${formatMoney(Math.min(montoSugerido, deudaActual))}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Deuda restante:</Text>
                    <Text style={styles.infoValue}>
                      ${formatMoney(deudaActual)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Monto a pagar</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    monto.length > 0 &&
                      !validacion.valido &&
                      styles.inputWrapperError,
                    monto.length > 0 &&
                      validacion.valido &&
                      styles.inputWrapperSuccess,
                  ]}
                >
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={monto}
                    onChangeText={handleMontoChange}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    editable={!loading}
                  />
                  <Text style={styles.inputSuffix}>MXN</Text>
                </View>

                {/* BOTONES RÁPIDOS */}
                <View style={styles.quickButtons}>
                  {montoSugerido > 0 &&
                    montoSugerido <= deudaActual &&
                    (deudaActual - montoSugerido === 0 ||
                      deudaActual - montoSugerido >= saldoMinimo) && (
                      <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => setMonto(montoToInput(montoSugerido))}
                        disabled={loading}
                      >
                        <Text style={styles.quickButtonText}>
                          Cuota (${formatMoney(montoSugerido)})
                        </Text>
                      </TouchableOpacity>
                    )}

                  {deudaActual - saldoMinimo > 0 && (
                    <TouchableOpacity
                      style={styles.quickButton}
                      onPress={() =>
                        setMonto(montoToInput(deudaActual - saldoMinimo))
                      }
                      disabled={loading}
                    >
                      <Text style={styles.quickButtonText}>
                        Dejar ${saldoMinimo}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {deudaActual > 0 && (
                    <TouchableOpacity
                      style={styles.quickButton}
                      onPress={() => setMonto(montoToInput(deudaActual))}
                      disabled={loading}
                    >
                      <Text style={styles.quickButtonText}>Liquidar todo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* MENSAJE DE VALIDACIÓN */}
                {monto.length > 0 && (
                  <View
                    style={[
                      styles.validationBox,
                      validacion.valido
                        ? styles.validationSuccess
                        : styles.validationError,
                    ]}
                  >
                    <Ionicons
                      name={
                        validacion.valido ? "checkmark-circle" : "alert-circle"
                      }
                      size={16}
                      color={validacion.valido ? "#4ADE80" : "#EF4444"}
                    />
                    <Text
                      style={[
                        styles.validationText,
                        {
                          color: validacion.valido ? "#4ADE80" : "#EF4444",
                        },
                      ]}
                    >
                      {validacion.mensaje}
                    </Text>
                  </View>
                )}

                {/* BOTONES DE ACCIÓN RÁPIDA CUANDO EL SALDO ES INVÁLIDO */}
                {validacion.tipo === "saldo_bajo" && validacion.opciones && (
                  <View style={styles.opcionesBox}>
                    <Text style={styles.opcionesTitle}>
                      Elige una opción válida:
                    </Text>

                    <TouchableOpacity
                      style={styles.opcionBtn}
                      onPress={() =>
                        setMonto(montoToInput(validacion.opciones!.liquidar))
                      }
                      disabled={loading}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#fff" />
                      <Text style={styles.opcionBtnText}>
                        Liquidar todo ($
                        {formatMoney(validacion.opciones.liquidar)})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.opcionBtn}
                      onPress={() =>
                        setMonto(
                          montoToInput(validacion.opciones!.dejarMinimo!),
                        )
                      }
                      disabled={loading}
                    >
                      <Ionicons name="wallet" size={16} color="#fff" />
                      <Text style={styles.opcionBtnText}>
                        Dejar ${saldoMinimo} de saldo (pagar $
                        {formatMoney(validacion.opciones.dejarMinimo!)})
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {validacion.tipo === "solo_liquidar" && validacion.opciones && (
                  <View style={styles.opcionesBox}>
                    <TouchableOpacity
                      style={styles.opcionBtn}
                      onPress={() =>
                        setMonto(montoToInput(validacion.opciones!.liquidar))
                      }
                      disabled={loading}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#fff" />
                      <Text style={styles.opcionBtnText}>
                        Liquidar todo ($
                        {formatMoney(validacion.opciones.liquidar)})
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonCancel]}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.buttonConfirm,
                      !montoValido && styles.buttonDisabled,
                    ]}
                    onPress={handleGenerarPago}
                    disabled={!montoValido || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonTextConfirm}>Generar pago</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/*PAGO GENERADO (PENDIENTE)*/}
            {pagoGenerado && (
              <>
                <View style={styles.headerIcon}>
                  <LinearGradient
                    colors={["#FFD93D", "#F59E0B"]}
                    style={styles.iconCircle}
                  >
                    <Ionicons name="time" size={40} color="#fff" />
                  </LinearGradient>
                </View>

                <Text style={styles.title}>Pago en proceso</Text>
                <Text style={styles.subtitle}>
                  Si cerraste Mercado Pago por error, puedes volver a intentarlo
                </Text>

                <View style={styles.montoBox}>
                  <Text style={styles.montoLabel}>Monto a pagar</Text>
                  <Text style={styles.montoValue}>
                    ${formatMoney(pagoGenerado.monto)} MXN
                  </Text>
                </View>

                <View style={styles.instruccionesBox}>
                  <Text style={styles.instruccionesTitle}>
                    📋 Instrucciones
                  </Text>
                  {pagoGenerado.instrucciones.pasos.map((paso, idx) => (
                    <Text key={idx} style={styles.paso}>
                      {paso}
                    </Text>
                  ))}
                  <View style={styles.tiempoBox}>
                    <Ionicons name="time-outline" size={16} color="#FFD93D" />
                    <Text style={styles.tiempoText}>
                      {pagoGenerado.instrucciones.tiempo_estimado}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleAbrirMercadoPago}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#940000", "#940000"]}
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

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleCambiarMonto}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create-outline" size={18} color="#940000" />
                  <Text
                    style={[styles.secondaryButtonText, { color: "#940000" }]}
                  >
                    Cambiar monto a pagar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleClose}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={18} color="#60A5FA" />
                  <Text
                    style={[styles.secondaryButtonText, { color: "#60A5FA" }]}
                  >
                    Cerrar
                  </Text>
                </TouchableOpacity>

                <View style={styles.infoBoxSmall}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color="#60A5FA"
                  />
                  <Text style={styles.infoBoxSmallText}>
                    Una vez que confirmes el pago, se verificará automáticamente
                    con Mercado Pago.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerIcon: { alignItems: "center", marginBottom: 16 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  montoBox: {
    backgroundColor: "rgba(255,217,61,0.1)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,217,61,0.3)",
  },
  montoLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  montoValue: {
    color: "#FFD93D",
    fontSize: 28,
    fontWeight: "900",
  },
  infoBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  infoValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
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
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
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
  quickButtonText: { color: "#940000", fontSize: 11, fontWeight: "700" },

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

  opcionesBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  opcionesTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  opcionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#940000",
    borderRadius: 10,
    padding: 12,
  },
  opcionBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  errorText: { color: "#940000", fontSize: 12, flex: 1 },

  instruccionesBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  instruccionesTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  paso: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 4,
  },
  tiempoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  tiempoText: { color: "#FFD93D", fontSize: 12, fontWeight: "600" },
  buttonsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonCancel: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  buttonConfirm: { backgroundColor: "#940000" },
  buttonDisabled: { backgroundColor: "rgba(255,107,53,0.3)" },
  buttonTextCancel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonTextConfirm: { color: "#fff", fontSize: 14, fontWeight: "700" },
  primaryButton: { borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  successButton: { borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
  infoBoxSmall: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(96,165,250,0.08)",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.15)",
  },
  infoBoxSmallText: {
    flex: 1,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    lineHeight: 16,
  },
});
