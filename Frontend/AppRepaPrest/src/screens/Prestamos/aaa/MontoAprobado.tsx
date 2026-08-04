// app/screens/MontoAprobado/MontoAprobado.tsx
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'MontoAprobado'>;

export default function MontoAprobado({ route, navigation }: Props) {
  const { userId, nombre } = route.params || {};

  // Estados
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(null);
  const [planSeleccionado, setPlanSeleccionado] = useState<string | null>(null);
  const [clabe, setClabe] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Cálculo de planes
  const calcularPlan = (quincenas: number) => {
    if (!montoSeleccionado) return null;
    let interes = 0;
    if (quincenas === 1) interes = 0.05;
    if (quincenas === 2) interes = 0.08;

    const totalConInteres = Math.round(montoSeleccionado + (montoSeleccionado * interes));
    const pagoPorQuincena = Math.round(totalConInteres / quincenas);

    return {
      key: `${quincenas}q`,
      titulo: `${quincenas === 1 ? '1 pago' : quincenas + ' pagos'}`,
      montoTexto: `$${pagoPorQuincena.toLocaleString()}`,
      badge: `${quincenas} quincena${quincenas > 1 ? 's' : ''}`
    };
  };

  const planes = montoSeleccionado ? [calcularPlan(1), calcularPlan(2)] : [];

  const handleFinalizar = () => {
    if (!montoSeleccionado) return Alert.alert("Atención", "Elige un monto.");
    if (!planSeleccionado) return Alert.alert("Atención", "Elige un plan de pago.");
    if (clabe.replace(/\s/g, '').length !== 18) {
      return Alert.alert("Error", "La CLABE debe tener 18 dígitos.");
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setModalVisible(true);
    }, 1500);
  };

  const cerrarPopUpEIrAlHome = () => {
    setModalVisible(false);
    navigation.replace('Home', { userId, nombre, montoAprobado: montoSeleccionado } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Crédito en efectivo</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* --- BANNER GRANDE CON FONDO ATRACTIVO --- */}
          <LinearGradient
            colors={['#FF6B35', '#E8552E', '#C0392B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerContainer}
          >
            {/* Fondo decorativo con íconos grandes (Efecto de textura) */}
            <View style={styles.bannerBgIcon1}>
              <Ionicons name="cash-outline" size={160} color="rgba(255,255,255,0.08)" />
            </View>
            <View style={styles.bannerBgIcon2}>
              <Ionicons name="card-outline" size={120} color="rgba(255,255,255,0.06)" />
            </View>

            {/* Contenido del banner */}
            <View style={styles.bannerContent}>
              <View style={styles.bannerIconWrapper}>
                <View style={styles.bannerIconCircle}>
                  <Ionicons name="checkmark-done" size={28} color="#FF6B35" />
                </View>
              </View>
              
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>¡Solicitud aprobada! ✅</Text>
                <Text style={styles.bannerSubtitle}>
                  Tu saldo disponible es de
                </Text>
                <Text style={styles.bannerHighlight}>$200.00 MXN</Text>
              </View>
            </View>
          </LinearGradient>

          {/* --- 1. SELECCIÓN DE MONTO --- */}
          <Text style={styles.questionTitle}>¿Cuánto te gustaría solicitar?</Text>
          <View style={styles.gridContainer}>
            {[100, 200].map((monto) => (
              <TouchableOpacity 
                key={monto} 
                style={[styles.montoButton, montoSeleccionado === monto && styles.montoButtonActive]}
                onPress={() => {
                  setMontoSeleccionado(monto);
                  setPlanSeleccionado(null);
                }}
              >
                <Text style={[styles.montoText, montoSeleccionado === monto && styles.montoTextActive]}>
                  ${monto.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- 2. SELECCIÓN DE PLAN DE PAGO --- */}
          {montoSeleccionado && (
            <>
              <Text style={styles.sectionTitle}>Elige tu plan de pago</Text>
              <View style={styles.plansContainer}>
                {planes.map((plan) => plan && (
                  <TouchableOpacity
                    key={plan.key}
                    style={[styles.planCard, planSeleccionado === plan.key && styles.planCardActive]}
                    onPress={() => setPlanSeleccionado(plan.key)}
                  >
                    <View style={styles.planInfo}>
                      <Text style={[styles.planTitle, planSeleccionado === plan.key && styles.textActive]}>
                        {plan.titulo} de {plan.montoTexto}
                      </Text>
                    </View>
                    <View style={[styles.badgeContainer, planSeleccionado === plan.key && styles.badgeActive]}>
                      <Text style={[styles.badgeText, planSeleccionado === plan.key && styles.badgeTextActive]}>
                        {plan.badge}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* --- 3. INGRESAR CLABE Y BOTÓN --- */}
          {planSeleccionado && (
            <>
              <View style={styles.clabeSection}>
                <Text style={styles.clabeTitle}>Introduce tu CLABE interbancaria</Text>
                <Text style={styles.clabeSubtitle}>El monto solicitado se enviará a esta cuenta</Text>
                <TextInput
                  style={styles.clabeInput}
                  placeholder="000000000000000000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="numeric"
                  maxLength={18}
                  value={clabe}
                  onChangeText={setClabe}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
                onPress={handleFinalizar}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#FF6B35', '#E8552E']}
                  style={styles.submitGradient}
                >
                  {isProcessing ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.submitText}>Procesando...</Text>
                      <Ionicons name="refresh" size={20} color="#fff" />
                    </View>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.submitText}>Listo</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- POP-UP DE CONFIRMACIÓN --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <LinearGradient
                colors={['#4ADE80', '#22C55E']}
                style={styles.modalIconGradient}
              >
                <Ionicons name="mail-outline" size={40} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>¡Depósito en camino! 📩</Text>
            <Text style={styles.modalBody}>
              Hemos recibido tu solicitud correctamente. Uno de nuestros asesores se comunicará contigo en las próximas horas para confirmar tu CLABE y finalizar el proceso.
            </Text>

            <View style={styles.modalDetailsContainer}>
              <Text style={styles.modalDetailLabel}>Monto solicitado:</Text>
              <Text style={styles.modalDetailValue}>${montoSeleccionado}</Text>
              <Text style={styles.modalDetailLabel}>Plan de pago:</Text>
              <Text style={styles.modalDetailValue}>{planSeleccionado?.replace('q', ' quincenas')}</Text>
              <Text style={styles.modalDetailLabel}>CLABE:</Text>
              <Text style={styles.modalDetailValue}>**** {clabe.slice(-4)}</Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={cerrarPopUpEIrAlHome}>
              <LinearGradient colors={['#FF6B35', '#E8552E']} style={styles.modalButtonGradient}>
                <Text style={styles.modalButtonText}>Finalizar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // --- BANNER GRANDE Y ATRACTIVO ---
  bannerContainer: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 30,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15, // Sombra muy visible
    width: '100%',
  },
  bannerBgIcon1: {
    position: 'absolute',
    right: -40,
    top: -40,
  },
  bannerBgIcon2: {
    position: 'absolute',
    left: -30,
    bottom: -30,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  bannerIconWrapper: {
    marginRight: 20,
  },
  bannerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  bannerHighlight: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 6,
  },

  // Estilos Paso 1: Montos
  questionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 15 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 20 },
  montoButton: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 25,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent'
  },
  montoButtonActive: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.1)' },
  montoText: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  montoTextActive: { color: '#FF6B35' },

  // Estilos Paso 2: Planes
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 15, marginTop: 10 },
  plansContainer: { gap: 12, marginBottom: 20 },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  planCardActive: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.05)' },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  textActive: { color: '#FF6B35' },
  badgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: 20
  },
  badgeActive: { backgroundColor: '#FF6B35' },
  badgeText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
  badgeTextActive: { color: '#fff' },

  // Estilos Paso 3: CLABE
  clabeSection: { marginTop: 10, marginBottom: 20 },
  clabeTitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontWeight: '600' },
  clabeSubtitle: { fontSize: 14, color: '#FF6B35', marginBottom: 15 },
  clabeInput: {
    fontSize: 20, color: '#fff', fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    letterSpacing: 2
  },

  // Botón Final
  submitButton: {
    marginTop: 10, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 10
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // --- ESTILOS DEL POP-UP ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15
  },
  modalIconContainer: { marginBottom: 15 },
  modalIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10
  },
  modalBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20
  },
  modalDetailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  modalDetailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 6
  },
  modalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden'
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});