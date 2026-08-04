// components/PrestamosPopup.tsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  ImageBackground,
  Dimensions,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PrestamosPopupProps {
  visible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function PrestamosPopup({ 
  visible, 
  onClose, 
  autoClose = true,
  duration = 6000
}: PrestamosPopupProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  const backgroundImage = require('../../../assets/images/image.png');


  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { 
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim 
            }
          ]}
        >
          <ImageBackground
            source={backgroundImage}
            style={styles.imageBackground}
            imageStyle={styles.imageStyle}
          >
            {/* 🔥 Gradiente OSCURO para la imagen de fondo */}
            <LinearGradient
              colors={[
                'rgba(0,0,0,0.85)', 
                'rgba(0,0,0,0.6)', 
                'rgba(0,0,0,0.85)'
              ]}
              style={styles.gradientOverlay}
            />
            
            {/* 🔥 Botón de cierre */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <View style={styles.closeButtonCircle}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
           

              {/* 🔥 Icono decorativo BLANCO */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="heart" size={32} color="#FF6B35" />
                </View>
              </View>

              {/* 🔥 Títulos BLANCOS */}
              <Text style={styles.mainTitle}>
                ¡Gracias por elegirnos!
              </Text>
              
              <Text style={styles.subTitle}>
                Sabemos lo duro que es rodar todos los días para sacar adelante a tu familia.
              </Text>

              <View style={styles.divider} />

              {/* 🔥 Beneficios con fondo BLANCO y texto oscuro */}
              <View style={styles.benefitsContainer}>
                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Tu seguridad es primero</Text>
                    <Text style={styles.benefitDescription}>
                      Funciones diseñadas para cuidarte mientras trabajas en la calle
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                    <Ionicons name="cash" size={20} color="#FF9800" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Apoyo cuando más lo necesitas</Text>
                    <Text style={styles.benefitDescription}>
                      Préstamos en efectivo rápidos y sin trámites complicados
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                    <Ionicons name="people" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Hecha por y para repartidores</Text>
                    <Text style={styles.benefitDescription}>
                      Te escuchamos y entendemos tus necesidades diarias
                    </Text>
                  </View>
                </View>
              </View>

              {/* 🔥 Mensaje de cierre BLANCO */}
              <View style={styles.closingMessage}>
                <Text style={styles.closingText}>
                  Creemos y confiamos en ti
                </Text>
                <Text style={styles.closingHighlight}>
                  ¡Haz que tus finanzas fluyan mejor! 🚀
                </Text>
              </View>

            
            </ScrollView>
          </ImageBackground>
        </Animated.View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: width * 0.92,
    maxWidth: 420,
    height: height * 0.85,
    maxHeight: 700,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 30,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    borderRadius: 28,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 28,
    paddingTop: 50,
    paddingBottom: 20,
  },
  welcomeBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subTitle: {
    color: '#D1D5DB',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    width: '30%',
    height: 2,
    backgroundColor: '#FF6B35',
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 2,
  },
  benefitsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  benefitDescription: {
    color: '#B0B0C0',
    fontSize: 12,
    lineHeight: 18,
  },
  closingMessage: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.15)',
  },
  closingText: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  closingHighlight: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  autoCloseIndicator: {
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    width: '40%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  autoCloseText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});