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
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authService } from '../../services/auth/AuthService'; // Ajusta la ruta según tu estructura

const { height } = Dimensions.get('window');
const backgroundImage = require('../../../assets/images/photo-1519501025264-65ba15a82390.jpg');

type Props = StackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Saber qué campo está enfocado para resaltarlo
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animación de entrada (igual que el Welcome)
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

/*
const handleLogin = async (): Promise<void> => {
  if (!email.trim() || !password.trim()) {
    Alert.alert('Error', 'Por favor completa todos los campos');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;

  if (!emailRegex.test(email) && !phoneRegex.test(email)) {
    Alert.alert('Error', 'Ingresa un correo válido o número de teléfono (10 dígitos)');
    return;
  }

  setLoading(true);

  try {
    // Llamada al servicio de autenticación
    const response = await authService.login({
      email: email.trim(),
      password: password.trim()
    });

    if (response.res === true) {
      Alert.alert('Éxito', response.msg || '¡Bienvenido!');
      navigation.navigate('Home', {
        userId: response.user.id.toString(),
        userName: response.user.nombre,
      });
    } else {
      Alert.alert('Error', response.msg || 'Credenciales incorrectas');
    }
  } catch (error: any) {
    console.error('Error en login:', error);
    
    // Manejo de errores específicos
    if (error.response?.status === 401) {
      Alert.alert('Error', 'Credenciales incorrectas');
    } else if (error.response?.status === 500) {
      Alert.alert('Error', 'Error en el servidor. Intenta más tarde');
    } else if (error.code === 'ECONNABORTED') {
      Alert.alert('Error', 'Tiempo de espera agotado. Verifica tu conexión');
    } else {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  } finally {
    setLoading(false);
  }
};

*/
  
  const handleLogin = (): void => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!emailRegex.test(email) && !phoneRegex.test(email)) {
      Alert.alert('Error', 'Ingresa un correo válido o número de teléfono (10 dígitos)');
      return;
    }

    setLoading(true);

    // Simulación de login - Aquí iría tu lógica de autenticación
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Éxito', '¡Bienvenido!');
      navigation.navigate('Home', {
        userId: '12345',
        userName: 'Usuario Ejemplo',
      });
    }, 1500);
  };
  

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <StatusBar style="light" />

      {/* Misma capa oscura del Welcome, para que ambas pantallas se vean de la misma familia */}
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
              style={[
                styles.container,
                { opacity: fade, transform: [{ translateY: slide }] },
              ]}
            >
              {/* Botón Volver */}
              <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={26} color="#fff" />
              </Pressable>

              {/* Encabezado */}
              <View style={styles.header}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require('../../../assets/images/123.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Delivery Security</Text>
                <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
              </View>

              {/* Formulario */}
              <View style={styles.formContainer}>
                {/* Campo Email/Teléfono */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={focusedField === 'email' ? '#FF6B35' : 'rgba(255,255,255,0.5)'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Correo o número de teléfono"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Campo Password */}
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'password' && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={focusedField === 'password' ? '#FF6B35' : 'rgba(255,255,255,0.5)'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Contraseña"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="rgba(255,255,255,0.5)"
                    />
                  </Pressable>
                </View>

                {/* Olvidé mi contraseña */}
                <Pressable
                  style={styles.forgotPasswordContainer}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  hitSlop={8}
                >
                  <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                {/* Botón Iniciar Sesión */}
                <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
                  <Pressable
                    style={[styles.loginButton, loading && styles.disabledButton]}
                    onPress={handleLogin}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={[styles.loginButtonText, { marginLeft: 10, marginRight: 0 }]}>
                          CARGANDO...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
                        <Ionicons name="arrow-forward" size={22} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                {/* Registro */}
                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                  <Pressable
                    onPress={() => navigation.navigate('Register')}
                    hitSlop={8}
                  >
                    <Text style={styles.registerLink}>Regístrate</Text>
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
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Misma capa oscura que el Welcome
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 20, 0.55)',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
    paddingHorizontal: 28,
    paddingVertical: Platform.OS === 'ios' ? 50 : 36,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    justifyContent: 'space-between',
    paddingBottom: 50,
  },
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
  header: {
    alignItems: 'center',
    marginTop: 6,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
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
  },
  logoImage: {
    width: '88%',
    height: '88%',
    borderRadius: 58,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    marginTop: 18,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    fontWeight: '400',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginVertical: 20,
  },
  // Campos "glass": translúcidos oscuros, igual que las tarjetas del Welcome
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  // Cuando el campo está enfocado, se resalta con el naranja de marca
  inputFocused: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15.5,
    color: '#fff',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 22,
    marginTop: 2,
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 13.5,
    fontWeight: '600',
  },
  loginButton: {
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
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 10,
    letterSpacing: 2,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  registerLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '700',
  },
  version: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 10,
    letterSpacing: 1,
    width: '100%',
  },
});