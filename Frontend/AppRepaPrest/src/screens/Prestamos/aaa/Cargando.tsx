// app/screens/Cargando/Cargando.tsx
import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'Cargando'>;

export default function CargandoScreen({ route, navigation }: Props) {
  const { userId, nombre, apellidoPaterno, apellidoMaterno } = route.params || {};
  const nombreCompleto = `${nombre || ''} ${apellidoPaterno || ''}`.trim();

  // Animaciones
  const rotateAnim = useRef(new Animated.Value(0)).current; // Para el círculo de progreso
  const fadeCheck1 = useRef(new Animated.Value(0)).current; // Para la primera validación
  const fadeCheck2 = useRef(new Animated.Value(0)).current; // Para la segunda validación
  const fadeCheck3 = useRef(new Animated.Value(0)).current; // Para la tercera validación

  useEffect(() => {
    // 1. Animación de rotación continua del círculo
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Animación escalonada de los checks (se iluminan uno tras otro)
    Animated.sequence([
      // Check 1 aparece a los 0.5s
      Animated.timing(fadeCheck1, { toValue: 1, duration: 500, useNativeDriver: true }),
      // Check 2 aparece a los 4s
      Animated.delay(3500),
      Animated.timing(fadeCheck2, { toValue: 1, duration: 500, useNativeDriver: true }),
      // Check 3 aparece a los 7.5s
      Animated.delay(3000),
      Animated.timing(fadeCheck3, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // 3. Temporizador de 15 segundos para ir al siguiente paso
    const timer = setTimeout(() => {
      navigation.replace('MontoAprobado', {
        userId,
        nombre: nombreCompleto,
        montoAprobado: 200
      });
    }, 12000); // Bajamos a 12s para que cuadre con las animaciones

    return () => clearTimeout(timer);
  }, [navigation]);

  // Interpolar la rotación
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0A0A12', '#141428']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          
          <View style={styles.mainVisualContainer}>
            {/* Círculo de progreso animado */}
            <View style={styles.circleContainer}>
              <Animated.View style={[styles.circleSpinner, { transform: [{ rotate: spin }] }]}>
                <LinearGradient
                  colors={['#FF6B35', '#E8552E']}
                  style={styles.circleGradient}
                />
              </Animated.View>
              
              <View style={styles.innerCircleContent}>
                <Ionicons name="shield-checkmark" size={40} color="#FF6B35" />
                <Text style={styles.innerCircleText}>Analizando</Text>
              </View>
            </View>
          </View>

          {/* Texto principal */}
          <Text style={styles.loadingText}>
            Estamos analizando tu solicitud
          </Text>
          <Text style={styles.subLoadingText}>
            Por favor espera mientras verificamos tu información y generamos tu oferta.
          </Text>

          {/* Validaciones en progreso */}
          <View style={styles.checksContainer}>
            <Animated.View style={[styles.checkRow, { opacity: fadeCheck1 }]}>
              <View style={styles.checkIconActive}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.checkTextActive}>Analizando tus datos </Text>
            </Animated.View>

            <Animated.View style={[styles.checkRow, { opacity: fadeCheck2 }]}>
              <View style={styles.checkIconActive}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.checkTextActive}>Pre-aprobación de monto generada</Text>
            </Animated.View>

            <Animated.View style={[styles.checkRow, { opacity: fadeCheck3 }]}>
              <View style={styles.checkIconActive}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.checkTextActive}>Finalizando solicitud</Text>
            </Animated.View>
          </View>

        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 40,
  },

  // Contenedor del círculo
  mainVisualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  circleContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleSpinner: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
    position: 'absolute',
    top: -4,
    left: -4,
    opacity: 0.3,
  },
  innerCircleContent: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    zIndex: 2,
  },
  innerCircleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    fontWeight: '600',
  },

  // Textos
  loadingText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subLoadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },

  // Lista de checks
  checksContainer: {
    width: '100%',
    gap: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  checkIconActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});