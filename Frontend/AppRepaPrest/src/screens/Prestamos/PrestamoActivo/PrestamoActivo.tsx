import React, { JSX, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
  StatusBar,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { CommonActions } from '@react-navigation/native'; 

type Props = StackScreenProps<RootStackParamList, 'PrestamoActivo'>;

interface PrestamoActivoData {
  id: string;
  montoSolicitado: number;
  montoTotal: number;
  cuotaQuincenal: number;
  quincenas: number;
  fechaSolicitud: string;
  fechaProximoPago: string;
  fechaUltimoPago: string | null;
  quincenasRestantes: number;
  progreso: number;
  status: 'activo' | 'pagado';
}

const BANNER_BACKGROUND = require('../../../../assets/images/asas.jpg');

export default function PrestamoActivoScreen({ route, navigation }: Props) {
  const { userId, nombre, prestamoData } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const progressAnim = useState(new Animated.Value(0))[0];

  // 📌 Datos del préstamo
  const [prestamo, setPrestamo] = useState<PrestamoActivoData>({
    id: prestamoData?.id || 'PR-2026-001',
    montoSolicitado: prestamoData?.montoSolicitado || 2000,
    montoTotal: prestamoData?.montoTotal || 2160,
    cuotaQuincenal: prestamoData?.cuotaQuincenal || 1080,
    quincenas: prestamoData?.quincenas || 2,
    fechaSolicitud: prestamoData?.fechaSolicitud || '01 de agosto, 2026',
    fechaProximoPago: prestamoData?.fechaProximoPago || '15 de agosto, 2026',
    fechaUltimoPago: null,
    quincenasRestantes: prestamoData?.quincenasRestantes || 2,
    progreso: prestamoData?.progreso || 0,
    status: 'activo'
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true })
    ]).start();

    Animated.timing(progressAnim, {
      toValue: prestamo.progreso,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-MX')}`;

  const getDaysRemaining = () => {
    const today = new Date();
    const nextPayment = new Date(prestamo.fechaProximoPago);
    const diffDays = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // 📌 FUNCIÓN PARA NAVEGAR A PRESTAMOS (TAB)
  const navigateToPrestamos = () => {
    // ✅ Navegar al tab Prestamos dentro del Home
    navigation.dispatch({
      ...CommonActions.navigate({
        name: 'Home', // El Stack Navigator que contiene el Tab
        params: {
          screen: 'Prestamos', // El Tab dentro de Home
          params: {
            userId: userId,
            userName: nombre
          }
        }
      })
    });
  };

  const confirmarPago = () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessModal(true);
      
      setPrestamo(prev => ({
        ...prev,
        quincenasRestantes: prev.quincenasRestantes - 1,
        progreso: prev.progreso + 50,
        fechaUltimoPago: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
        fechaProximoPago: new Date(new Date().setDate(new Date().getDate() + 15))
          .toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      }));

      setTimeout(() => {
        setShowSuccessModal(false);
        if (prestamo.quincenasRestantes - 1 <= 0) {
          Alert.alert(
            "¡Préstamo Liquidado!",
            `Felicidades ${nombre}, has completado el pago de tu préstamo. Tu linea de credito aumento !!.`,
            [
              { 
                text: "Solicitar nuevo préstamo", 
                onPress: navigateToPrestamos 
              }
            ]
          );
        }
      }, 3000);
    }, 2000);
  };

  const daysRemaining = getDaysRemaining();

  // COMPONENTES REUTILIZABLES
  const SectionCard = ({ children, style }: any) => (
    <View style={[styles.card, style]}>{children}</View>
  );

  const DetailItem = ({ icon, label, value, iconColor = '#FF6B35' }: any) => (
    <View style={styles.detailItem}>
      <View style={[styles.detailIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Préstamo</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Banner Principal */}
        <Animated.View style={[styles.mainCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <ImageBackground source={BANNER_BACKGROUND} style={styles.bannerImage} imageStyle={styles.bannerImageStyle}>
            <LinearGradient colors={['rgba(0,0,0,0.7)', 'rgba(255,107,53,0.3)']} style={styles.bannerOverlay}>
              <View style={styles.bannerContent}>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Préstamo Activo</Text>
                </View>
                <Text style={styles.userName}>{nombre || 'Usuario'}</Text>
                <Text style={styles.amountLabel}>Monto solicitado</Text>
                <Text style={styles.amountValue}>{formatCurrency(prestamo.montoSolicitado)}</Text>
                
                <View style={styles.progressWrapper}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progreso</Text>
                    <Text style={styles.progressPercent}>{prestamo.progreso}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <Animated.View style={[styles.progressFill, { 
                      width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })
                    }]} />
                  </View>
                  <Text style={styles.progressSubtext}>
                    {prestamo.quincenasRestantes} de {prestamo.quincenas} quincenas restantes
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* Detalles */}
        <SectionCard>
          <Text style={styles.sectionTitle}>Detalles del préstamo</Text>
          <View style={styles.detailsGrid}>
            <DetailItem icon="cash-outline" label="Monto total" value={formatCurrency(prestamo.montoTotal)} />
            <View style={styles.divider} />
            <DetailItem icon="calendar-outline" label="Cuota quincenal" value={formatCurrency(prestamo.cuotaQuincenal)} iconColor="#4ADE80" />
            <View style={styles.divider} />
            <DetailItem icon="time-outline" label="Quincenas" value={prestamo.quincenas.toString()} iconColor="#60A5FA" />
          </View>
        </SectionCard>

        {/* Fechas */}
        <SectionCard>
          <View style={styles.dateItem}>
            <View style={[styles.dateIcon, { backgroundColor: '#FF6B3515' }]}>
              <Ionicons name="calendar" size={18} color="#FF6B35" />
            </View>
            <View>
              <Text style={styles.dateLabel}>Fecha de solicitud</Text>
              <Text style={styles.dateValue}>{prestamo.fechaSolicitud}</Text>
            </View>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.dateItem}>
            <View style={[styles.dateIcon, { backgroundColor: '#FFD93D15' }]}>
              <Ionicons name="alert-circle" size={18} color="#FFD93D" />
            </View>
            <View>
              <Text style={styles.dateLabel}>Próximo pago</Text>
              <Text style={styles.dateValue}>{prestamo.fechaProximoPago}</Text>
              {daysRemaining > 0 && <Text style={styles.dateSubtext}>⏰ {daysRemaining} días restantes</Text>}
            </View>
          </View>
          {prestamo.fechaUltimoPago && (
            <>
              <View style={styles.dividerLine} />
              <View style={styles.dateItem}>
                <View style={[styles.dateIcon, { backgroundColor: '#4ADE8015' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>Último pago</Text>
                  <Text style={styles.dateValue}>{prestamo.fechaUltimoPago}</Text>
                </View>
              </View>
            </>
          )}
        </SectionCard>

        {/* Resumen */}
        <SectionCard>
          <Text style={styles.sectionTitle}>Resumen de pagos</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pagado</Text>
              <Text style={styles.summaryValuePaid}>
                {formatCurrency(prestamo.montoSolicitado * (prestamo.progreso / 100))}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Restante</Text>
              <Text style={styles.summaryValueRemaining}>
                {formatCurrency(prestamo.montoTotal * ((100 - prestamo.progreso) / 100))}
              </Text>
            </View>
          </View>
        </SectionCard>

        {/* Botón Pago */}
        {prestamo.quincenasRestantes > 0 && (
          <Animated.View style={[styles.buttonWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity style={styles.pagarButton} onPress={() => setShowConfirmModal(true)} disabled={isLoading}>
              <LinearGradient colors={['#4ADE80', '#22C55E']} style={styles.buttonGradient}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.buttonText}>Procesando...</Text>
                    <Ionicons name="refresh" size={20} color="#fff" />
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                    <Text style={styles.buttonText}>PAGAR ${prestamo.cuotaQuincenal.toLocaleString()}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Liquidado */}
        {prestamo.quincenasRestantes <= 0 && (
          <View style={styles.liquidadoCard}>
            <Ionicons name="checkmark-done-circle" size={60} color="#4ADE80" />
            <Text style={styles.liquidadoTitle}>🎉 ¡Préstamo Liquidado!</Text>
            <Text style={styles.liquidadoText}>Has completado todos los pagos. ¡Excelente trabajo!</Text>
            <TouchableOpacity style={styles.nuevoPrestamoButton} onPress={navigateToPrestamos}>
              <LinearGradient colors={['#FF6B35', '#E8552E']} style={styles.nuevoPrestamoGradient}>
                <Text style={styles.nuevoPrestamoText}>Solicitar nuevo préstamo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footerNote}>🔒 Tus pagos están seguros y protegidos</Text>
      </ScrollView>

      {/* Modal Confirmar */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.modalIcon}>
              <LinearGradient colors={['#4ADE80', '#22C55E']} style={styles.modalIconGradient}>
                <Ionicons name="cash-outline" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.modalTitle}>Confirmar pago</Text>
            <Text style={styles.modalSubtitle}>{nombre}, estás a punto de realizar el pago de tu cuota quincenal</Text>
            
            <View style={styles.modalDetails}>
              <View style={styles.modalRow}><Text style={styles.modalLabel}>Monto a pagar</Text><Text style={styles.modalValue}>{formatCurrency(prestamo.cuotaQuincenal)}</Text></View>
              <View style={styles.modalRow}><Text style={styles.modalLabel}>Fecha de pago</Text><Text style={styles.modalValue}>{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</Text></View>
              <View style={styles.modalRow}><Text style={styles.modalLabel}>Quincenas restantes</Text><Text style={styles.modalValue}>{prestamo.quincenasRestantes - 1}</Text></View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={confirmarPago}>
                <Text style={styles.modalBtnTextConfirm}>Pagar ahora</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Modal Éxito */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={['#4ADE80', '#22C55E']} style={styles.successIcon}>
              <Ionicons name="checkmark" size={50} color="#fff" />
            </LinearGradient>
            <Text style={styles.successTitle}>¡Pago Realizado! ✅</Text>
            <Text style={styles.successSubtitle}>Tu pago de {formatCurrency(prestamo.cuotaQuincenal)} ha sido registrado exitosamente.</Text>
            
            <View style={styles.successDetails}>
              <View style={styles.modalRow}><Text style={styles.modalLabel}>Próximo pago</Text><Text style={styles.modalValue}>{new Date(new Date().setDate(new Date().getDate() + 15)).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</Text></View>
              <View style={styles.modalRow}><Text style={styles.modalLabel}>Quincenas restantes</Text><Text style={styles.modalValue}>{prestamo.quincenasRestantes - 1}</Text></View>
            </View>

            <TouchableOpacity style={styles.successButton} onPress={() => setShowSuccessModal(false)}>
              <LinearGradient colors={['#FF6B35', '#E8552E']} style={styles.successButtonGradient}>
                <Text style={styles.successButtonText}>Continuar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // CONTENEDORES PRINCIPALES
  container: { flex: 1, backgroundColor: '#0A0A12' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 20 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // BANNER PRINCIPAL
  mainCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 20, shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  bannerImage: { width: '100%', minHeight: 320 },
  bannerImageStyle: { borderRadius: 24 },
  bannerOverlay: { padding: 24, minHeight: 320 },
  bannerContent: { position: 'relative', zIndex: 2 },

  // BADGE DE ESTADO
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // MONTO Y USUARIO
  userName: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  amountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  amountValue: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 16 },

  // PROGRESO
  progressWrapper: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  progressPercent: { fontSize: 14, fontWeight: '700', color: '#fff' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4ADE80', borderRadius: 3 },
  progressSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' },

  //  TARJETAS SECUNDARIAS
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 16 },

  // DETALLES
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  detailItem: { alignItems: 'center', flex: 1 },
  detailIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  detailLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  detailValue: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.06)' },

  // FECHAS
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dateLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  dateValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  dateSubtext: { fontSize: 12, color: '#FFD93D', marginTop: 2 },
  dividerLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },

  // RESUMEN
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  summaryValuePaid: { fontSize: 20, fontWeight: '700', color: '#4ADE80', marginTop: 2 },
  summaryValueRemaining: { fontSize: 20, fontWeight: '700', color: '#FF6B35', marginTop: 2 },

  //BOTÓN PAGAR
  buttonWrapper: { marginVertical: 8 },
  pagarButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // LIQUIDADO
  liquidadoCard: { backgroundColor: 'rgba(74,222,128,0.05)', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', marginTop: 8 },
  liquidadoTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginVertical: 8 },
  liquidadoText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 16 },
  nuevoPrestamoButton: { borderRadius: 12, overflow: 'hidden', width: '100%' },
  nuevoPrestamoGradient: { paddingVertical: 14, alignItems: 'center' },
  nuevoPrestamoText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // 📌 FOOTER
  footerNote: { textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 16 },

  // 📌 MODALES
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1A1A26', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalIcon: { alignItems: 'center', marginBottom: 16 },
  modalIconGradient: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20 },
  modalDetails: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 20 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  modalLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  modalValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: 'rgba(255,255,255,0.05)' },
  modalBtnConfirm: { backgroundColor: '#4ADE80' },
  modalBtnTextCancel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  modalBtnTextConfirm: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // 📌 ÉXITO
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20 },
  successDetails: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 16 },
  successButton: { borderRadius: 12, overflow: 'hidden' },
  successButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  successButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});