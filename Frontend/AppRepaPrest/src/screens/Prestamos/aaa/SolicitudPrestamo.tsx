// app/screens/SolicitudPrestamo/SolicitudPrestamoScreen.tsx

import React, { JSX, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'SolicitudPrestamo'>;

export default function SolicitudPrestamoScreen({ route, navigation }: Props) {
  // Datos que vienen de la pantalla anterior (opcional si lo necesitas para el siguiente paso)
  const { userId, userName, montoPreaprobado } = route.params || {};
  
  // Estados del formulario (SOLO DATOS PERSONALES)
  const [nombre, setNombreCompleto] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [curp, setCurp] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = () => {
    // 1. Validar que todos los campos estén llenos
    if (
      !nombre.trim() || 
      !apellidoPaterno.trim() || 
      !apellidoMaterno.trim() || 
      !direccion.trim() ||
      !curp.trim()
    ) {
      Alert.alert(
        "Campos incompletos",
        "Por favor, completa todos los campos para continuar."
      );
      return;
    }


    // 4. Validación básica de CURP (Longitud estándar de 18 caracteres)
    if (curp.replace(/\s/g, '').length !== 18) {
      Alert.alert(
        "CURP inválido",
        "El CURP debe tener exactamente 18 caracteres."
      );
      return;
    }

    setIsSubmitting(true);

    // Simular validación de datos en la base de datos
    setTimeout(() => {
      setIsSubmitting(false);
      
      navigation.replace('Cargando', { 
        userId, 
        nombre, 
        apellidoPaterno, 
        apellidoMaterno,
        direccion,
        curp,
        // Es importante pasar también el email y teléfono para que no se pierdan en el proceso
        email: email,
        telefono: telefono
      });
      
    }, 1500);

  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Validación de Datos</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Icono de bienvenida */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#FF6B35', '#E8552E']}
              style={styles.iconGradient}
            >
              <Ionicons name="shield-checkmark-outline" size={40} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.welcomeText}>
            Verifica tu identidad para continuar
          </Text>

          {/* Formulario */}
          <View style={styles.formContainer}>
            
            {/* Nombre Completo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="person-outline" size={16} color="#FF6B35" /> Nombre(s)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Carlos"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={nombre}
                onChangeText={setNombreCompleto}
              />
            </View>

            {/* Apellido Paterno */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="person-outline" size={16} color="#FF6B35" /> Apellido Paterno
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Pérez"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={apellidoPaterno}
                onChangeText={setApellidoPaterno}
              />
            </View>

            {/* Apellido Materno */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="person-outline" size={16} color="#FF6B35" /> Apellido Materno
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: López"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={apellidoMaterno}
                onChangeText={setApellidoMaterno}
              />
            </View>

            {/* Dirección */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="location-outline" size={16} color="#FF6B35" /> Dirección
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Av. Principal #123, Col. Centro"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={direccion}
                onChangeText={setDireccion}
              />
            </View>

            {/* CURP */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="id-card-outline" size={16} color="#FF6B35" /> CURP
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: GODE561231HDFRRL09"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="characters"
                value={curp}
                onChangeText={(text) => setCurp(text.toUpperCase())}
              />
            </View>

           

           

          </View>

          {/* Botón Continuar */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleContinue}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B35', '#E8552E']}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.submitText}>Validando...</Text>
                  <Ionicons name="refresh" size={20} color="#fff" />
                </View>
              ) : (
                <>
                  <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                  <Text style={styles.submitText}>Continuar</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            🔒 Tus datos están seguros y protegidos
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    marginTop: 16,
  },
});