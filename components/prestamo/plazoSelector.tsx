import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  plazosDisponibles: number[];
  plazoSeleccionado: 1 | 2 | null;
  onSelect: (plazo: 1 | 2) => void;
};

export default function PlazoSelector({
  plazosDisponibles,
  plazoSeleccionado,
  onSelect,
}: Props) {
  return (
    <View style={styles.row}>
      {plazosDisponibles.map((plazo) => {
        const isSelected = plazoSeleccionado === plazo;
        const label = plazo === 1 ? "1 quincena" : `${plazo} quincenas`;

        return (
          <TouchableOpacity
            key={plazo}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(plazo as 1 | 2)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={plazo === 1 ? "calendar-outline" : "calendar"}
              size={18}
              color={isSelected ? "#FF6B35" : "rgba(255,255,255,0.5)"}
            />
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  optionSelected: {
    borderColor: "#FF6B35",
    backgroundColor: "rgba(255,107,53,0.12)",
  },
  optionText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  optionTextSelected: { color: "#FF6B35" },
});
