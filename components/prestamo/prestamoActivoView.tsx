import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ModalPago from "./modalPago";

type PrestamoData = {
  id: number;
  folio: string;
  montoSolicitado: number;
  montoTotal: number;
  cuotaQuincenal: number;
  quincenas: number;
  fechaSolicitud: string;
  fechaProximoPago: string;
  quincenasRestantes: number;
  progreso: number;
  montoRestante?: number;
};

type Props = {
  prestamo: PrestamoData;
  usuarioId: number;
  onRefresh?: () => void;
  onModalChange?: (abierto: boolean) => void;
};

const SALDO_MINIMO = 10;

const formatMoney = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PrestamoActivoView({
  prestamo,
  usuarioId,
  onRefresh,
  onModalChange,
}: Props) {
  const [showModalPago, setShowModalPago] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  // 👇 Ref estable para onRefresh (por si el padre cambia la identidad)
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (onModalChange) onModalChange(showModalPago);
  }, [showModalPago]);

  // ============================================
  // PULL-TO-REFRESH
  // ============================================
  const handleRefresh = async () => {
    if (refrescando || !onRefreshRef.current) return;

    setRefrescando(true);
    try {
      await Promise.resolve(onRefreshRef.current());
    } catch (e) {
      // silencioso
    } finally {
      setRefrescando(false);
    }
  };

  const saldoPendiente = useMemo(() => {
    if (typeof prestamo.montoRestante === "number") {
      return Math.max(0, prestamo.montoRestante);
    }
    const p = Math.max(0, Math.min(100, prestamo.progreso ?? 0));
    return Math.max(0, prestamo.montoTotal * (1 - p / 100));
  }, [prestamo.montoRestante, prestamo.montoTotal, prestamo.progreso]);

  const saldoEsCero = saldoPendiente <= 0;

  const progreso = useMemo(() => {
    const raw = Math.max(0, Math.min(100, prestamo.progreso ?? 0));
    if (saldoPendiente > 0 && raw >= 100) return 99.99;
    if (saldoEsCero) return 100;
    return raw;
  }, [prestamo.progreso, saldoPendiente, saldoEsCero]);

  const progresoVisual = useMemo(() => {
    if (saldoEsCero) return 100;
    return Math.min(progreso, 99.5);
  }, [progreso, saldoEsCero]);

  const progresoTexto = useMemo(() => {
    if (saldoEsCero) return "100%";
    return `${progreso.toFixed(2)}%`;
  }, [progreso, saldoEsCero]);

  const saldoMenorAlMinimo =
    saldoPendiente > 0 && saldoPendiente < SALDO_MINIMO;
  const saldoCercaDelMinimo =
    saldoPendiente >= SALDO_MINIMO && saldoPendiente <= SALDO_MINIMO + 5;

  const botonTexto = saldoEsCero
    ? "PRÉSTAMO LIQUIDADO"
    : saldoMenorAlMinimo
      ? "LIQUIDAR PRÉSTAMO"
      : "PAGAR CUOTA";

  const botonIcono = saldoEsCero
    ? "checkmark-done-circle"
    : saldoMenorAlMinimo
      ? "alert-circle"
      : "card";

  const botonDeshabilitado = saldoEsCero;

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
            tintColor="#ff3535"
            colors={["#ff3535"]}
            progressBackgroundColor="#16161F"
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
            <Text style={styles.badgeText}>PRÉSTAMO ACTIVO</Text>
          </View>
          <Text style={styles.title}>Tu préstamo está en curso</Text>
          <Text style={styles.subtitle}>Folio: {prestamo.folio}</Text>
        </View>

        {/* MONTO */}
        <LinearGradient
          colors={["#ff3535", "#E8552E"]}
          style={styles.amountCard}
        >
          <Text style={styles.amountLabel}>Monto solicitado</Text>
          <Text style={styles.amountValue}>
            ${formatMoney(prestamo.montoSolicitado)}
          </Text>
          <View style={styles.divider} />
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.rowLabel}>Total a pagar</Text>
              <Text style={styles.rowValue}>
                ${formatMoney(prestamo.montoTotal)}
              </Text>
            </View>
            <View>
              <Text style={styles.rowLabel}>Cuota quincenal</Text>
              <Text style={styles.rowValue}>
                ${formatMoney(prestamo.cuotaQuincenal)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* SALDO PENDIENTE */}
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: "rgba(255,107,53,0.15)" },
              ]}
            >
              <Ionicons name="wallet" size={20} color="#ff3535" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Saldo pendiente</Text>
              <Text style={styles.nextPayment}>
                ${formatMoney(saldoPendiente)}
              </Text>
            </View>
          </View>
        </View>

        {/* ADVERTENCIA SI EL SALDO ESTÁ CERCA DEL MÍNIMO */}
        {saldoCercaDelMinimo && !saldoEsCero && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={16} color="#FFD93D" />
            <Text style={styles.warningText}>
              Tu saldo pendiente es ${formatMoney(saldoPendiente)}. El saldo
              mínimo permitido es ${SALDO_MINIMO}. Puedes pagar $
              {formatMoney(saldoPendiente - SALDO_MINIMO)} o liquidar con $
              {formatMoney(saldoPendiente)}.
            </Text>
          </View>
        )}

        {/* PROGRESO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progreso del pago</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progresoVisual}%` },
                saldoEsCero && styles.progressFillComplete,
              ]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {prestamo.quincenas - prestamo.quincenasRestantes} de{" "}
              {prestamo.quincenas} quincenas pagadas
            </Text>
            <Text
              style={[
                styles.progressPercent,
                saldoEsCero && styles.progressPercentComplete,
              ]}
            >
              {progresoTexto}
            </Text>
          </View>
        </View>

        {/* PRÓXIMO PAGO */}
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color="#FFD93D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Próximo pago</Text>
              <Text style={styles.nextPayment}>
                {prestamo.fechaProximoPago}
              </Text>
            </View>
          </View>
        </View>

        {/* DETALLES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha de solicitud</Text>
            <Text style={styles.detailValue}>{prestamo.fechaSolicitud}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plazo</Text>
            <Text style={styles.detailValue}>
              {prestamo.quincenas} quincenas
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quincenas restantes</Text>
            <Text style={styles.detailValue}>
              {prestamo.quincenasRestantes}
            </Text>
          </View>
        </View>

        {/* BOTÓN PAGAR CUOTA / LIQUIDAR */}
        <TouchableOpacity
          style={[
            styles.button,
            saldoMenorAlMinimo && styles.buttonWarning,
            botonDeshabilitado && styles.buttonDisabled,
          ]}
          onPress={() => {
            if (!botonDeshabilitado) setShowModalPago(true);
          }}
          activeOpacity={0.85}
          disabled={botonDeshabilitado}
        >
          <Ionicons name={botonIcono as any} size={20} color="#fff" />
          <Text style={styles.buttonText}>{botonTexto}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL DE PAGO */}
      <ModalPago
        visible={showModalPago}
        onClose={() => setShowModalPago(false)}
        onPagoGenerado={() => {}}
        onPagoConfirmado={() => {
          setShowModalPago(false);
          if (onRefreshRef.current) onRefreshRef.current();
        }}
        usuarioId={usuarioId}
        prestamoFolio={prestamo.folio}
        montoSugerido={prestamo.cuotaQuincenal}
        montoRestante={saldoPendiente}
        saldoMinimo={SALDO_MINIMO}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A12" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginTop: 24, marginBottom: 20 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(74,222,128,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: "#4ADE80",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#fff" },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  amountCard: { borderRadius: 24, padding: 24, marginBottom: 16 },
  amountLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
  },
  amountValue: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "900",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 16,
  },
  amountRow: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  rowValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4ADE80",
    borderRadius: 5,
  },
  progressFillComplete: {
    backgroundColor: "#22C55E",
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  progressPercent: { color: "#4ADE80", fontSize: 13, fontWeight: "700" },
  progressPercentComplete: { color: "#22C55E" },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,217,61,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextPayment: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  detailValue: { color: "#fff", fontSize: 13, fontWeight: "600" },
  button: {
    marginTop: 12,
    backgroundColor: "#ff3535",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonWarning: {
    backgroundColor: "#F59E0B",
  },
  buttonDisabled: {
    backgroundColor: "rgba(74,222,128,0.3)",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,217,61,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,217,61,0.2)",
  },
  warningText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
