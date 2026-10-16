import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import ModalPago from "./modalPago";

// 🖼️ Cambia esta ruta por la imagen que quieras usar
const HERO_IMAGE = require("../../assets/images/animacion-moto-reparto.gif");

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

const formatMoney = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PrestamoAprobadoView({
  prestamo,
  usuarioId,
  onRefresh,
  onModalChange,
}: Props) {
  const insets = useSafeAreaInsets();

  const [showModalPago, setShowModalPago] = useState(false);
  const [showModalContrato, setShowModalContrato] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (onModalChange) onModalChange(showModalPago || showModalContrato);
  }, [showModalPago, showModalContrato]);

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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top > 0 ? 16 : 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
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
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
            <Text style={styles.badgeText}>¡PRÉSTAMO APROBADO!</Text>
          </View>
          <Text style={styles.title}>Tu dinero está listo</Text>
          <Text style={styles.subtitle}>Folio: {prestamo.folio}</Text>
        </View>

        {/* 🖼️ TARJETA PRINCIPAL CON IMAGEN DE FONDO */}
        <ImageBackground
          source={HERO_IMAGE}
          style={styles.amountCard}
          imageStyle={styles.amountCardImage}
          resizeMode="cover"
        >
          {/* Overlay oscuro para legibilidad */}
          <View style={styles.amountCardOverlay} />

          <View style={styles.amountCardContent}>
            <Text style={styles.amountLabel}>
              {montoPagado > 0 ? "Saldo pendiente" : "Monto aprobado"}
            </Text>
            <Text style={styles.amountValue}>
              $
              {formatMoney(
                montoPagado > 0 ? montoRestante : prestamo.montoSolicitado,
              )}
            </Text>

            {montoPagado > 0 && (
              <Text style={styles.amountSubtext}>
                Pagado: ${formatMoney(montoPagado)} de $
                {formatMoney(montoTotal)}
              </Text>
            )}

            <View style={styles.divider} />

            <View style={styles.amountRow}>
              <View>
                <Text style={styles.rowLabel}>Cuota quincenal</Text>
                <Text style={styles.rowValue}>
                  ${formatMoney(prestamo.cuotaQuincenal)}
                </Text>
              </View>
              <View>
                <Text style={styles.rowLabel}>Plazo</Text>
                <Text style={styles.rowValue}>
                  {prestamo.quincenas}{" "}
                  {prestamo.quincenas === 1 ? "quincena" : "quincenas"}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>

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
              ${formatMoney(prestamo.montoSolicitado)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total a pagar</Text>
            <Text style={styles.detailValue}>${formatMoney(montoTotal)}</Text>
          </View>

          {montoPagado > 0 && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto pagado</Text>
                <Text style={[styles.detailValue, { color: "#4ADE80" }]}>
                  ${formatMoney(montoPagado)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Saldo restante</Text>
                <Text style={[styles.detailValue, { color: "#940000" }]}>
                  ${formatMoney(montoRestante)}
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
            colors={["#940000", "#E8552E"]}
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

        {/* BOTÓN VER CONTRATO */}
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => setShowModalContrato(true)}
        >
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

      {/* MODAL DE CONTRATO */}
      <Modal
        visible={showModalContrato}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModalContrato(false)}
      >
        <View style={styles.contratoOverlay}>
          <View
            style={[
              styles.contratoContainer,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <View style={styles.contratoHeader}>
              <View style={styles.contratoHeaderLeft}>
                <Ionicons name="document-text" size={22} color="#940000" />
                <Text style={styles.contratoTitle}>Contrato de Préstamo</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModalContrato(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.contratoScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.contratoFolio}>Folio: {prestamo.folio}</Text>
              <Text style={styles.contratoFecha}>
                Fecha de solicitud: {prestamo.fechaSolicitud}
              </Text>

              <Text style={styles.contratoSectionTitle}>
                1. Partes del contrato
              </Text>
              <Text style={styles.contratoText}>
                El presente contrato se celebra entre{" "}
                <Text style={styles.contratoBold}>Delivery Sobre Ruedas</Text>{" "}
                (en adelante "el Prestador") y el usuario registrado en la
                plataforma (en adelante "el Solicitante"), quien aceptó los
                términos al momento de solicitar el préstamo con folio{" "}
                <Text style={styles.contratoBold}>{prestamo.folio}</Text>.
              </Text>

              <Text style={styles.contratoSectionTitle}>
                2. Monto y condiciones
              </Text>
              <Text style={styles.contratoText}>
                • Monto solicitado:{" "}
                <Text style={styles.contratoBold}>
                  ${formatMoney(prestamo.montoSolicitado)}
                </Text>
                {"\n"}• Monto total a pagar:{" "}
                <Text style={styles.contratoBold}>
                  ${formatMoney(montoTotal)}
                </Text>
                {"\n"}• Cuota quincenal:{" "}
                <Text style={styles.contratoBold}>
                  ${formatMoney(prestamo.cuotaQuincenal)}
                </Text>
                {"\n"}• Plazo: {prestamo.quincenas}{" "}
                {prestamo.quincenas === 1 ? "quincena" : "quincenas"}
                {"\n"}• Próximo pago: {prestamo.fechaProximoPago}
                {montoPagado > 0 && (
                  <>
                    {"\n"}• Monto pagado:{" "}
                    <Text style={styles.contratoBold}>
                      ${formatMoney(montoPagado)}
                    </Text>
                    {"\n"}• Saldo restante:{" "}
                    <Text style={styles.contratoBold}>
                      ${formatMoney(montoRestante)}
                    </Text>
                  </>
                )}
              </Text>

              <Text style={styles.contratoSectionTitle}>
                3. Obligaciones del Solicitante
              </Text>
              <Text style={styles.contratoText}>
                • Realizar los pagos en las fechas acordadas.{"\n"}• Mantener
                activa tu cuenta en Delivery Sobre Ruedas durante la vigencia
                del préstamo.{"\n"}• Proporcionar información veraz y
                actualizada.{"\n"}• Notificar cualquier cambio en tus datos de
                contacto.{"\n"}• No ceder ni transferir el préstamo a terceros
                sin autorización.
              </Text>

              <Text style={styles.contratoSectionTitle}>
                4. Obligaciones del Prestador
              </Text>
              <Text style={styles.contratoText}>
                • Entregar el monto aprobado en el tiempo acordado.{"\n"}•
                Mantener informado al Solicitante sobre el estado del préstamo.
                {"\n"}• Resguardar la información personal conforme a la
                Política de Privacidad.{"\n"}• Proporcionar un canal de atención
                para dudas o aclaraciones.
              </Text>

              <Text style={styles.contratoSectionTitle}>
                5. Incumplimiento y cobranza
              </Text>
              <Text style={styles.contratoText}>
                En caso de incumplimiento en los pagos, el Prestador podrá
                iniciar gestiones de cobranza, suspender temporalmente el acceso
                a nuevos préstamos, y/o aplicar cargos moratorios conforme a las
                políticas vigentes. El incumplimiento reiterado podrá derivar en
                la suspensión de tu cuenta.
              </Text>

              <Text style={styles.contratoSectionTitle}>
                6. Cancelación anticipada
              </Text>
              <Text style={styles.contratoText}>
                El Solicitante podrá liquidar el préstamo de forma anticipada,
                cubriendo el saldo pendiente conforme al desglose vigente. No se
                aplicarán penalizaciones por pago anticipado, salvo intereses ya
                devengados.
              </Text>

              <Text style={styles.contratoSectionTitle}>
                7. Protección de datos
              </Text>
              <Text style={styles.contratoText}>
                Tus datos personales serán tratados conforme a la Ley Federal de
                Protección de Datos Personales en Posesión de los Particulares.
                No serán compartidos con terceros sin tu consentimiento, salvo
                por obligación legal o para fines de cobranza.
              </Text>

              <Text style={styles.contratoSectionTitle}>8. Aceptación</Text>
              <Text style={styles.contratoText}>
                Al haber solicitado y aceptado el presente préstamo, el
                Solicitante manifiesta haber leído, comprendido y aceptado todos
                los términos y condiciones aquí descritos, así como las
                políticas internas de Delivery Sobre Ruedas aplicables al
                otorgamiento de préstamos.
              </Text>

              <View style={{ height: 20 }} />
            </ScrollView>

            <TouchableOpacity
              style={styles.contratoCerrarBtn}
              onPress={() => setShowModalContrato(false)}
            >
              <Text style={styles.contratoCerrarText}>Entendido</Text>
            </TouchableOpacity>
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
  },
  header: { marginBottom: 20 },
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

  // ═══════════ TARJETA PRINCIPAL CON IMAGEN ═══════════
  amountCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#1A1A26", // fallback mientras carga la imagen
  },
  amountCardImage: {
    borderRadius: 24,
  },
  amountCardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)", // 👈 ajusta opacidad si es necesario
  },
  amountCardContent: {
    padding: 24,
  },

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

  // ═══════════ CARDS ═══════════
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

  // ═══════════ BOTONES ═══════════
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

  // ═══════════ MODAL DE CONTRATO ═══════════
  contratoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  contratoContainer: {
    backgroundColor: "#16161F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  contratoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  contratoHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  contratoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  contratoScroll: {
    maxHeight: 500,
  },
  contratoFolio: {
    color: "#60A5FA",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  contratoFecha: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 16,
    fontStyle: "italic",
  },
  contratoSectionTitle: {
    color: "#60A5FA",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 6,
  },
  contratoText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  contratoBold: {
    color: "#fff",
    fontWeight: "700",
  },
  contratoCerrarBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#940000",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  contratoCerrarText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
