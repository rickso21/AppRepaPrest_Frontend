import { Ionicons } from "@expo/vector-icons";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Props = {
  activo: boolean;
  cargando: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function PanicButton({
  activo,
  cargando,
  disabled,
  onPress,
}: Props) {
  return (
    <Pressable
      style={[
        styles.panicoButton,
        activo && styles.panicoButtonActivo,
        (disabled || cargando) && styles.panicoButtonDisabled,
      ]}
      disabled={disabled || cargando}
      onPress={onPress}
    >
      {cargando ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Ionicons
            name={activo ? "alert-circle" : "warning"}
            size={28}
            color="#000000"
          />
          <Text style={styles.panicoText}>
            {activo ? "¡EMERGENCIA ACTIVA!" : "EMERGENCIA"}
          </Text>
          {activo && (
            <View style={styles.panicoIndicador}>
              <View style={styles.puntoParpadeante} />
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panicoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    opacity: 0.8,
  },
  panicoButtonActivo: {
    opacity: 1,
    backgroundColor: "#B91C1C",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  panicoButtonDisabled: { opacity: 0.4 },
  panicoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  panicoIndicador: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -4 }],
  },
  puntoParpadeante: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF0000",
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
