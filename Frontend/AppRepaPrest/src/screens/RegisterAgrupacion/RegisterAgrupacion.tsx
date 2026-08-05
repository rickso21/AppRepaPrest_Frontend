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

type Props = StackScreenProps<RootStackParamList, 'RegisterAgrupacion'>;

type FieldKey =
  | 'responsable'
  | 'agrupacion'
  | 'ciudad'
  | 'telefono'
  | 'email'
  | 'password'
  | 'confirmPassword';

type FormState = Record<FieldKey, string>;
type ErrorState = Partial<Record<FieldKey, string>>;

const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const PHONE_VALID = /^[1-9][0-9]{9}$/;

function generarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  const parte = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${parte(4)}-${parte(7)}`;
}

export default function RegisterAgrupacionScreen({ navigation }: Props): JSX.Element {
  const [form, setForm] = useState<FormState>({
    responsable: '',
    agrupacion: '',
    ciudad: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<ErrorState>({});
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

  const handleChange = (key: FieldKey, text: string) => {
    let clean = text;
    if (key === 'telefono') clean = text.replace(/[^0-9]/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, [key]: clean }));
  };

  const validate = (): boolean => {
    const next: ErrorState = {};

    if (!form.responsable.trim()) next.responsable = 'Ingresa el nombre del responsable';
    if (!form.agrupacion.trim()) next.agrupacion = 'Ingresa el nombre de la agrupación';
    if (!form.ciudad.trim()) next.ciudad = 'Ingresa la ciudad o ubicación';
    if (!PHONE_VALID.test(form.telefono)) next.telefono = 'Teléfono inválido (10 dígitos)';
    if (!EMAIL_VALID.test(form.email.trim())) next.email = 'Correo electrónico inválido';
    if (form.password.length < 8) next.password = 'Mínimo 8 caracteres';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Las contraseñas no coinciden';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegistrar = (): void => {
    if (!validate()) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const codigo = generarCodigo();
      navigation.navigate('RegisterAgrupacionSuccess', {
        agrupacion: form.agrupacion.trim(),
        codigo,
      });
    }, 1400);
  };

  const renderInput = (
    key: FieldKey,
    icon: string,
    placeholder: string,
    options?: {
      secure?: boolean;
      isSecureVisible?: boolean;
      onToggleSecure?: () => void;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
    }
  ) => {
    const isFocused = focusedField === key;
    const error = errors[key];

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
            onBlur={() => setFocusedField(null)}
            secureTextEntry={options?.secure && !options?.isSecureVisible}
            keyboardType={options?.keyboardType ?? 'default'}
            autoCapitalize={options?.keyboardType === 'email-address' ? 'none' : 'sentences'}
            autoCorrect={false}
          />
          {options?.secure && (
            <Pressable onPress={options.onToggleSecure} style={styles.eyeIcon} hitSlop={10}>
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
                <View style={styles.logoCircle}>
                  <Ionicons name="people" size={46} color="#FF6B35" />
                </View>
                <Text style={styles.title}>Registre su agrupación</Text>
                <Text style={styles.subtitle}>Completa los datos para continuar</Text>
              </View>

              <View style={styles.formContainer}>
                {renderInput('responsable', 'person-outline', 'Nombre del responsable')}
                {renderInput('agrupacion', 'business-outline', 'Nombre de la agrupación')}
                {renderInput('ciudad', 'location-outline', 'Ciudad / Ubicación')}
                {renderInput('telefono', 'call-outline', 'Teléfono de contacto', { keyboardType: 'phone-pad' })}
                {renderInput('email', 'mail-outline', 'Correo electrónico', { keyboardType: 'email-address' })}
                {renderInput('password', 'lock-closed-outline', 'Contraseña', {
                  secure: true,
                  isSecureVisible: showPassword,
                  onToggleSecure: () => setShowPassword(!showPassword),
                })}
                {renderInput('confirmPassword', 'lock-closed-outline', 'Confirmar contraseña', {
                  secure: true,
                  isSecureVisible: showConfirm,
                  onToggleSecure: () => setShowConfirm(!showConfirm),
                })}

                <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%', marginTop: 8 }}>
                  <Pressable
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRegistrar}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={[styles.buttonText, { marginLeft: 10, marginRight: 0 }]}>
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
  header: { alignItems: 'center', marginTop: 6 },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    fontWeight: '400',
    textAlign: 'center',
  },
  formContainer: { width: '100%', marginTop: 26 },
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
  button: {
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
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700', marginRight: 10, letterSpacing: 2 },
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