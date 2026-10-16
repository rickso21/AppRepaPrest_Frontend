import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  mensaje?: string;
  onReintentar: () => void;
};

export default function PrestamoRechazadoView({
  mensaje,
  onReintentar,
}: Props) {
  const [intentado, setIntentado] = useState(false);
  const handlePress = () => {
    if (!intentado) {
      // Primer intento: revalidar
      setIntentado(true);
      onReintentar();
    } else {
      // Segundo clic: volver al panel principal
      onReintentar();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        {/* ICONO */}
        <View style={styles.iconCircle}>
          <LinearGradient
            colors={["rgba(239,68,68,0.15)", "rgba(239,68,68,0.05)"]}
            style={styles.iconGradient}
          >
            <Ionicons name="close-circle" size={72} color="#EF4444" />
          </LinearGradient>
        </View>

        {/* TÍTULO */}
        <Text style={styles.title}>Solicitud no aprobada</Text>

        {/* MENSAJE EMPÁTICO */}
        <Text style={styles.subtitle}>
          {mensaje || "Por ahora no pudimos aprobar tu solicitud."}
        </Text>

        {/* MENSAJE MOTIVACIONAL */}
        <View style={styles.motivationBox}>
          <Text style={styles.motivationTitle}>
            Para nosotros siempre serás prioridad
          </Text>
          <Text style={styles.motivationText}>
            Tu trabajo como repartidor es valioso para poder aumentar tus
            probabilidades de credito utiliza constantemente nuestra App
          </Text>
        </View>

        {/* TIPS */}
        <View style={styles.tipsBox}>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
            <Text style={styles.tipText}>Mantén tu reputación alta</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
            <Text style={styles.tipText}>
              Completa más entregas cada semana
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
            <Text style={styles.tipText}>Vuelve a intentar en 30 días</Text>
          </View>
        </View>

        {/* BOTÓN */}
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={intentado ? ["#4ADE80", "#22C55E"] : ["#940000", "#E8552E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Ionicons
              name={intentado ? "home" : "refresh"}
              size={20}
              color="#fff"
            />
            <Text style={styles.buttonText}>
              {intentado ? "Volver al panel" : "Volver a intentar"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* NOTA */}
        {intentado && (
          <Text style={styles.note}>Puedes volver a intentar en 30 días</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A12" },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // ICONO
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(239,68,68,0.2)",
  },

  // TÍTULO
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  // MENSAJE MOTIVACIONAL
  motivationBox: {
    backgroundColor: "rgba(255,107,53,0.08)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.2)",
  },
  motivationTitle: {
    color: "#940000",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  motivationText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  // TIPS
  tipsBox: {
    width: "100%",
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    flex: 1,
  },

  // BOTÓN
  button: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // NOTA
  note: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 14,
    fontStyle: "italic",
  },
});
