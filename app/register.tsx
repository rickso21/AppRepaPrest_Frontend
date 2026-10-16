import { useRegisterImages } from "@/hooks/register/useRegisterImages";
import { authService } from "@/services/auth/AuthService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const { height } = Dimensions.get("window");
const backgroundImage = require("../assets/images/photo-1519501025264-65ba15a82390.jpg");

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

type FieldKey =
  | "nombre"
  | "apellidoP"
  | "apellidoM"
  | "email"
  | "telefono"
  | "ciudad"
  | "codigoInvitacion"
  | "password"
  | "confirmPassword";

type FormState = Record<FieldKey, string>;
type ErrorState = Partial<Record<FieldKey, string>>;
type TouchedState = Partial<Record<FieldKey, boolean>>;

const NAME_ALLOWED = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g;
const NAME_VALID = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,50}$/;
const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const PHONE_VALID = /^[1-9][0-9]{9}$/;
const CODE_VALID = /^[A-Z0-9]{8}$/;

const LIMITS = { name: 50, email: 100, phone: 10, password: 64 };

const passwordRules = (pwd: string) => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  special: /[^A-Za-z0-9]/.test(pwd),
});

const passwordScore = (pwd: string): number =>
  Object.values(passwordRules(pwd)).filter(Boolean).length;

export default function RegisterScreen(): JSX.Element {
  const router = useRouter();
  const { rol } = useLocalSearchParams<{ rol?: string }>();

  const {
    avatarUri,
    portadaUri,
    elegirImagen,
    construirFormData,
    resetAvatar,
    resetPortada,
  } = useRegisterImages();

  const [form, setForm] = useState<FormState>({
    nombre: "",
    apellidoP: "",
    apellidoM: "",
    email: "",
    telefono: "",
    ciudad: "",
    codigoInvitacion: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);

  const [aceptoTerminos, setAceptoTerminos] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [modalCiudadVisible, setModalCiudadVisible] = useState<boolean>(false);
  const [searchCiudad, setSearchCiudad] = useState<string>("");
  const [filteredCiudades, setFilteredCiudades] =
    useState<string[]>(ESTADOS_MEXICO);

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
    if (searchCiudad.trim() === "") {
      setFilteredCiudades(ESTADOS_MEXICO);
    } else {
      setFilteredCiudades(
        ESTADOS_MEXICO.filter((e) =>
          e.toLowerCase().includes(searchCiudad.toLowerCase()),
        ),
      );
    }
  }, [searchCiudad]);

  const onPressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const sanitize = (key: FieldKey, text: string): string => {
    switch (key) {
      case "nombre":
      case "apellidoP":
      case "apellidoM":
        return text
          .replace(NAME_ALLOWED, "")
          .replace(/\s{2,}/g, " ")
          .slice(0, LIMITS.name);
      case "telefono":
        return text.replace(/[^0-9]/g, "").slice(0, LIMITS.phone);
      case "ciudad":
        return text.replace(/\s{2,}/g, " ").slice(0, 100);
      case "email":
        return text.replace(/\s/g, "").slice(0, LIMITS.email);
      case "codigoInvitacion":
        return text.replace(/\s/g, "").toUpperCase().slice(0, 8);
      case "password":
      case "confirmPassword":
        return text.slice(0, LIMITS.password);
      default:
        return text;
    }
  };

  const validateField = (
    key: FieldKey,
    data: FormState = form,
  ): string | undefined => {
    const value = data[key].trim();

    switch (key) {
      case "nombre":
      case "apellidoP":
      case "apellidoM": {
        const label =
          key === "nombre"
            ? "El nombre"
            : key === "apellidoP"
              ? "El apellido paterno"
              : "El apellido materno";
        if (!value) return `${label} es obligatorio`;
        if (value.length < 2)
          return `${label} debe tener al menos 2 caracteres`;
        if (!NAME_VALID.test(value)) return `${label} solo admite letras`;
        return undefined;
      }
      case "email": {
        if (!value) return "El correo electrónico es obligatorio";
        if (!EMAIL_VALID.test(value))
          return "Ingresa un correo electrónico válido";
        if (value.length > LIMITS.email) return "El correo es demasiado largo";
        return undefined;
      }
      case "telefono": {
        if (!value) return "El teléfono es obligatorio";
        if (!/^[0-9]+$/.test(value)) return "El teléfono solo admite dígitos";
        if (value.length !== 10)
          return "El teléfono debe tener exactamente 10 dígitos";
        if (!PHONE_VALID.test(value))
          return "El teléfono no puede iniciar con 0";
        return undefined;
      }
      case "ciudad": {
        if (!value) return "Selecciona un estado";
        return undefined;
      }
      case "codigoInvitacion": {
        if (!value) return "El código de invitación es obligatorio";
        if (!CODE_VALID.test(value))
          return "Formato inválido (8 caracteres alfanuméricos)";
        return undefined;
      }
      case "password": {
        const pwd = data.password;
        if (!pwd) return "La contraseña es obligatoria";
        return undefined;
      }
      case "confirmPassword": {
        if (!data.confirmPassword) return "Confirma tu contraseña";
        if (data.confirmPassword !== data.password)
          return "Las contraseñas no coinciden";
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const validateAll = (data: FormState): ErrorState => {
    const keys: FieldKey[] = [
      "nombre",
      "apellidoP",
      "apellidoM",
      "email",
      "telefono",
      "ciudad",
      "codigoInvitacion",
      "password",
      "confirmPassword",
    ];
    const next: ErrorState = {};
    keys.forEach((k) => {
      const err = validateField(k, data);
      if (err) next[k] = err;
    });
    return next;
  };

  const handleChange = (key: FieldKey, text: string): void => {
    const clean = sanitize(key, text);
    const next = { ...form, [key]: clean };
    setForm(next);

    if (touched[key]) {
      setErrors((prev) => ({ ...prev, [key]: validateField(key, next) }));
    }
    if (key === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField("confirmPassword", next),
      }));
    }
  };

  const handleBlur = (key: FieldKey): void => {
    setFocusedField(null);
    let next = { ...form };
    if (key === "email") next.email = form.email.trim().toLowerCase();
    if (key === "nombre" || key === "apellidoP" || key === "apellidoM") {
      next[key] = form[key].trim();
    }
    if (key === "ciudad") next.ciudad = form.ciudad.trim();

    setForm(next);
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, next) }));
  };

  const selectCiudad = (estado: string) => {
    const next = { ...form, ciudad: estado };
    setForm(next);
    setModalCiudadVisible(false);
    setSearchCiudad("");
    setTouched((prev) => ({ ...prev, ciudad: true }));
    setErrors((prev) => ({ ...prev, ciudad: undefined }));
  };

  const handleRegister = async (): Promise<void> => {
    if (!aceptoTerminos) {
      Alert.alert(
        "Términos y condiciones",
        "Debes aceptar los términos y condiciones para continuar con el registro.",
        [{ text: "Entendido" }],
      );
      return;
    }

    const nextErrors = validateAll(form);
    setErrors(nextErrors);
    setTouched({
      nombre: true,
      apellidoP: true,
      apellidoM: true,
      email: true,
      telefono: true,
      ciudad: true,
      codigoInvitacion: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      Alert.alert(
        "Errores en el formulario",
        "Por favor, revisa los campos marcados en rojo.",
        [{ text: "Entendido" }],
      );
      return;
    }

    setLoading(true);

    try {
      const campos = {
        name: form.nombre.trim(),
        apellido_p: form.apellidoP.trim(),
        apellido_m: form.apellidoM.trim(),
        email: form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        ciudad: form.ciudad.trim(),
        password: form.password,
        password_confirmation: form.confirmPassword,
        code: form.codigoInvitacion.trim().toUpperCase(),
      };

      const formData = construirFormData(campos);

      const response = await authService.registerAsociado(
        (formData as any) ?? campos,
      );

      const esExito =
        response.res === true ||
        response.success === true ||
        (response.msg && response.msg.includes("Exito")) ||
        (response.msg && response.msg.includes("éxito"));

      if (esExito) {
        router.replace({
          pathname: "/RegisterSuccess",
          params: { nombre: form.nombre.trim() },
        });
      } else {
        Alert.alert(
          "Error al registrar",
          response.msg || "Ocurrió un error al registrar. Intenta nuevamente.",
        );
      }
    } catch (error: any) {
      const fieldErrors: ErrorState = {};
      const errorsData = error.errors || error.response?.data?.errors;

      if (errorsData) {
        const fieldMapping: Record<string, FieldKey> = {
          name: "nombre",
          apellido_p: "apellidoP",
          apellido_m: "apellidoM",
          email: "email",
          telefono: "telefono",
          code: "codigoInvitacion",
          password: "password",
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
          const touchedState: TouchedState = {};
          Object.keys(fieldErrors).forEach((key) => {
            touchedState[key as FieldKey] = true;
          });
          setTouched((prev) => ({ ...prev, ...touchedState }));
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

      if (error.response?.status === 422) {
        errorTitle = "Error de validación";
        errorMessage =
          error.response.data?.msg ||
          "Por favor, verifica los datos ingresados.";
      } else if (error.response?.status === 409) {
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
      toggleSecure?: () => void;
      isSecureVisible?: boolean;
      keyboardType?: "default" | "email-address" | "phone-pad";
      maxLength?: number;
      autoCapitalize?: "none" | "words" | "characters";
    },
  ) => {
    const isFocused = focusedField === key;
    const error = touched[key] ? errors[key] : undefined;

    if (key === "ciudad") {
      return (
        <View style={styles.fieldBlock} key={key}>
          <Pressable
            style={[
              styles.inputContainer,
              isFocused && styles.inputFocused,
              !!error && styles.inputError,
            ]}
            onPress={() => {
              setFocusedField("ciudad");
              setModalCiudadVisible(true);
            }}
          >
            <Ionicons
              name={icon as any}
              size={20}
              color={error ? "#940000" : isFocused ? "#940000" : "#888"}
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
              color="#888"
              style={styles.pickerIcon}
            />
          </Pressable>
          {!!error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#940000" />
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
            color={error ? "#940000" : isFocused ? "#940000" : "#888"}
            style={styles.inputIcon}
          />
          <TextInput
            key={options?.secure ? `secure-${options?.isSecureVisible}` : key}
            style={[styles.input, options?.secure && styles.passwordInput]}
            placeholder={placeholder}
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={form[key]}
            onChangeText={(t) => handleChange(key, t)}
            onFocus={() => setFocusedField(key)}
            onBlur={() => handleBlur(key)}
            secureTextEntry={options?.secure && !options?.isSecureVisible}
            keyboardType={options?.keyboardType ?? "default"}
            maxLength={options?.maxLength}
            autoCapitalize={
              options?.autoCapitalize ??
              (options?.keyboardType === "email-address" ? "none" : "words")
            }
            autoCorrect={false}
            autoComplete="off"
          />
          {options?.toggleSecure && (
            <Pressable
              onPress={options.toggleSecure}
              style={styles.eyeIcon}
              hitSlop={10}
            >
              <Ionicons
                name={
                  options.isSecureVisible ? "eye-outline" : "eye-off-outline"
                }
                size={20}
                color={isFocused ? "#940000" : "#666"}
              />
            </Pressable>
          )}
        </View>
        {!!error && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={13} color="#940000" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderStrength = () => {
    const score = passwordScore(form.password);
    const pct = form.password ? (score / 5) * 100 : 0;
    const label = !form.password
      ? ""
      : score <= 2
        ? "Débil"
        : score <= 4
          ? "Media"
          : "Fuerte";
    const color = score <= 2 ? "#940000" : score <= 4 ? "#ff2020" : "#2ECC71";

    return (
      <View style={styles.strengthBlock}>
        <View style={styles.strengthTrack}>
          <View
            style={[
              styles.strengthFill,
              { width: `${pct}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderFotos = () => (
    <View style={styles.photoSection}>
      <View style={styles.photoSectionHeader}>
        <Ionicons name="images-outline" size={18} color="#940000" />
        <Text style={styles.photoSectionTitle}>Fotos (opcional)</Text>
      </View>

      <View style={styles.avatarPickerRow}>
        <Pressable
          style={styles.avatarPicker}
          onPress={() => elegirImagen("avatar")}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
          ) : (
            <Ionicons name="camera-outline" size={28} color="#940000" />
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
            <Ionicons name="image-outline" size={32} color="#940000" />
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
            onPress={() => setModalVisible(true)}
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
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Términos y Condiciones</Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalSection}>
              <Ionicons name="shield-checkmark" size={24} color="#940000" />
              <Text style={styles.modalSectionTitle}>
                Seguridad de tus datos
              </Text>
              <Text style={styles.modalText}>
                Toda la información que proporcionas en Delivery Sobre Ruedas
                está encriptada y protegida con los más altos estándares de
                seguridad. Tus datos personales, incluyendo correo electrónico,
                teléfono y contraseña, son almacenados de forma segura y nunca
                serán compartidos con terceros sin tu consentimiento explícito.
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Ionicons name="trash-outline" size={24} color="#940000" />
              <Text style={styles.modalSectionTitle}>
                Eliminación de cuenta
              </Text>
              <Text style={styles.modalText}>
                Cuando solicitas la eliminación de tu cuenta, todos tus datos
                personales son marcados para su eliminación definitiva. Tus
                datos permanecerán almacenados de forma temporal durante un
                período de 1 año, tiempo durante el cual podrás restaurar tu
                cuenta si así lo deseas.
              </Text>
              <Text style={styles.modalSubText}>
                ⚠️ Transcurrido este período, toda tu información será eliminada
                de forma permanente y no podrá ser recuperada.
              </Text>
              <Text style={styles.modalSubText_}>
                ⚠️ Si solicitaste un servicio adicional como un prestamo y este
                se encuentra vigente no podras, eliminar tu cuenta hasta saldar
                tu cuenta con nosotros.
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#940000"
              />
              <Text style={styles.modalSectionTitle}>
                Política de privacidad
              </Text>
              <Text style={styles.modalText}>
                • Tus datos son utilizados exclusivamente para la operación de
                la plataforma Delivery Sobre Ruedas.
              </Text>
              <Text style={styles.modalText}>
                • No compartimos tu información con terceros sin tu
                consentimiento.
              </Text>
              <Text style={styles.modalText}>
                • Puedes acceder, modificar o solicitar la eliminación de tus
                datos en cualquier momento.
              </Text>
              <Text style={styles.modalText}>
                • La seguridad de tu información es nuestra prioridad.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalAcceptButton}
              onPress={() => {
                setAceptoTerminos(true);
                setModalVisible(false);
              }}
            >
              <Text style={styles.modalAcceptButtonText}>
                Acepto los términos
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderCiudadModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={modalCiudadVisible}
      onRequestClose={() => {
        setModalCiudadVisible(false);
        setFocusedField(null);
      }}
    >
      <View style={styles.modalOverlayBottom}>
        <View style={styles.modalContainerBottom}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona un estado</Text>
            <Pressable
              onPress={() => {
                setModalCiudadVisible(false);
                setFocusedField(null);
              }}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar estado..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchCiudad}
              onChangeText={setSearchCiudad}
              autoCapitalize="words"
            />
            {searchCiudad.length > 0 && (
              <Pressable onPress={() => setSearchCiudad("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="rgba(255,255,255,0.4)"
                />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredCiudades}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.estadoItem,
                  form.ciudad === item && styles.estadoItemSelected,
                ]}
                onPress={() => selectCiudad(item)}
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
                  <Ionicons name="checkmark-circle" size={20} color="#940000" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron estados</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  const isFormReady =
    Object.keys(validateAll(form)).length === 0 && aceptoTerminos;

  const rolInfo =
    rol === "administrador"
      ? { label: "Administrador", icon: "shield-checkmark", color: "#2196F3" }
      : rol === "asociado"
        ? { label: "Asociado", icon: "bicycle", color: "#940000" }
        : null;

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
                <Ionicons name="arrow-back" size={26} color="#fff" />
              </Pressable>

              <View style={styles.header}>
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>
                  Completa tus datos para registrarte
                </Text>

                {rolInfo && (
                  <View style={styles.roleChip}>
                    <Ionicons
                      name={rolInfo.icon as any}
                      size={15}
                      color="#940000" // 👈 icono rojo
                    />
                    <Text style={styles.roleChipText}>
                      Registrándote como {rolInfo.label}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.formContainer}>
                {renderInput("nombre", "person-outline", "Nombre(s)")}
                {renderInput("apellidoP", "person-outline", "Apellido paterno")}
                {renderInput("apellidoM", "person-outline", "Apellido materno")}
                {renderInput("email", "mail-outline", "Correo electrónico", {
                  keyboardType: "email-address",
                  maxLength: LIMITS.email,
                })}
                {renderInput(
                  "telefono",
                  "call-outline",
                  "Teléfono (10 dígitos)",
                  { keyboardType: "phone-pad", maxLength: LIMITS.phone },
                )}
                {renderInput(
                  "ciudad",
                  "location-outline",
                  "Selecciona un estado",
                )}

                {renderInput(
                  "codigoInvitacion",
                  "ticket-outline",
                  "Código de invitación (8 caracteres)",
                  { maxLength: 8, autoCapitalize: "characters" },
                )}
                {renderInput("password", "lock-closed-outline", "Contraseña", {
                  secure: true,
                  toggleSecure: () => setShowPassword(!showPassword),
                  isSecureVisible: showPassword,
                  maxLength: LIMITS.password,
                })}
                {renderStrength()}
                {renderInput(
                  "confirmPassword",
                  "lock-closed-outline",
                  "Confirmar contraseña",
                  {
                    secure: true,
                    toggleSecure: () => setShowConfirm(!showConfirm),
                    isSecureVisible: showConfirm,
                    maxLength: LIMITS.password,
                  },
                )}

                {/* ✅ Fotos */}
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
                      styles.registerButton,
                      (loading || !isFormReady) && styles.disabledButton,
                    ]}
                    onPress={handleRegister}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    disabled={loading || !isFormReady}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text
                          style={[
                            styles.registerButtonText,
                            { marginLeft: 10, marginRight: 0 },
                          ]}
                        >
                          REGISTRANDO...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.registerButtonText}>
                          REGISTRARME
                        </Text>
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

      {renderTerminosModal()}
      {renderCiudadModal()}
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
    backgroundColor: "rgba(0,0,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  header: { alignItems: "center", marginTop: 20 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    marginTop: 8,
    fontWeight: "400",
    textAlign: "center",
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#940000", // 👈 borde rojo
    backgroundColor: "#ffffff", // 👈 fondo blanco
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  roleChipText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#940000", // 👈 letras rojas
  },
  // ═══════════ FORMULARIO (tarjeta blanca) ═══════════
  formContainer: {
    width: "100%",
    marginTop: 28,
    backgroundColor: "#ffffffaf", // 👈 TARJETA BLANCA (o "#ffffff" para sólida)
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
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 52,
  },
  inputFocused: {
    borderColor: "#940000",
    backgroundColor: "#fff5f0",
  },
  inputError: {
    borderColor: "#940000",
    backgroundColor: "#fff0f0",
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15.5,
    color: "#1a1a1a",
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
  errorText: { color: "#940000", fontSize: 12, marginLeft: 5, flex: 1 },

  // ═══════════ FORTALEZA DE CONTRASEÑA ═══════════
  strengthBlock: {
    flexDirection: "row",
    alignItems: "center",
    height: 18,
    marginTop: -14,
    marginBottom: 8,
    paddingLeft: 4,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e0e0e0", // 👈 antes rgba(255,255,255,0.15)
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: "700", marginLeft: 10, width: 50 },

  // ═══════════ TÉRMINOS ═══════════
  terminosContainer: { width: "100%", marginTop: 4, marginBottom: 12 },
  checkboxContainer: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#bbb", // 👈 antes rgba(255,255,255,0.4)
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#f5f5f5", // 👈 antes rgba(255,255,255,0.05)
  },
  checkboxChecked: { backgroundColor: "#940000", borderColor: "#940000" },
  terminosText: { fontSize: 13, color: "#555", flex: 1 }, // 👈 antes rgba(255,255,255,0.7)
  terminosLink: {
    color: "#940000",
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  // ═══════════ BOTÓN ═══════════
  registerButton: {
    backgroundColor: "#940000",
    paddingVertical: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#940000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  disabledButton: { opacity: 0.55 },
  registerButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 10,
    letterSpacing: 2,
  },

  // ═══════════ LOGIN LINK ═══════════
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
  loginText: { color: "#666", fontSize: 14 }, // 👈 antes rgba(255,255,255,0.6)
  loginLink: { color: "#940000", fontSize: 14, fontWeight: "700" },

  // ═══════════ VERSIÓN (fuera de la tarjeta) ═══════════
  version: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    fontSize: 11,
    marginTop: 24,
    letterSpacing: 1,
    width: "100%",
  },

  // ═══════════ PICKER (ciudad) ═══════════
  pickerText: {
    flex: 1,
    fontSize: 15.5,
    color: "#1a1a1a", // 👈 antes #fff
    paddingVertical: 15,
  },
  placeholderText: { color: "#999" }, // 👈 antes rgba(255,255,255,0.4)
  pickerIcon: { marginLeft: 8 },

  // ═══════════ MODAL CIUDAD (bottom sheet oscuro) ═══════════
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainerBottom: {
    backgroundColor: "#1C1C28",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
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
  estadoTextSelected: { color: "#940000", fontWeight: "600" },
  emptyContainer: { paddingVertical: 30, alignItems: "center" },
  emptyText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },

  // ═══════════ MODAL TÉRMINOS (centrado, oscuro) ═══════════
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1C1C28",
    borderRadius: 24,
    width: "90%",
    maxHeight: "80%",
    paddingBottom: 20,
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
  modalContent: { paddingHorizontal: 20, paddingTop: 16 },
  modalSection: { marginBottom: 24 },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
    marginBottom: 4,
  },
  modalSubText: {
    fontSize: 13,
    color: "#940000",
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
    paddingLeft: 4,
  },
  modalSubText_: {
    fontSize: 13,
    color: "#940000",
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
    paddingLeft: 4,
  },
  modalAcceptButton: {
    backgroundColor: "#940000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  modalAcceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // ═══════════ FOTOS (dentro de tarjeta blanca) ═══════════
  photoSection: {
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#fafafa", // 👈 antes rgba(255,255,255,0.03)
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee", // 👈 antes rgba(255,255,255,0.06)
  },
  photoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  photoSectionTitle: {
    color: "#1a1a1a", // 👈 antes #fff
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
  photoLabel: { color: "#1a1a1a", fontSize: 14, fontWeight: "600" }, // 👈 antes #fff
  photoHint: { color: "#888", fontSize: 12, marginTop: 2 }, // 👈 antes rgba(255,255,255,0.5)
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
    color: "#fff",
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
