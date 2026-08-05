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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

const backgroundImage = require('../../../assets/images/photo-1519501025264-65ba15a82390.jpg');

type Props = StackScreenProps<RootStackParamList, 'RegisterSuccess'>;

// Iconos decorativos que "flotan" alrededor del centro, dando un toque
// festivo sin depender de una imagen real todavía.
const FLOATING_ICONS = [
  { icon: 'bicycle', color: '#FF6B35', top: '14%', left: '12%', size: 22 },
  { icon: 'sparkles', color: '#FFD54A', top: '10%', left: '76%', size: 20 },
  { icon: 'heart', color: '#EF4444', top: '68%', left: '16%', size: 18 },
  { icon: 'star', color: '#4CAF50', top: '72%', left: '78%', size: 20 },
] as const;

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
          {/* IMG: círculo del logo, con animación de "rebote" al entrar */}
          <Animated.View style={[styles.logoCircle, { transform: [{ scale: scaleLogo }] }]}>
            {/* TODO: cuando tengas una ilustración de bienvenida, reemplaza el
                icono por: <Image source={require('...')} style={styles.logoImage} /> */}
            <Ionicons name="checkmark-done" size={50} color="#FF6B35" />
          </Animated.View>

          <Animated.View
            style={{ opacity: fade, transform: [{ translateY: slide }], width: '100%', alignItems: 'center' }}
          >
            <Text style={styles.title}>¡Felicidades{nombre ? `, ${nombre}` : ''}!</Text>
            <Text style={styles.subtitle}>
              Has creado tu cuenta correctamente.{'\n'}Gracias por elegirnos.
            </Text>

            {/* Zona decorativa: iconos flotantes en vez de texto plano,
                para que la pantalla se sienta más viva y menos genérica */}
            <View style={styles.decorBox}>
              {FLOATING_ICONS.map((f, i) => (
                <View
                  key={i}
                  style={[
                    styles.floatingIcon,
                    { top: f.top, left: f.left, backgroundColor: f.color + '22' },
                  ]}
                >
                  <Ionicons name={f.icon as any} size={f.size} color={f.color} />
                </View>
              ))}
              <View style={styles.decorCenter}>
                <Ionicons name="rocket-outline" size={40} color="rgba(255,255,255,0.6)" />
                <Text style={styles.decorText}>Todo listo para empezar</Text>
              </View>
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
  // Caja decorativa con iconos flotantes en vez de texto plano
  decorBox: {
    width: '100%',
    height: 150,
    marginTop: 28,
    marginBottom: 30,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  floatingIcon: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.3,
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