import React, { JSX, useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ImageBackground,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { height } = Dimensions.get('window');
const backgroundImage = require('../../../assets/images/photo-1519501025264-65ba15a82390.jpg');

type Props = StackScreenProps<RootStackParamList, 'Register'>;

type FieldKey =
  | 'nombre'
  | 'apellidoP'
  | 'apellidoM'
  | 'email'
  | 'telefono'
  | 'codigoInvitacion'
  | 'password'
  | 'confirmPassword';

type FormState = Record<FieldKey, string>;
type ErrorState = Partial<Record<FieldKey, string>>;
type TouchedState = Partial<Record<FieldKey, boolean>>;

const NAME_ALLOWED = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g;
const NAME_VALID = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,50}$/;
const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const PHONE_VALID = /^[1-9][0-9]{9}$/;
// Mismo formato que genera RegisterAgrupacion: "A340-34DFGSA"
const CODE_VALID = /^[A-Z0-9]{4}-[A-Z0-9]{7}$/;

const LIMITS = {
  name: 50,
  email: 100,
  phone: 10,
  password: 64,
};

const passwordRules = (pwd: string) => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  special: /[^A-Za-z0-9]/.test(pwd),
});

const passwordScore = (pwd: string): number =>
  Object.values(passwordRules(pwd)).filter(Boolean).length;

export default function RegisterScreen({ navigation, route }: Props): JSX.Element {
  const rol = route.params?.rol;

  const [form, setForm] = useState<FormState>({
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    email: '',
    telefono: '',
    codigoInvitacion: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [touched, setTouched] = useState<TouchedState>({});

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const onPressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const sanitize = (key: FieldKey, text: string): string => {
    switch (key) {
      case 'nombre':
      case 'apellidoP':
      case 'apellidoM':
        return text.replace(NAME_ALLOWED, '').replace(/\s{2,}/g, ' ').slice(0, LIMITS.name);
      case 'telefono':
        return text.replace(/[^0-9]/g, '').slice(0, LIMITS.phone);
      case 'email':
        return text.replace(/\s/g, '').slice(0, LIMITS.email);
      case 'codigoInvitacion':
        // Mayúsculas y sin espacios, como el código generado
        return text.replace(/\s/g, '').toUpperCase().slice(0, 12);
      case 'password':
      case 'confirmPassword':
        return text.slice(0, LIMITS.password);
      default:
        return text;
    }
  };

  const validateField = (key: FieldKey, data: FormState = form): string | undefined => {
    const value = data[key].trim();

    switch (key) {
      case 'nombre':
      case 'apellidoP':
      case 'apellidoM': {
        const label =
          key === 'nombre' ? 'El nombre' : key === 'apellidoP' ? 'El apellido paterno' : 'El apellido materno';
        if (!value) return `${label} es obligatorio`;
        if (value.length < 2) return `${label} debe tener al menos 2 caracteres`;
        if (!NAME_VALID.test(value)) return `${label} solo admite letras`;
        return undefined;
      }

      case 'email': {
        if (!value) return 'El correo electrónico es obligatorio';
        if (!EMAIL_VALID.test(value)) return 'Ingresa un correo electrónico válido';
        if (value.length > LIMITS.email) return 'El correo es demasiado largo';
        return undefined;
      }

      case 'telefono': {
        if (!value) return 'El teléfono es obligatorio';
        if (!/^[0-9]+$/.test(value)) return 'El teléfono solo admite dígitos';
        if (value.length !== 10) return 'El teléfono debe tener exactamente 10 dígitos';
        if (!PHONE_VALID.test(value)) return 'El teléfono no puede iniciar con 0';
        return undefined;
      }

      case 'codigoInvitacion': {
        if (!value) return 'El código de invitación es obligatorio';
        if (!CODE_VALID.test(value)) return 'Formato inválido (ej. A340-34DFGSA)';
        return undefined;
      }

      case 'password': {
        const pwd = data.password;
        if (!pwd) return 'La contraseña es obligatoria';

        const rules = passwordRules(pwd);
        if (!rules.length) return 'Debe tener al menos 8 caracteres';
        if (!rules.upper) return 'Debe incluir al menos una mayúscula';
        if (!rules.lower) return 'Debe incluir al menos una minúscula';
        if (!rules.number) return 'Debe incluir al menos un número';
        if (!rules.special) return 'Debe incluir al menos un carácter especial';

        const lower = pwd.toLowerCase();
        const nombreLower = data.nombre.trim().toLowerCase();
        const emailLocal = data.email.split('@')[0].trim().toLowerCase();

        if (nombreLower.length >= 3 && lower.includes(nombreLower)) {
          return 'La contraseña no debe contener tu nombre';
        }
        if (emailLocal.length >= 3 && lower.includes(emailLocal)) {
          return 'La contraseña no debe contener tu correo';
        }
        return undefined;
      }

      case 'confirmPassword': {
        if (!data.confirmPassword) return 'Confirma tu contraseña';
        if (data.confirmPassword !== data.password) return 'Las contraseñas no coinciden';
        return undefined;
      }

      default:
        return undefined;
    }
  };

  const validateAll = (data: FormState): ErrorState => {
    const keys: FieldKey[] = [
      'nombre',
      'apellidoP',
      'apellidoM',
      'email',
      'telefono',
      'codigoInvitacion',
      'password',
      'confirmPassword',
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
    if (key === 'password' && touched.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', next) }));
    }
  };

  const handleBlur = (key: FieldKey): void => {
    setFocusedField(null);

    let next = { ...form };
    if (key === 'email') next.email = form.email.trim().toLowerCase();
    if (key === 'nombre' || key === 'apellidoP' || key === 'apellidoM') {
      next[key] = form[key].trim();
    }
    setForm(next);

    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, next) }));
  };

  const handleRegister = (): void => {
    const nextErrors = validateAll(form);
    setErrors(nextErrors);
    setTouched({
      nombre: true,
      apellidoP: true,
      apellidoM: true,
      email: true,
      telefono: true,
      codigoInvitacion: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    // Simulación de registro - Aquí iría la llamada real al backend
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('RegisterSuccess', { nombre: form.nombre.trim() });
    }, 1500);
  };

  const renderInput = (
    key: FieldKey,
    icon: string,
    placeholder: string,
    options?: {
      secure?: boolean;
      toggleSecure?: () => void;
      isSecureVisible?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      maxLength?: number;
      autoCapitalize?: 'none' | 'words' | 'characters';
    }
  ) => {
    const isFocused = focusedField === key;
    const error = touched[key] ? errors[key] : undefined;

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
            color={error ? '#FF4D4D' : isFocused ? '#FF6B35' : 'rgba(255,255,255,0.5)'}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, options?.secure && styles.passwordInput]}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={form[key]}
            onChangeText={(t) => handleChange(key, t)}
            onFocus={() => setFocusedField(key)}
            onBlur={() => handleBlur(key)}
            secureTextEntry={options?.secure && !options?.isSecureVisible}
            keyboardType={options?.keyboardType ?? 'default'}
            maxLength={options?.maxLength}
            autoCapitalize={
              options?.autoCapitalize ??
              (options?.keyboardType === 'email-address' ? 'none' : 'words')
            }
            autoCorrect={false}
            autoComplete="off"
          />
          {options?.toggleSecure && (
            <Pressable onPress={options.toggleSecure} style={styles.eyeIcon} hitSlop={10}>
              <Ionicons
                name={options.isSecureVisible ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="rgba(255,255,255,0.5)"
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

  const renderStrength = () => {
    const score = passwordScore(form.password);
    const pct = form.password ? (score / 5) * 100 : 0;
    const label = !form.password ? '' : score <= 2 ? 'Débil' : score <= 4 ? 'Media' : 'Fuerte';
    const color = score <= 2 ? '#FF4D4D' : score <= 4 ? '#FFB020' : '#2ECC71';

    return (
      <View style={styles.strengthBlock}>
        <View style={styles.strengthTrack}>
          <View style={[styles.strengthFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  const isFormReady = Object.keys(validateAll(form)).length === 0;

  const rolInfo =
    rol === 'administrador'
      ? { label: 'Administrador', icon: 'shield-checkmark', color: '#2196F3' }
      : rol === 'asociado'
      ? { label: 'Asociado', icon: 'bicycle', color: '#FF6B35' }
      : null;

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <StatusBar style="light" />
      <View style={styles.scrim} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[styles.container, { opacity: fade, transform: [{ translateY: slide }] }]}
            >
              <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={26} color="#fff" />
              </Pressable>

              <View style={styles.header}>
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>Completa tus datos para registrarte</Text>

                {rolInfo && (
                  <View style={[styles.roleChip, { borderColor: rolInfo.color + '55', backgroundColor: rolInfo.color + '1A' }]}>
                    <Ionicons name={rolInfo.icon as any} size={15} color={rolInfo.color} />
                    <Text style={[styles.roleChipText, { color: rolInfo.color }]}>
                      Registrándote como {rolInfo.label}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.formContainer}>
                {renderInput('nombre', 'person-outline', 'Nombre(s)')}
                {renderInput('apellidoP', 'person-outline', 'Apellido paterno')}
                {renderInput('apellidoM', 'person-outline', 'Apellido materno')}
                {renderInput('email', 'mail-outline', 'Correo electrónico', {
                  keyboardType: 'email-address',
                  maxLength: LIMITS.email,
                })}
                {renderInput('telefono', 'call-outline', 'Teléfono (10 dígitos)', {
                  keyboardType: 'phone-pad',
                  maxLength: LIMITS.phone,
                })}
                {renderInput('codigoInvitacion', 'ticket-outline', 'Código de invitación', {
                  maxLength: 12,
                  autoCapitalize: 'characters',
                })}
                {renderInput('password', 'lock-closed-outline', 'Contraseña', {
                  secure: true,
                  toggleSecure: () => setShowPassword(!showPassword),
                  isSecureVisible: showPassword,
                  maxLength: LIMITS.password,
                })}
                {renderStrength()}
                {renderInput('confirmPassword', 'lock-closed-outline', 'Confirmar contraseña', {
                  secure: true,
                  toggleSecure: () => setShowConfirm(!showConfirm),
                  isSecureVisible: showConfirm,
                  maxLength: LIMITS.password,
                })}

                <Animated.View
                  style={{ transform: [{ scale: buttonScale }], width: '100%', marginTop: 8 }}
                >
                  <Pressable
                    style={[
                      styles.registerButton,
                      (loading || !isFormReady) && styles.disabledButton,
                    ]}
                    onPress={handleRegister}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text
                          style={[styles.registerButtonText, { marginLeft: 10, marginRight: 0 }]}
                        >
                          REGISTRANDO...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.registerButtonText}>REGISTRARME</Text>
                        <Ionicons name="arrow-forward" size={22} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                  <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
                    <Text style={styles.loginLink}>Inicia sesión</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.version}>v1.0.0</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 20, 0.55)' },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
    paddingHorizontal: 28,
    paddingVertical: Platform.OS === 'ios' ? 50 : 36,
    alignItems: 'center',
  },
  container: { flex: 1, width: '100%', maxWidth: 500, paddingBottom: 40 },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginTop: 20 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    fontWeight: '400',
    textAlign: 'center',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  formContainer: { width: '100%', marginTop: 28 },

  fieldBlock: { width: '100%', marginBottom: 26, position: 'relative' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  inputFocused: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.08)' },
  inputError: { borderColor: '#FF4D4D', backgroundColor: 'rgba(255,77,77,0.08)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15.5, color: '#fff' },
  passwordInput: { paddingRight: 40 },
  eyeIcon: { position: 'absolute', right: 16 },

  errorRow: {
    position: 'absolute',
    top: '100%',
    left: 4,
    right: 0,
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { color: '#FF4D4D', fontSize: 12, marginLeft: 5, flex: 1 },

  strengthBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
    marginTop: -14,
    marginBottom: 8,
    paddingLeft: 4,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', marginLeft: 10, width: 50 },

  registerButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  disabledButton: { opacity: 0.55 },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 10,
    letterSpacing: 2,
  },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  loginText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  loginLink: { color: '#FF6B35', fontSize: 14, fontWeight: '700' },
  version: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 24,
    letterSpacing: 1,
    width: '100%',
  },
});