import React, { JSX, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ImageBackground,
  SafeAreaView,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');
const backgroundImage = require('../../../assets/images/photo-1519501025264-65ba15a82390.jpg');

type Props = StackScreenProps<RootStackParamList, 'RegisterSuccess'>;

export default function RegisterSuccessScreen({ navigation, route }: Props): JSX.Element {
  const nombre = route.params?.nombre;

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const scaleLogo = useRef(new Animated.Value(0.6)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleLogo, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fade, slide, scaleLogo]);

  const onPressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <StatusBar style="light" />
      <View style={styles.scrim} />

      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Logo con animación */}
          <Animated.View style={[styles.logoCircle, { transform: [{ scale: scaleLogo }] }]}>
            <Ionicons name="checkmark-done" size={50} color="#ee4b10" />
          </Animated.View>

          <Animated.View
            style={{ opacity: fade, transform: [{ translateY: slide }], width: '100%', alignItems: 'center' }}
          >
            <Text style={styles.title}>¡Felicidades{nombre ? `, ${nombre}` : ''}!</Text>
            
<Text style={styles.gifText}>Bienvenido{"\n"}Delivery Sobre Ruedas</Text>

            

            {/* ========== GIF DE BIENVENIDA ========== */}
            <View style={styles.gifContainer}>
              <Image
                source={require('../../../assets/images/0fef41_d33448c10c1d40608ead1f5af38faf78.gif')}
                style={styles.gifImage}
                resizeMode="contain"
              />
            <Text style={styles.subtitle}>
              Has creado tu cuenta correctamente.{'\n'}Gracias por elegirnos.
            </Text>
            
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <Pressable
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                <Text style={styles.buttonText}>VOLVER AL INICIO</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 20, 0.55)' },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
  // ========== ESTILOS PARA EL GIF ==========
  gifContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  gifImage: {
    width: width * 0.7,
    height: 180,
    borderRadius: 16,
  },
  gifText: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 17,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonText: { color: '#fff', fontSize: 15.5, fontWeight: '800', letterSpacing: 1.6 },
});