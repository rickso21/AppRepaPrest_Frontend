import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

type Props = {
  conectado: boolean;
  cargando: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function ConnectionButton({
  conectado,
  cargando,
  disabled,
  onPress,
}: Props) {
  return (
    <Pressable
      style={[
        styles.mainButton,
        conectado && styles.mainButtonActive,
        styles.flexButton,
      ]}
      disabled={disabled || cargando}
      onPress={onPress}
    >
      {cargando ? (
        <ActivityIndicator
          color={conectado ? "#4CAF50" : "#fff"}
          size="small"
        />
      ) : (
        <>
          <Ionicons
            name={conectado ? "power" : "flash"}
            size={22}
            color={conectado ? "#4CAF50" : "#fff"}
          />
          <Text
            style={[
              styles.mainButtonText,
              conectado && styles.mainButtonTextActive,
            ]}
          >
            {conectado ? "DESACTIVAR UTR" : "ACTIVAR UTR"}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flexButton: { flex: 1 },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#63ce0c",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#940000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  mainButtonActive: {
    backgroundColor: "rgba(76,175,80,0.15)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.4)",
    shadowOpacity: 0,
    elevation: 0,
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  mainButtonTextActive: { color: "#4CAF50" },
});
