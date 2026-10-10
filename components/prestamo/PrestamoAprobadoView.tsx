import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
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
  montoRestante?: number;
  montoPagado?: number;
  cuotaQuincenal: number;
  quincenas: number;
  quincenasRestantes: number;
  fechaSolicitud: string;
  fechaProximoPago: string;
  progreso: number;
};

type Props = {
  prestamo: PrestamoData;
  usuarioId: number;
  onRefresh?: () => void;
  onModalChange?: (abierto: boolean) => void;
};

export default function PrestamoAprobadoView({
  prestamo,
  usuarioId,
  onRefresh,
  onModalChange,
}: Props) {
  const [showModalPago, setShowModalPago] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  // 👇 Ref estable
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

  const montoTotal = prestamo.montoTotal ?? prestamo.montoSolicitado;
  const montoPagado = prestamo.montoPagado ?? 0;
  const montoRestante = prestamo.montoRestante ?? montoTotal - montoPagado;
  const progreso = Math.max(0, Math.min(100, prestamo.progreso ?? 0));
  const quincenasPagadas = prestamo.quincenas - prestamo.quincenasRestantes;

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
            tintColor="#FF6B35"
            colors={["#FF6B35"]}
            progressBackgroundColor="#16161F"
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
            <Text style={styles.badgeText}>¡PRÉSTAMO APROBADO!</Text>
          </View>
          <Text style={styles.title}>Tu dinero está listo</Text>
          <Text style={styles.subtitle}>Folio: {prestamo.folio}</Text>
        </View>

        {/* TARJETA PRINCIPAL: SALDO PENDIENTE */}
        <LinearGradient
          colors={["#4ADE80", "#22C55E"]}
          style={styles.amountCard}
        >
          <Text style={styles.amountLabel}>
            {montoPagado > 0 ? "Saldo pendiente" : "Monto aprobado"}
          </Text>
          <Text style={styles.amountValue}>
            $
            {(montoPagado > 0
              ? montoRestante
              : prestamo.montoSolicitado
            ).toLocaleString()}
          </Text>

          {montoPagado > 0 && (
            <Text style={styles.amountSubtext}>
              Pagado: ${montoPagado.toLocaleString()} de $
              {montoTotal.toLocaleString()}
            </Text>
          )}

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <View>
              <Text style={styles.rowLabel}>Cuota quincenal</Text>
              <Text style={styles.rowValue}>
                ${prestamo.cuotaQuincenal.toLocaleString()}
              </Text>
            </View>
            <View>
              <Text style={styles.rowLabel}>Plazo</Text>
              <Text style={styles.rowValue}>
                {prestamo.quincenas} quincenas
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* PROGRESO */}
        {montoPagado > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progreso del pago</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progreso}%` }]} />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {quincenasPagadas} de {prestamo.quincenas} quincenas pagadas
              </Text>
              <Text style={styles.progressPercent}>{progreso}%</Text>
            </View>
          </View>
        )}

        {/* PRÓXIMO PAGO */}
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color="#FFD93D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>
                {montoPagado > 0 ? "Próximo pago" : "Primer pago"}
              </Text>
              <Text style={styles.nextPayment}>
                {prestamo.fechaProximoPago}
              </Text>
            </View>
          </View>
        </View>

        {/* DETALLES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del préstamo</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Monto solicitado</Text>
            <Text style={styles.detailValue}>
              ${prestamo.montoSolicitado.toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total a pagar</Text>
            <Text style={styles.detailValue}>
              ${montoTotal.toLocaleString()}
            </Text>
          </View>

          {montoPagado > 0 && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto pagado</Text>
                <Text style={[styles.detailValue, { color: "#4ADE80" }]}>
                  ${montoPagado.toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Saldo restante</Text>
                <Text style={[styles.detailValue, { color: "#FF6B35" }]}>
                  ${montoRestante.toLocaleString()}
                </Text>
              </View>
            </>
          )}

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quincenas restantes</Text>
            <Text style={styles.detailValue}>
              {prestamo.quincenasRestantes}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha de solicitud</Text>
            <Text style={styles.detailValue}>{prestamo.fechaSolicitud}</Text>
          </View>
        </View>

        {/* BOTÓN PAGAR */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowModalPago(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#FF6B35", "#E8552E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryGradient}
          >
            <Ionicons name="card" size={20} color="#fff" />
            <Text style={styles.primaryText}>
              {montoPagado > 0
                ? "PAGAR SIGUIENTE CUOTA"
                : "PAGAR PRIMERA CUOTA"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
          <Ionicons name="document-text-outline" size={18} color="#60A5FA" />
          <Text style={styles.secondaryText}>Ver contrato</Text>
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
        montoRestante={montoRestante}
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
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  amountValue: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "900",
    marginTop: 4,
  },
  amountSubtext: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: 16,
  },
  amountRow: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  rowValue: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 2 },
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
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  progressPercent: { color: "#4ADE80", fontSize: 13, fontWeight: "700" },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,217,61,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextPayment: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  detailValue: { color: "#fff", fontSize: 13, fontWeight: "600" },
  detailDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 8,
  },
  primaryButton: { borderRadius: 16, overflow: "hidden", marginTop: 12 },
  primaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  primaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(96,165,250,0.1)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.2)",
    marginTop: 10,
  },
  secondaryText: { color: "#60A5FA", fontSize: 13, fontWeight: "700" },
});
