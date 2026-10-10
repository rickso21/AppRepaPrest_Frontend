import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function SolicitudPrestamoScreen() {
  const { userId, userName, montoPreaprobado } = useLocalSearchParams<{
    userId?: string;
    userName?: string;
    montoPreaprobado?: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Solicitud de Préstamo</Text>
        <Text style={styles.text}>Usuario: {userName}</Text>
        <Text style={styles.text}>ID: {userId}</Text>
        <Text style={styles.text}>Monto: ${montoPreaprobado}</Text>
        <Text style={styles.hint}>
          (Migra aquí tu SolicitudPrestamo.tsx original)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A12" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 16 },
  text: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 4 },
  hint: { color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 24 },
});
