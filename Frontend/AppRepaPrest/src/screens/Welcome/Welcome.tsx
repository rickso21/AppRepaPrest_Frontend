import React, { JSX, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Pressable,
  SafeAreaView,
  Image,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { height } = Dimensions.get('window');

const backgroundImage = require('../../../assets/images/photo-1519501025264-65ba15a82390.jpg');

type Props = StackScreenProps<RootStackParamList, 'Welcome'>;

type Feature = {
  icon: string;
  color: string;
  title: string;
  desc: string;
};

const FEATURES: Feature[] = [
  { icon: 'locate', color: '#1fd125', title: 'Monitoreo GPS', desc: 'Seguimiento en tiempo real' },
  { icon: 'cash-outline', color: '#ef9905', title: 'Préstamos al momento', desc: 'Solicita tu primer préstamo' },
//  { icon: 'trending-up', color: '#008cff', title: 'Market Place', desc: 'Compra y vende con seguridad' },
  { icon: 'people', color: '#ff6932', title: 'Red Social', desc: '       Protección y comunidad' },
];

/**
 * Tarjeta de funcionalidad con su propia animación.
 * - "index" define su retraso en la cascada (aparece después de la anterior).
 * - Reacciona encogiéndose al tocarla.
 */
function FeatureCard({ feature, index }: { feature: Feature; index: number }): JSX.Element {
  const appear = useRef(new Animated.Value(0)).current;   // 0 = oculta, 1 = visible

  useEffect(() => {
    // Cada tarjeta espera (index * 120ms) antes de aparecer -> efecto cascada de entrada
    Animated.timing(appear, {
      toValue: 1,
      duration: 500,
      delay: 250 + index * 120,
      useNativeDriver: true,
    }).start();
  }, [appear, index]);

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            // se desliza un poco desde la derecha mientras aparece
            translateX: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.featureItem}>
        <View style={[styles.iconWrapper, { backgroundColor: feature.color + '26' }]}>
          <Ionicons name={feature.icon as any} size={24} color={feature.color} />
        </View>
        {/* Texto centrado */}
        <View style={styles.featureContent}>
          <Text style={styles.featureText}>{feature.title}</Text>
          <Text style={styles.featureDesc}>{feature.desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function WelcomeScreen({ navigation }: Props): JSX.Element {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current; // latido sutil continuo del botón

  useEffect(() => {
    // El encabezado y el botón entran suave; las tarjetas tienen su propia cascada
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    // Latido MUY sutil e infinito del botón para atraer la mirada sin moverse mucho
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.008,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop(); // detener el latido al salir de la pantalla
  }, [fade, slide, buttonPulse]);

  const onPressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <StatusBar style="light" />

      <View style={styles.scrim} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.overlay, { opacity: fade, transform: [{ translateY: slide }] }]}
          >
            {/* Encabezado */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../../assets/images/123.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Delivery</Text>
              <Text style={styles.subtitle}>Herramientas para repartidores</Text>
            </View>

            {/* Funcionalidades: cada una anima en cascada y reacciona al tocar */}
            <View style={styles.featuresWrap}>
              {FEATURES.map((f, i) => (
                <FeatureCard key={f.title} feature={f} index={i} />
              ))}
            </View>

            {/* Botón con latido sutil continuo + reacción al presionar */}
            <Animated.View style={{ transform: [{ scale: Animated.multiply(buttonScale, buttonPulse) }], width: '100%' }}>
              <Pressable
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                <Text style={styles.buttonText}>EMPEZAR</Text>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </Pressable>
            </Animated.View>

            <Text style={styles.version}>Beta v1.0.0</Text>
          </Animated.View>
        </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
    paddingHorizontal: 28,
    paddingVertical: Platform.OS === 'ios' ? 50 : 36,
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    justifyContent: 'space-between',
    paddingBottom: 70, // más espacio abajo para que el botón no quede pegado al borde
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
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
    borderRadius: 68,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
    letterSpacing: 0.5,
    fontWeight: '400',
    textAlign: 'center',
  },
  featuresWrap: {
    width: '100%',
    marginVertical: 24,
    gap: 12,
  },
  // Tarjeta horizontal; icono + texto van juntos y centrados en la tarjeta
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    width: '100%',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  // Contenedor del texto: centrado, sin estirarse a todo lo ancho
  featureContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  featureDesc: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 20,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 9,
    elevation: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 10,
    letterSpacing: 2,
  },
  version: {
    color: 'rgba(255, 255, 255, 0.41)',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 20,
    letterSpacing: 1,
    width: '100%',
  },
});