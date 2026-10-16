import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/services/conector/api";

const BRAND = "#940000";
const BG = "#0F0F17";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.08)";

export default function RegistroComercio() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellidoP, setApellidoP] = useState("");
  const [apellidoM, setApellidoM] = useState("");
  const [nombreComercio, setNombreComercio] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegistrar = async () => {
    // Validaciones
    if (!nombre.trim()) {
      Alert.alert("Atención", "Ingresa tu nombre.");
      return;
    }
    if (!nombreComercio.trim()) {
      Alert.alert("Atención", "Ingresa el nombre de tu comercio.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Atención", "Ingresa tu correo.");
      return;
    }
    if (!telefono.trim()) {
      Alert.alert("Atención", "Ingresa tu teléfono.");
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        "Atención",
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }
    if (password !== confirmar) {
      Alert.alert("Atención", "Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/register_comercio", {
        name: nombre.trim(),
        apellido_p: apellidoP.trim() || null,
        apellido_m: apellidoM.trim() || null,
        nombre_comercio: nombreComercio.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        ciudad: ciudad.trim() || null,
        password,
        password_confirmation: confirmar,
      });

      if (data?.res) {
        Alert.alert(
          "¡Registro exitoso!",
          "Tu cuenta de comercio fue creada. Ya puedes iniciar sesión y publicar tus anuncios.",
          [
            {
              text: "Iniciar sesión",
              onPress: () => router.replace("/login"),
            },
          ],
        );
      } else {
        Alert.alert("Error", data?.msg ?? "No se pudo completar el registro.");
      }
    } catch (e: any) {
      const msg = e?.response?.data?.msg ?? e?.message ?? "Error de red";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>

          {/* Header */}
          <View style={styles.headerIcon}>
            <Ionicons name="storefront" size={36} color={BRAND} />
          </View>

          <Text style={styles.title}>Promociona tu negocio</Text>
          <Text style={styles.subtitle}>
            Crea tu cuenta de comercio y llega a más clientes publicando tus
            promociones en la comunidad.
          </Text>

          {/* Formulario */}
          <Text style={styles.label}>Datos del responsable</Text>

          <View style={styles.inputWrap}>
            <Ionicons
              name="person-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={nombre}
              onChangeText={setNombre}
              editable={!loading}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder="Apellido paterno"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={apellidoP}
                onChangeText={setApellidoP}
                editable={!loading}
              />
            </View>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder="Apellido materno"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={apellidoM}
                onChangeText={setApellidoM}
                editable={!loading}
              />
            </View>
          </View>

          <Text style={styles.label}>Datos del comercio</Text>

          <View style={styles.inputWrap}>
            <Ionicons
              name="business-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre del comercio"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={nombreComercio}
              onChangeText={setNombreComercio}
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons
              name="location-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.input}
              placeholder="Ciudad"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={ciudad}
              onChangeText={setCiudad}
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>Contacto</Text>

          <View style={styles.inputWrap}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons
              name="call-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono (10 dígitos)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>Seguridad</Text>

          <View style={styles.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña (mín. 6)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              editable={!loading}
            />
            <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPass ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="rgba(255,255,255,0.4)"
              />
            </Pressable>
          </View>

          <View style={styles.inputWrap}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={confirmar}
              onChangeText={setConfirmar}
              secureTextEntry={!showPass}
              editable={!loading}
            />
          </View>

          {/* Botón */}
          <Pressable
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleRegistrar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="rocket-outline" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  Crear cuenta de comercio
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.legal}>
            Al registrarte aceptas nuestros Términos y Condiciones.
          </Text>

          <Pressable
            style={styles.loginLink}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta?{" "}
              <Text style={{ color: BRAND }}>Inicia sesión</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,107,53,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,107,53,0.35)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
    shadowColor: BRAND,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
    fontSize: 13.5,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },

  label: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    gap: 8,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 10,
  },
  input: { flex: 1, color: "#fff", fontSize: 14.5 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    shadowColor: BRAND,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  legal: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },

  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginLinkText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
});
