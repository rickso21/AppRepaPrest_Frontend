import { authService } from "@/services/auth/AuthService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { JSX, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
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

const { height } = Dimensions.get("window");
const backgroundImage = require("../assets/images/photo-1519501025264-65ba15a82390.jpg");

export default function LoginScreen(): JSX.Element {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const onPressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!emailRegex.test(email) && !phoneRegex.test(email)) {
      Alert.alert(
        "Error",
        "Ingresa un correo válido o número de teléfono (10 dígitos)",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({
        email: email.trim(),
        password: password.trim(),
      });

      const rol = Number(response.user.rol_id);

      if (response.res === true && response.token) {
        /*
        Alert.alert(
          "Gracias por elegirnos",
          "¡Delivery Sobre Ruedas! está contigo a las 24hrs",
        );

        */
        if (rol === 3 || rol === 5) {
          /*
          Alert.alert("Bienvenido Asesor", "Panel de gestión de préstamos");
*/
          router.replace({
            pathname: "/asesor/panel",
            params: {
              userId: String(response.user.id),
              nombre: response.user.nombre,
            },
          });
          return;
        }

        if (rol === 4) {
          router.replace({
            pathname: "/panel",
            params: {
              userId: String(response.user.id),
              nombre: response.user.nombre,
            },
          });
        } else {
          router.replace({
            pathname: "/home",
            params: {
              userId: String(response.user.id),
              nombre: response.user.nombre,
              apellidoPaterno: response.user.apellido_p ?? "",
              apellidoMaterno: response.user.apellido_m ?? "",
              email: response.user.email,
              telefono: response.user.telefono ?? "",
            },
          });
        }
      } else {
        Alert.alert("Error", response.msg || "Datos del usuario incorrectos");
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.msg;

      let mensajeFinal = serverMsg;

      if (!mensajeFinal) {
        if (status === 500) {
          mensajeFinal = "Error en el servidor. Intenta más tarde.";
        } else if (error?.code === "ECONNABORTED") {
          mensajeFinal = "Tiempo de espera agotado. Verifica tu conexión.";
        } else if (error?.request && !error?.response) {
          mensajeFinal = "No se pudo conectar con el servidor.";
        } else {
          mensajeFinal = "Ocurrió un error inesperado.";
        }
      }

      setTimeout(() => {
        Alert.alert("Ups", mensajeFinal);
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
      imageStyle={{ opacity: 0.55 }}
    >
      <StatusBar style="light" />
      <View style={styles.scrim} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.container,
                { opacity: fade, transform: [{ translateY: slide }] },
              ]}
            >
              {/* Botón Volver */}
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={26} color="#fff" />
              </Pressable>

              {/* Encabezado */}
              <View style={styles.header}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require("../assets/images/123.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Delivery Sobre Ruedas</Text>
                <Text style={styles.subtitle}>
                  Inicia sesión para continuar
                </Text>
              </View>

              {/* Formulario */}
              <View style={styles.formContainer}>
                {/* Email / Teléfono */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === "email" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={focusedField === "email" ? "#940000" : "#888"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Correo o número de celular"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === "password" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={focusedField === "password" ? "#940000" : "#888"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Contraseña"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#888"
                    />
                  </Pressable>
                </View>

                {/* Olvidé mi contraseña */}
                <Pressable
                  style={styles.forgotPasswordContainer}
                  onPress={() => router.push("/forgot-password")}
                  hitSlop={8}
                >
                  <Text style={styles.forgotPasswordText}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </Pressable>

                {/* Botón Iniciar Sesión */}
                <Animated.View
                  style={{ transform: [{ scale: buttonScale }], width: "100%" }}
                >
                  <Pressable
                    style={[
                      styles.loginButton,
                      loading && styles.disabledButton,
                    ]}
                    onPress={handleLogin}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text
                          style={[
                            styles.loginButtonText,
                            { marginLeft: 10, marginRight: 0 },
                          ]}
                        >
                          CARGANDO...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>
                          INICIAR SESIÓN
                        </Text>
                        <Ionicons name="arrow-forward" size={22} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                {/* Registro */}
                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                  <Pressable
                    onPress={() => router.push("/role-selection")}
                    hitSlop={8}
                    disabled={loading}
                  >
                    <Text style={styles.registerLink}>Regístrate</Text>
                  </Pressable>
                </View>

                {/* Promocionar mi negocio */}
                <Pressable
                  style={({ pressed }) => [
                    styles.promoteButton,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => router.push("/registro_negocio")}
                  disabled={loading}
                >
                  <View style={styles.promoteIconWrap}>
                    <Ionicons
                      name="storefront-outline"
                      size={18}
                      color="#940000"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promoteTitle}>
                      Promocionar mi negocio
                    </Text>
                    <Text style={styles.promoteSubtitle}>
                      Publica tus anuncios y llega a más clientes
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#940000" />
                </Pressable>
              </View>

              <Text style={styles.version}>Beta v1.0.0</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },

  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 10, 20, 0.75)",
  },

  safeArea: { flex: 1, backgroundColor: "transparent" },
  keyboardView: { flex: 1 },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 24,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    width: "100%",
    maxWidth: 500,
    // ❌ quitado flex: 1 y justifyContent: "space-between"
    // ✅ ahora el contenido fluye naturalmente
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#940000",
    shadowColor: "#940000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },

  logoImage: { width: "88%", height: "88%", borderRadius: 53 },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
    letterSpacing: 0.5,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    fontWeight: "400",
    textAlign: "center",
  },

  //FORMULARIO (con espaciado correcto)
  formContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  inputFocused: {
    borderColor: "#940000",
    backgroundColor: "#fff5f0",
  },

  inputIcon: { marginRight: 12 },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1a1a1a",
  },

  passwordInput: { paddingRight: 40 },

  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },

  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 18,
    marginTop: 0,
  },

  forgotPasswordText: {
    color: "#940000",
    fontSize: 13,
    fontWeight: "600",
  },

  loginButton: {
    backgroundColor: "#c91111",
    paddingVertical: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#c91111",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },

  disabledButton: { opacity: 0.7 },

  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 10,
    letterSpacing: 2,
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },

  registerText: { color: "#666", fontSize: 14 },
  registerLink: { color: "#940000", fontSize: 14, fontWeight: "700" },

  promoteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,107,53,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,107,53,0.35)",
    borderStyle: "dashed",
  },

  promoteIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.35)",
  },

  promoteTitle: {
    color: "#940000",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  promoteSubtitle: {
    color: "#666",
    fontSize: 11,
    marginTop: 2,
  },

  version: {
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontSize: 11,
    marginTop: 20,
    letterSpacing: 1,
    width: "100%",
  },
});
