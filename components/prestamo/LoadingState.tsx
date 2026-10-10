import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  mensaje?: string;
};

export default function LoadingState({ mensaje = "Cargando..." }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={styles.text}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A12",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  text: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
});
