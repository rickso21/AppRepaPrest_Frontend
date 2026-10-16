import { StyleSheet, Text, View } from "react-native";
import type { DesglosePago } from "../../services/prestamos/PrestamoService";

type Props = {
  desglose: DesglosePago[];
  pagoQuincenal: number;
  montoTotal: number;
};

export default function DesglosePagosView({
  desglose,
  pagoQuincenal,
  montoTotal,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pago por quincena</Text>
          <Text style={styles.summaryValue}>${pagoQuincenal}</Text>
        </View>
        <View style={styles.dividerVertical} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total a pagar</Text>
          <Text style={styles.summaryValue}>${montoTotal}</Text>
        </View>
      </View>

      <Text style={styles.detailTitle}>Desglose por quincena</Text>

      {desglose.map((item) => (
        <View key={item.quincena} style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <View style={styles.quincenaBadge}>
              <Text style={styles.quincenaText}>Q{item.quincena}</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Capital: ${item.capital}</Text>
              <Text style={styles.detailSubLabel}>
                Interés: ${item.interes} + IVA: ${item.iva}
              </Text>
            </View>
          </View>
          <Text style={styles.detailAmount}>${item.pago_total}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginBottom: 4,
  },
  summaryValue: { color: "#940000", fontSize: 20, fontWeight: "800" },
  dividerVertical: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  detailTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  quincenaBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  quincenaText: { color: "#940000", fontSize: 12, fontWeight: "800" },
  detailLabel: { color: "#fff", fontSize: 13, fontWeight: "600" },
  detailSubLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 2,
  },
  detailAmount: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
