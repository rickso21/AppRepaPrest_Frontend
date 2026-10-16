import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { authService } from "@/services/auth/AuthService";

const BRAND = "#940000";
const BG = "#16161F";
const BORDER = "rgba(255,255,255,0.08)";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [loading, setLoading] = useState(false);

  // Limpiar al cerrar
  useEffect(() => {
    if (!visible) {
      setActual("");
      setNueva("");
      setConfirmar("");
      setShowActual(false);
      setShowNueva(false);
      setLoading(false);
    }
  }, [visible]);

  const handleGuardar = async () => {
    // Validaciones locales
    if (!actual.trim()) {
      Alert.alert("Atención", "Ingresa tu contraseña actual.");
      return;
    }
    if (nueva.length < 8) {
      Alert.alert(
        "Atención",
        "La nueva contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }
    if (nueva !== confirmar) {
      Alert.alert("Atención", "Las contraseñas nuevas no coinciden.");
      return;
    }
    if (nueva === actual) {
      Alert.alert(
        "Atención",
        "La nueva contraseña no puede ser igual a la actual.",
      );
      return;
    }

    setLoading(true);
    try {
      const data = await authService.changePassword(actual, nueva, confirmar);

      if (data?.res) {
        Alert.alert("Éxito", "Tu contraseña se ha actualizado correctamente.", [
          {
            text: "OK",
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert("Error", data?.msg ?? "No se pudo cambiar la contraseña.");
      }
    } catch (e: any) {
      console.log("[change-password] error:", e);
      const msg =
        e?.msg ?? e?.response?.data?.msg ?? e?.message ?? "Error de red";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.centeredContainer}
        >
          <Pressable style={styles.card} onPress={() => {}}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="key-outline" size={22} color={BRAND} />
              </View>
              <Text style={styles.title}>Cambiar contraseña</Text>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </Pressable>
            </View>

            <Text style={styles.subtitle}>
              Confirma tu contraseña actual y elige una nueva.
            </Text>

            {/* PASSWORD ACTUAL */}
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="rgba(255,255,255,0.4)"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña actual"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={actual}
                onChangeText={setActual}
                secureTextEntry={!showActual}
                editable={!loading}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowActual((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showActual ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="rgba(255,255,255,0.4)"
                />
              </Pressable>
            </View>

            {/* PASSWORD NUEVA */}
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-open-outline"
                size={18}
                color="rgba(255,255,255,0.4)"
              />
              <TextInput
                style={styles.input}
                placeholder="Nueva contraseña (mín. 8)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={nueva}
                onChangeText={setNueva}
                secureTextEntry={!showNueva}
                editable={!loading}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowNueva((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showNueva ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="rgba(255,255,255,0.4)"
                />
              </Pressable>
            </View>

            {/* CONFIRMAR */}
            <View style={styles.inputWrap}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="rgba(255,255,255,0.4)"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={confirmar}
                onChangeText={setConfirmar}
                secureTextEntry={!showNueva}
                editable={!loading}
                autoCapitalize="none"
              />
            </View>

            {/* BOTONES */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.button,
                  styles.saveButton,
                  loading && { opacity: 0.6 },
                ]}
                onPress={handleGuardar}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: BG,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,107,53,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  subtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    marginBottom: 18,
    lineHeight: 18,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14.5,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: BORDER,
  },
  saveButton: {
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cancelText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "600",
  },
  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
