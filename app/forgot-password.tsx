import { authService } from "@/services/auth/AuthService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND = "#ff3535";
const BG = "#0F0F17";
const BORDER = "rgba(255,255,255,0.08)";

export default function ForgotPassword() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = async () => {
    if (!identifier.trim()) {
      Alert.alert("Atención", "Ingresa tu correo o teléfono.");
      return;
    }

    setLoading(true);

    //console.log("════════ FORGOT PASSWORD ════════");
    //console.log("Identifier:", identifier);
    //console.log("API baseURL:", api.defaults.baseURL);

    try {
      const data = await authService.forgotPassword(identifier);

      console.log("Response:", JSON.stringify(data));

      if (data?.res) {
        setEnviado(true);
      } else {
        Alert.alert("Error", data?.msg ?? "No se pudo procesar la solicitud.");
      }
    } catch (e: any) {
      //console.log("════════ ERROR CRUDO ════════");
      //console.log("e:", JSON.stringify(e));
      //console.log("e.msg:", e?.msg);
      //console.log("e.response?.data?.msg:", e?.response?.data?.msg);

      // authService ya extrajo response.data, así que prioriza e.msg
      const msg =
        e?.msg ?? e?.response?.data?.msg ?? e?.message ?? "Error de red";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-outline" size={42} color={BRAND} />
          </View>
          <Text style={styles.successTitle}>Revisa tu correo</Text>
          <Text style={styles.successText}>
            Si{" "}
            <Text style={{ color: BRAND, fontWeight: "700" }}>
              {identifier}
            </Text>{" "}
            está registrado, recibirás una nueva contraseña en breve.
          </Text>
          <Text style={styles.successHint}>
            No olvides revisar la carpeta de spam.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={32} color={BRAND} />
          </View>

          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>
            Ingresa tu correo o teléfono y te enviaremos una nueva contraseña.
          </Text>

          <View style={styles.inputWrap}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.input}
              placeholder="Correo o teléfono"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.6 }]}
            onPress={handleEnviar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Enviar nueva contraseña
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  backButton: {
    position: "absolute",
    top: 14,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,107,53,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.35)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 32,
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 20,
  },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  primaryButton: {
    backgroundColor: BRAND,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: BRAND,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  successContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,107,53,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,107,53,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: BRAND,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  successTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  successText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 6,
  },
  successHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 32,
    fontStyle: "italic",
  },
});
