import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  onPress: () => void;
  saving?: boolean;
  label?: string;
};

export default function SaveButton({
  onPress,
  saving = false,
  label = "GUARDAR CAMBIOS",
}: Props) {
  return (
    <Pressable
      style={[styles.button, saving && styles.disabled]}
      onPress={onPress}
      disabled={saving}
    >
      <Text style={styles.text}>{saving ? "GUARDANDO..." : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FF6B35",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  disabled: { opacity: 0.6 },
  text: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1.5 },
});
