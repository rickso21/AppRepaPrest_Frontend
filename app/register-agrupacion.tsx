import { useRegisterImages } from "@/hooks/register/useRegisterImages";
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
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ESTADOS_MEXICO = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

const { height } = Dimensions.get("window");
const backgroundImage = require("../assets/images/photo-1519501025264-65ba15a82390.jpg");

type FieldKey =
  | "responsable"
  | "agrupacion"
  | "ciudad"
  | "telefono"
  | "email"
  | "password"
  | "confirmPassword";

type FormState = Record<FieldKey, string>;
type ErrorState = Partial<Record<FieldKey, string>>;

const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const PHONE_VALID = /^[1-9][0-9]{9}$/;

export default function RegisterAgrupacionScreen(): JSX.Element {
  const router = useRouter();

  const {
    avatarUri,
    portadaUri,
    elegirImagen,
    construirFormData,
    resetAvatar,
    resetPortada,
  } = useRegisterImages();

  const [form, setForm] = useState<FormState>({
    responsable: "",
    agrupacion: "",
    ciudad: "",
    telefono: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [filteredEstados, setFilteredEstados] =
    useState<string[]>(ESTADOS_MEXICO);

  const [aceptoTerminos, setAceptoTerminos] = useState<boolean>(false);
  const [modalTerminosVisible, setModalTerminosVisible] =
    useState<boolean>(false);

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

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredEstados(ESTADOS_MEXICO);
    } else {
      setFilteredEstados(
        ESTADOS_MEXICO.filter((estado) =>
          estado.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    }
  }, [searchText]);

  const onPressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const handleChange = (key: FieldKey, text: string) => {
    let clean = text;
    if (key === "telefono") clean = text.replace(/[^0-9]/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, [key]: clean }));
  };

  const selectEstado = (estado: string) => {
    setForm((prev) => ({ ...prev, ciudad: estado }));
    setModalVisible(false);
    setSearchText("");
    if (errors.ciudad) setErrors((prev) => ({ ...prev, ciudad: undefined }));
  };

  const validate = (): boolean => {
    const next: ErrorState = {};

    if (!form.responsable.trim())
      next.responsable = "Ingresa el nombre del responsable";
    if (!form.agrupacion.trim())
      next.agrupacion = "Ingresa el nombre de la agrupación";
    if (!form.ciudad.trim()) next.ciudad = "Selecciona un estado";
    if (!form.telefono.trim()) next.telefono = "El teléfono es obligatorio";
    if (!PHONE_VALID.test(form.telefono))
      next.telefono = "Teléfono inválido (10 dígitos)";
    if (!EMAIL_VALID.test(form.email.trim()))
      next.email = "Correo electrónico inválido";
    if (form.password.length < 8) next.password = "Mínimo 8 caracteres";
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Las contraseñas no coinciden";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegistrar = async (): Promise<void> => {
    if (!aceptoTerminos) {
      Alert.alert(
        "Términos y condiciones",
        "Debes aceptar los términos y condiciones para continuar con el registro.",
        [{ text: "Entendido" }],
      );
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      const nombreCompleto = form.responsable.trim().split(" ");
      const nombre = nombreCompleto[0] || "Administrador";
      const apellidoP = nombreCompleto[1] || "Principal";
      const apellidoM = nombreCompleto.slice(2).join(" ") || "ADMIN GRUPO";

      const campos = {
        name: nombre,
        apellido_p: apellidoP,
        apellido_m: apellidoM,
        email: form.email.trim(),
        telefono: form.telefono,
        ciudad: form.ciudad,
        password: form.password,
        password_confirmation: form.confirmPassword,
        name_group: form.agrupacion.trim(),
      };

      const formData = construirFormData(campos);

      const response = await authService.registerAgrupacion(
        (formData as any) ?? campos,
      );

      const esExito =
        response.res === true ||
        (response.code && response.code.length > 0) ||
        (response.msg && response.msg.includes("Exito")) ||
        (response.msg && response.msg.includes("éxito"));

      if (esExito) {
        const codigoGenerado = response.code || "Código no disponible";
        router.replace({
          pathname: "/RegisterAgrupacionSuccess",
          params: {
            agrupacion: form.agrupacion.trim(),
            codigo: codigoGenerado,
          },
        });
      } else {
        Alert.alert(
          "Error al registrar",
          response.msg || "Ocurrió un error al registrar la agrupación.",
        );
      }
    } catch (error: any) {
      const fieldErrors: ErrorState = {};
      const errorsData = error.errors || error.response?.data?.errors;

      if (errorsData) {
        const fieldMapping: Record<string, FieldKey> = {
          name: "responsable",
          apellido_p: "responsable",
          apellido_m: "responsable",
          email: "email",
          telefono: "telefono",
          password: "password",
          name_group: "agrupacion",
          ciudad: "ciudad",
        };

        Object.keys(errorsData).forEach((backendKey) => {
          const frontendKey = fieldMapping[backendKey];
          if (frontendKey) {
            const errorMessages = errorsData[backendKey];
            if (Array.isArray(errorMessages) && errorMessages.length > 0) {
              fieldErrors[frontendKey] = errorMessages[0];
            } else if (typeof errorMessages === "string") {
              fieldErrors[frontendKey] = errorMessages;
            }
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
          Alert.alert(
            "Errores en el formulario",
            "Por favor, revisa los campos marcados en rojo.",
            [{ text: "Entendido" }],
          );
          setLoading(false);
          return;
        }
      }

      let errorMessage =
        "Ocurrió un error inesperado. Por favor, intenta nuevamente.";
      let errorTitle = "Error";

      if (error.response?.status === 409) {
        errorTitle = "Conflicto";
        errorMessage =
          error.response.data?.msg || "Ya existe un registro con estos datos.";
      } else if (error.msg) {
        errorMessage = error.msg;
      } else if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message && error.message.includes("Network Error")) {
        errorTitle = "Error de conexión";
        errorMessage =
          "No se pudo conectar al servidor. Verifica tu conexión a internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    key: FieldKey,
    icon: string,
    placeholder: string,
    options?: {
      secure?: boolean;
      isSecureVisible?: boolean;
      onToggleSecure?: () => void;
      keyboardType?: "default" | "email-address" | "phone-pad";
      isPicker?: boolean;
    },
  ) => {
    const isFocused = focusedField === key;
    const error = errors[key];

    if (key === "ciudad") {
      return (
        <View style={styles.fieldBlock} key={key}>
          <Pressable
            style={[
              styles.inputContainer,
              isFocused && styles.inputFocused,
              !!error && styles.inputError,
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons
              name={icon as any}
              size={20}
              color={
                error ? "#ff3535" : isFocused ? "#ff3535" : "rgba(3, 3, 3, 0.5)" // ⚠️ BLANCO TRANSLÚCIDO
              }
              style={styles.inputIcon}
            />
            <Text
              style={[
                styles.input,
                styles.pickerText,
                !form.ciudad && styles.placeholderText,
              ]}
            >
              {form.ciudad || placeholder}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color="rgba(3, 3, 3, 0.4)"
              style={styles.pickerIcon}
            />
          </Pressable>
          {!!error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#FF4D4D" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.fieldBlock} key={key}>
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            !!error && styles.inputError,
          ]}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={
              error ? "#ff3535" : isFocused ? "#ff3535" : "rgba(0, 0, 0, 0.5)" // ⚠️ BLANCO TRANSLÚCIDO
            }
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, options?.secure && styles.passwordInput]}
            placeholder={placeholder}
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={form[key]}
            onChangeText={(t) => handleChange(key, t)}
            onFocus={() => setFocusedField(key)}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={options?.secure && !options?.isSecureVisible}
            keyboardType={options?.keyboardType ?? "default"}
            autoCapitalize={
              options?.keyboardType === "email-address" ? "none" : "sentences"
            }
            autoCorrect={false}
          />
          {options?.secure && (
            <Pressable
              onPress={options.onToggleSecure}
              style={styles.eyeIcon}
              hitSlop={10}
            >
              <Ionicons
                name={
                  options.isSecureVisible ? "eye-outline" : "eye-off-outline"
                }
                size={20}
                color="rgba(0, 0, 0, 0.5)"
              />
            </Pressable>
          )}
        </View>
        {!!error && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={13} color="#FF4D4D" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFotos = () => (
    <View style={styles.photoSection}>
      <View style={styles.photoSectionHeader}>
        <Ionicons name="images-outline" size={18} color="#ff3535" />
        <Text style={styles.photoSectionTitle}>Fotos (opcional)</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarPickerRow}>
        <Pressable
          style={styles.avatarPicker}
          onPress={() => elegirImagen("avatar")}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
          ) : (
            <Ionicons name="camera-outline" size={28} color="#ff3535" />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.photoLabel}>Foto de perfil</Text>
          <Text style={styles.photoHint}>
            {avatarUri ? "Toca para cambiarla" : "Toca el círculo para elegir"}
          </Text>
        </View>
        {avatarUri && (
          <Pressable style={styles.removePhotoBtn} onPress={resetAvatar}>
            <Ionicons name="close" size={18} color="#EF4444" />
          </Pressable>
        )}
      </View>

      {/* Portada */}
      <Pressable
        style={styles.portadaPicker}
        onPress={() => elegirImagen("portada")}
      >
        {portadaUri ? (
          <>
            <Image source={{ uri: portadaUri }} style={styles.portadaPreview} />
            <View style={styles.portadaOverlay}>
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.portadaOverlayText}>Cambiar portada</Text>
            </View>
          </>
        ) : (
          <View style={styles.portadaPlaceholder}>
            <Ionicons name="image-outline" size={32} color="#ff3535" />
            <Text style={styles.photoHint}>Toca para elegir portada</Text>
          </View>
        )}
      </Pressable>

      {portadaUri && (
        <Pressable style={styles.removePortadaBtn} onPress={resetPortada}>
          <Ionicons name="close-circle" size={16} color="#EF4444" />
          <Text style={styles.removePortadaText}>Quitar portada</Text>
        </Pressable>
      )}
    </View>
  );

  const renderTerminos = () => (
    <View style={styles.terminosContainer}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAceptoTerminos(!aceptoTerminos)}
        activeOpacity={0.7}
      >
        <View
          style={[styles.checkbox, aceptoTerminos && styles.checkboxChecked]}
        >
          {aceptoTerminos && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
        <Text style={styles.terminosText}>
          Acepto los{" "}
          <Text
            style={styles.terminosLink}
            onPress={() => setModalTerminosVisible(true)}
          >
            Términos y Condiciones
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTerminosModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={modalTerminosVisible}
      onRequestClose={() => setModalTerminosVisible(false)}
    >
      <View style={styles.modalOverlayTerminos}>
        <View style={styles.modalContainerTerminos}>
          <View style={styles.modalHeaderTerminos}>
            <Text style={styles.modalTitleTerminos}>
              Términos y Condiciones
            </Text>
            <Pressable
              onPress={() => setModalTerminosVisible(false)}
              style={styles.modalCloseTerminos}
            >
              <Ionicons name="close" size={24} color="#070707" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContentTerminos}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalSectionTerminos}>
              <Ionicons name="shield-checkmark" size={24} color="#FF6B35" />
              <Text style={styles.modalSectionTitleTerminos}>
                Seguridad de tus datos
              </Text>
              <Text style={styles.modalTextTerminos}>
                Toda la información que proporcionas en Delivery Sobre Ruedas
                está encriptada y protegida con los más altos estándares de
                seguridad. Tus datos personales, incluyendo correo electrónico,
                teléfono y contraseña, son almacenados de forma segura y nunca
                serán compartidos con terceros sin tu consentimiento explícito.
              </Text>
            </View>

            <View style={styles.modalSectionTerminos}>
              <Ionicons name="trash-outline" size={24} color="#ff3535" />
              <Text style={styles.modalSectionTitleTerminos}>
                Eliminación de cuenta
              </Text>
              <Text style={styles.modalTextTerminos}>
                Cuando solicitas la eliminación de tu cuenta, todos tus datos
                personales son marcados para su eliminación definitiva. Tus
                datos permanecerán almacenados de forma temporal durante un
                período de 1 año, tiempo durante el cual podrás restaurar tu
                cuenta si así lo deseas.
              </Text>
              <Text style={styles.modalSubTextTerminos}>
                ⚠️ Transcurrido este período, toda tu información será eliminada
                de forma permanente y no podrá ser recuperada.
              </Text>
              <Text style={styles.modalSubTextTerminos_}>
                ⚠️ Si solicitaste un servicio adicional como un prestamo y este
                se encuentra vigente no podras, eliminar tu cuenta hasta saldar
                tu cuenta con nosotros.
              </Text>
            </View>

            <View style={styles.modalSectionTerminos}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#ff3535"
              />
              <Text style={styles.modalSectionTitleTerminos}>
                Política de privacidad
              </Text>
              <Text style={styles.modalTextTerminos}>
                • Tus datos son utilizados exclusivamente para la operación de
                la plataforma Delivery Sobre Ruedas.
              </Text>
              <Text style={styles.modalTextTerminos}>
                • No compartimos tu información con terceros sin tu
                consentimiento.
              </Text>
              <Text style={styles.modalTextTerminos}>
                • Puedes acceder, modificar o solicitar la eliminación de tus
                datos en cualquier momento.
              </Text>
              <Text style={styles.modalTextTerminos}>
                • La seguridad de tu información es nuestra prioridad.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalAcceptButtonTerminos}
              onPress={() => {
                setAceptoTerminos(true);
                setModalTerminosVisible(false);
              }}
            >
              <Text style={styles.modalAcceptButtonTextTerminos}>
                Acepto los términos
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
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
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={26} color="#070606" />
              </Pressable>

              <View style={styles.header}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require("../assets/images/123.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Registre su agrupación</Text>
                <Text style={styles.subtitle}>
                  Completa los datos para continuar
                </Text>
              </View>

              <View style={styles.formContainer}>
                {renderInput(
                  "responsable",
                  "person-outline",
                  "Nombre del responsable",
                )}
                {renderInput(
                  "agrupacion",
                  "business-outline",
                  "Nombre de la agrupación",
                )}
                {renderInput(
                  "ciudad",
                  "location-outline",
                  "Selecciona un estado",
                )}
                {renderInput(
                  "telefono",
                  "call-outline",
                  "Teléfono de contacto",
                  { keyboardType: "phone-pad" },
                )}
                {renderInput("email", "mail-outline", "Correo electrónico", {
                  keyboardType: "email-address",
                })}
                {renderInput("password", "lock-closed-outline", "Contraseña", {
                  secure: true,
                  isSecureVisible: showPassword,
                  onToggleSecure: () => setShowPassword(!showPassword),
                })}
                {renderInput(
                  "confirmPassword",
                  "lock-closed-outline",
                  "Confirmar contraseña",
                  {
                    secure: true,
                    isSecureVisible: showConfirm,
                    onToggleSecure: () => setShowConfirm(!showConfirm),
                  },
                )}

                {renderFotos()}

                {renderTerminos()}

                <Animated.View
                  style={{
                    transform: [{ scale: buttonScale }],
                    width: "100%",
                    marginTop: 8,
                  }}
                >
                  <Pressable
                    style={[
                      styles.button,
                      (loading || !aceptoTerminos) && styles.buttonDisabled,
                    ]}
                    onPress={handleRegistrar}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    disabled={loading || !aceptoTerminos}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text
                          style={[
                            styles.buttonText,
                            { marginLeft: 10, marginRight: 0 },
                          ]}
                        >
                          REGISTRANDO...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.buttonText}>REGISTRARSE</Text>
                        <Ionicons name="arrow-forward" size={22} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                  <Pressable onPress={() => router.push("/login")} hitSlop={8}>
                    <Text style={styles.loginLink}>Inicia sesión</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.version}>v1.0.0</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modal estado */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona un estado</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color="#161414" />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="rgba(0, 0, 0, 0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar estado..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="words"
              />
              {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="rgba(0, 0, 0, 0.4)"
                  />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filteredEstados}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.estadoItem,
                    form.ciudad === item && styles.estadoItemSelected,
                  ]}
                  onPress={() => selectEstado(item)}
                >
                  <Text
                    style={[
                      styles.estadoText,
                      form.ciudad === item && styles.estadoTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {form.ciudad === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#FF6B35"
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No se encontraron estados
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {renderTerminosModal()}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 10, 20, 0.55)",
  },
  safeArea: { flex: 1, backgroundColor: "transparent" },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
    paddingHorizontal: 28,
    paddingVertical: Platform.OS === "ios" ? 50 : 36,
    alignItems: "center",
  },
  container: { flex: 1, width: "100%", maxWidth: 500, paddingBottom: 40 },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(7, 6, 6, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  header: { alignItems: "center", marginTop: 6 },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#ff3535",
    shadowColor: "#ff3535",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 16,
  },
  logoImage: { width: "88%", height: "88%", borderRadius: 58 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14.5,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
    fontWeight: "400",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginVertical: 20,
    backgroundColor: "#ffffffaf", // 👈 fondo blanco
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  fieldBlock: { width: "100%", marginBottom: 26, position: "relative" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5", // 👈 gris muy claro
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0", // 👈 borde gris claro
  },
  inputFocused: {
    borderColor: "#ff3535",
    backgroundColor: "#fff5f0", // 👈 blanco con tinte rojo al enfocar
  },
  inputError: {
    borderColor: "#ff3535",
    backgroundColor: "rgba(255,77,77,0.08)",
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15.5,
    color: "#1a1a1a", // 👈 texto oscuro
  },
  passwordInput: { paddingRight: 40 },
  eyeIcon: { position: "absolute", right: 16 },
  errorRow: {
    position: "absolute",
    top: "100%",
    left: 4,
    right: 0,
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: { color: "#ff3535", fontSize: 12, marginLeft: 5, flex: 1 },
  button: {
    backgroundColor: "#ff3535",
    paddingVertical: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#ff3535",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 10,
    letterSpacing: 2,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
  loginText: { color: "#666", fontSize: 14 }, // 👈 antes rgba(7, 5, 5, 0.6)
  loginLink: { color: "#ff3535", fontSize: 14, fontWeight: "700" },
  version: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    fontSize: 11,
    marginTop: 24,
    letterSpacing: 1,
    width: "100%",
  },
  pickerText: {
    flex: 1,
    fontSize: 15.5,
    color: "#0c0b0b",
    paddingVertical: 15,
  },
  placeholderText: { color: "rgba(12, 11, 11, 0.4)" },
  pickerIcon: { marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1C1C28",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  modalClose: { padding: 4 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: "#fff",
  },
  estadoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  estadoItemSelected: { backgroundColor: "rgba(255,107,53,0.08)" },
  estadoText: { fontSize: 15, color: "rgba(255,255,255,0.8)" },
  estadoTextSelected: { color: "#ff3535", fontWeight: "600" },
  emptyContainer: { paddingVertical: 30, alignItems: "center" },
  emptyText: { color: "rgba(29, 29, 29, 0.4)", fontSize: 14 },
  terminosContainer: { width: "100%", marginTop: 4, marginBottom: 12 },
  checkboxContainer: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(2, 2, 2, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  checkboxChecked: { backgroundColor: "#ff3535", borderColor: "#ff3535" },
  terminosText: { fontSize: 13, color: "rgba(255,255,255,0.7)", flex: 1 },
  terminosLink: {
    color: "#ff3535",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  modalOverlayTerminos: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainerTerminos: {
    backgroundColor: "#1C1C28",
    borderRadius: 24,
    width: "90%",
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeaderTerminos: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitleTerminos: { fontSize: 18, fontWeight: "700", color: "#fff" },
  modalCloseTerminos: { padding: 4 },
  modalContentTerminos: { paddingHorizontal: 20, paddingTop: 16 },
  modalSectionTerminos: { marginBottom: 24 },
  modalSectionTitleTerminos: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
    marginBottom: 6,
  },
  modalTextTerminos: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
    marginBottom: 4,
  },
  modalSubTextTerminos: {
    fontSize: 13,
    color: "#ff3535",
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
    paddingLeft: 4,
  },
  modalSubTextTerminos_: {
    fontSize: 13,
    color: "#ff3535",
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
    paddingLeft: 4,
  },
  modalAcceptButtonTerminos: {
    backgroundColor: "#ff3535",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  modalAcceptButtonTextTerminos: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // ═══════════ ESTILOS DE FOTOS ═══════════
  photoSection: {
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  photoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  photoSectionTitle: {
    color: "#0c0b0b",
    fontSize: 14,
    fontWeight: "700",
  },
  avatarPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatarPicker: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,107,53,0.1)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,107,53,0.3)",
  },
  avatarPreview: { width: "100%", height: "100%", borderRadius: 36 },
  photoLabel: { color: "#666262", fontSize: 14, fontWeight: "600" },
  photoHint: { color: "rgba(19, 17, 17, 0.5)", fontSize: 12, marginTop: 2 },
  removePhotoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  portadaPicker: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,107,53,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
    position: "relative",
  },
  portadaPreview: { width: "100%", height: "100%" },
  portadaPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  portadaOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  portadaOverlayText: {
    color: "#050505",
    fontSize: 12,
    fontWeight: "600",
  },
  removePortadaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  removePortadaText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },
});
