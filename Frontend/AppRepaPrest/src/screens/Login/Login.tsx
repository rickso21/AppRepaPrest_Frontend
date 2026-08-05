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
import { authService } from '../../services/auth.service'; 

const { height } = Dimensions.get('window');
const backgroundImage = require('../../../assets/images/photo-1519501025264-65ba15a82390.jpg');

type Props = StackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animaciones
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Verificar si ya está autenticado
    const checkAuth = async () => {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const user = await authService.getUserData();
        if (user) {
          navigation.replace('Home', {
            userId: user.id,
            userName: user.nombre,
            userEmail: user.email,
            userPhone: user.telefono || ''
          });
        }
      }
    };
    checkAuth();

    // Animaciones de entrada
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  //Con Base
  /*const handleLogin = async (): Promise<void> => {
    // Validar campos vacíos
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validar formato (email o teléfono)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!emailRegex.test(email.trim()) && !phoneRegex.test(email.trim())) {
      Alert.alert('Error', 'Ingresa un correo válido o número de teléfono (10 dígitos)');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({
        email: email.trim(),
        password: password.trim()
      });

      // Verificar respuesta exitosa
      if (response.res === true && response.user) {
        console.log('Login exitoso:', response.user);

        // Navegar al Home con los datos del usuario
        navigation.replace('Home', {
          userId: response.user.id,
          userName: response.user.nombre,
          userEmail: response.user.email,
          userPhone: response.user.telefono || ''
        });
      } else {
        // Si response.res es false
        Alert.alert('Error', response.msg || 'Credenciales incorrectas');
      }

    } catch (error: any) {
      console.error('Error en login:', error);

      // El interceptor de axios ya maneja el 401 automáticamente
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            Alert.alert('Error', data.msg || 'Solicitud incorrecta');
            break;
          case 401:
            Alert.alert('Error', data.msg || 'Contraseña o Usuario incorrecto');
            break;
          case 404:
            Alert.alert('Error', data.msg || 'Usuario no encontrado');
            break;
          case 422:
            // Errores de validación de Laravel
            if (data.errors) {
              const messages = Object.values(data.errors).flat().join('\n');
              Alert.alert('Error de validación', messages);
            } else {
              Alert.alert('Error', data.msg || 'Datos inválidos');
            }
            break;
          case 429:
            Alert.alert('Error', 'Demasiados intentos. Espera un momento.');
            break;
          case 500:
            Alert.alert('Error', 'Error interno del servidor. Intenta más tarde.');
            break;
          default:
            Alert.alert('Error', data.msg || 'Error en el servidor');
        }
      } else if (error.request) {
        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con el servidor.\nVerifica tu conexión a internet.'
        );
      } else {
        Alert.alert('Error', error.message || 'Ocurrió un error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };
  */
  //Con Base
  
  //Sin Base
  const handleLogin = async (): Promise<void> => {
      // Validar campos vacíos
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }
    
      // Validar formato (email o teléfono)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10}$/;
    
      if (!emailRegex.test(email.trim()) && !phoneRegex.test(email.trim())) {
        Alert.alert('Error', 'Ingresa un correo válido o número de teléfono (10 dígitos)');
        return;
      }
    
      setLoading(true);
    
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1500));
    
      try {
        // Datos de usuario simulados
        const mockUser = {
          id: 1,
          nombre: 'Usuario Prueba',
          email: email.trim(),
          telefono: emailRegex.test(email.trim()) ? '1234567890' : email.trim(),
          // Puedes agregar más campos simulados si los necesitas
        };
    
        // Simular validación de credenciales
        // Ejemplo: email: test@test.com, password: 123456
        const isValidCredentials = 
          (email.trim() === 'test@test.com' && password.trim() === '123456') ||
          (email.trim() === '1234567890' && password.trim() === '123456');
    
        if (isValidCredentials) {
          console.log('Login exitoso (simulado):', mockUser);
    
          // Guardar usuario en AsyncStorage o contexto si lo necesitas
          // await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    
          // Navegar al Home con los datos del usuario
          navigation.replace('Home', {
            userId: mockUser.id,
            userName: mockUser.nombre,
            userEmail: mockUser.email,
            userPhone: mockUser.telefono
          });
        } else {
          // Simular credenciales incorrectas
          Alert.alert('Error', 'Credenciales incorrectas. Usa test@test.com / 123456');
        }
    
      } catch (error: any) {
        console.error('Error en login simulado:', error);
        Alert.alert('Error', 'Ocurrió un error inesperado');
      } finally {
        setLoading(false);
      }
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
                    editable={!loading}
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
                    editable={!loading}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={10}
                    disabled={loading}
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
                  disabled={loading}
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
                          INICIANDO SESIÓN...
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
                    onPress={() => navigation.navigate('RoleSelection')}
                    hitSlop={8}
                    disabled={loading}
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