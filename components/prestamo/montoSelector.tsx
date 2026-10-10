import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { MontoSugerido } from "../../services/prestamos/prestamoValidator";

const CARD_WIDTH = 120;

type Props = {
  montos: MontoSugerido[];
  montoSeleccionado: number | null;
  onSelect: (monto: MontoSugerido) => void;
  esNuevoUsuario?: boolean; // 🔑 NUEVO
};

export default function MontoSelector({
  montos,
  montoSeleccionado,
  onSelect,
  esNuevoUsuario = false,
}: Props) {
  if (montos.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="alert-circle-outline" size={32} color="#6B7280" />
        <Text style={styles.emptyText}>No hay montos disponibles</Text>
      </View>
    );
  }

  return (
    <View>
      {/* 🔑 HINT para usuario nuevo */}
      {esNuevoUsuario && !montoSeleccionado && (
        <View style={styles.newUserHint}>
          <Ionicons name="information-circle" size={16} color="#FFD93D" />
          <Text style={styles.newUserHintText}>
            Toca un monto para ver cuánto pagarías
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {montos.map((item) => {
          const isSelected = montoSeleccionado === item.monto;

          return (
            <TouchableOpacity
              key={item.monto}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(item)}
              activeOpacity={0.85}
            >
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}

              <Text
                style={[styles.amount, isSelected && styles.amountSelected]}
              >
                ${item.monto}
              </Text>

              <View
                style={[styles.divider, isSelected && styles.dividerSelected]}
              />

              <View style={styles.plazosContainer}>
                {item.puede_1_quincena && (
                  <Text
                    style={[
                      styles.plazoText,
                      isSelected && styles.plazoTextSelected,
                    ]}
                  >
                    • 1 quincena
                  </Text>
                )}
                {item.puede_2_quincenas && (
                  <Text
                    style={[
                      styles.plazoText,
                      isSelected && styles.plazoTextSelected,
                    ]}
                  >
                    • 2 quincenas
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🔑 HINT usuario nuevo
  newUserHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,217,61,0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,217,61,0.2)",
  },
  newUserHintText: {
    color: "#FFD93D",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },

  // SCROLL
  scrollContent: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 20,
  },

  // CARD
  card: {
    width: CARD_WIDTH,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardSelected: {
    borderColor: "#FF6B35",
    backgroundColor: "rgba(255,107,53,0.10)",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // CHECK
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },

  // MONTO
  amount: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  amountSelected: { color: "#FF6B35" },

  // DIVIDER
  divider: {
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 10,
  },
  dividerSelected: {
    backgroundColor: "rgba(255,107,53,0.5)",
  },

  // PLAZOS
  plazosContainer: {
    alignItems: "center",
    gap: 2,
  },
  plazoText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  plazoTextSelected: { color: "rgba(255,255,255,0.85)" },

  // EMPTY
  empty: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
});
