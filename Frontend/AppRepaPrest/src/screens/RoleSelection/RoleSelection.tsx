import React, { JSX, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { height } = Dimensions.get('window');

const IMAGE_HEIGHT = height * 0.28;

// TODO: cuando tengas la imagen, descomenta esta línea y pon la ruta correcta:
const topImage = require('../../../assets/images/12345.jpg');

type Props = StackScreenProps<RootStackParamList, 'RoleSelection'>;

type Rol = 'asociado' | 'administrador';

export default function RoleSelectionScreen({ navigation }: Props): JSX.Element {
  const [seleccion, setSeleccion] = useState<Rol | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  // Latido sutil de la tarjeta "Asociado", igual que el botón EMPEZAR del Welcome
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fade, slide, pulse]);

  const elegirRol = (rol: Rol) => {
  setSeleccion(rol);
  setTimeout(() => {
    if (rol === 'administrador') {
      navigation.navigate('RegisterAgrupacion');
    } else {
      navigation.navigate('Register', { rol });
    }
  }, 250);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Animated.View
        style={[styles.content, { opacity: fade, transform: [{ translateY: slide }] }]}
      >
        {/* Imagen superior */}
        {/* TODO: cuando tengas la imagen, reemplaza este View por:
          <Image source={topImage} style={styles.topImage} resizeMode="cover" />
        */}
        <Image source={topImage} style={styles.topImage} resizeMode="cover" />
<View style={styles.imageOverlay} />
        <View style={styles.imageOverlay} />

        {/* Texto principal */}
        <View style={styles.textBlock}>
  <Text style={styles.titleAccent}>¿Cómo deseas registrarte?</Text>
  <Text style={styles.subtitle}>Elige tu rol para continuar:</Text>
</View>

        {/* Dos tarjetas de selección */}
        <View style={styles.cardsRow}>
          {/* Asociado — con latido */}
          <Animated.View style={{ flex: 1, transform: [{ scale: pulse }] }}>
            <Pressable
              style={[
                styles.card,
                seleccion === 'asociado' && styles.cardSelected,
              ]}
              onPress={() => elegirRol('asociado')}
            >
              <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(255,107,53,0.15)' }]}>
              <Ionicons name="bicycle" size={34} color="#f84807" />
            </View>
            <Text style={styles.cardTitle}>Soy Delivery</Text>
            <Text style={styles.cardDesc}>Repartidor / Chofer</Text>
            <Text style={styles.cardDetail}>Registrate y comienza tu aventura</Text>
            </Pressable>
          </Animated.View>
          <Animated.View style={{ flex: 1, transform: [{ scale: pulse }] }}>

          {/* Administrador */}
          <Pressable
            style={[
              styles.card,
              { flex: 1 },
              seleccion === 'administrador' && styles.cardSelected,
            ]}
            onPress={() => elegirRol('administrador')}
          >
         <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(33,150,243,0.15)' }]}>
          <Ionicons name="shield-checkmark" size={34} color="#2196F3" />
        </View>
        <Text style={styles.cardTitle}>Soy Administrador</Text>
        <Text style={styles.cardDesc}>Dueño de agrupación</Text>
        <Text style={styles.cardDetail}>Registra tu agrupación y gestiona</Text>
          </Pressable>
        </Animated.View>

        </View>

        {/* Volver al login */}
        <Pressable
          style={styles.loginContainer}
          onPress={() => navigation.navigate('Login')}
          hitSlop={8}
        >
          <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
          <Text style={styles.loginLink}>Inicia sesión</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F17',
  },
  content: {
    flex: 1,
  },
  topImagePlaceholder: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#1C1C28',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: 'rgba(15,15,23,0.25)',
  },
  textBlock: {
    paddingHorizontal: 28,
    marginTop: 26,
    marginBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  titleAccent: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FF6B35',
    marginTop: 2,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: '#1C1C28',
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  cardIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  cardDesc: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
  },
loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  loginText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '700',
  },

  topImage: {
  width: '100%',
  height: height * 0.4,  // o la altura que necesites
},
cardDetail: {
  fontSize: 10,
  color: 'rgba(255,255,255,0.35)',
  textAlign: 'center',
  marginTop: 6,
  paddingHorizontal: 8,
  lineHeight: 14,
},
subtitle: {
  fontSize: 13,
  color: 'rgba(255,255,255,0.4)',
  marginTop: 4,
  fontWeight: '400',
},
});