// components/PrestamosToast.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PrestamosToastProps {
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export default function PrestamosToast({ visible, onHide, duration = 3000 }: PrestamosToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      showToast();
    }
  }, [visible]);

  const showToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        hideToast();
      }, duration);
    });
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const mensajes = [
    "💸 ¡Préstamos disponibles!",
    "🚀 ¡Solicita en segundos!",
    "✨ ¡Tasas competitivas!",
    "🎯 ¡Haz realidad tus sueños!",
    "⚡ ¡Aprobación inmediata!"
  ];

  const mensajeAleatorio = mensajes[Math.floor(Math.random() * mensajes.length)];

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <View style={styles.content}>
        <Ionicons name="cash" size={24} color="#FF6B35" />
        <Text style={styles.message}>{mensajeAleatorio}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  content: {
    backgroundColor: '#1F1F2A',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});