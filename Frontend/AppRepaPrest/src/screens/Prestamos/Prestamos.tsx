import React, { JSX, useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
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
  Modal,
  Image,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../Home/Home';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

type Props = BottomTabScreenProps<HomeTabParamList, 'Prestamos'>;

const { width, height } = Dimensions.get('window');

const IMAGES = {
  bannerMain: require('../../../assets/images/ayuda.webp'),
  delivery: require('../../../assets/images/123.png'),
  maintenance: require('../../../assets/images/download.jpg'),
  safety: require('../../../assets/images/security.webp'),
  success: require('../../../assets/images/123.png'),
  happy: require('../../../assets/images/crecimiento.webp'),
  emergency: require('../../../assets/images/123.png'),
  motorcycle: require('../../../assets/images/123.png'),
  rider: require('../../../assets/images/123.png'),
  money: require('../../../assets/images/123.png'),
  repartidor1: require('../../../assets/images/123.png'),
  repartidor2: require('../../../assets/images/123.png'),
  repartidor3: require('../../../assets/images/123.png'),
  repartidor4: require('../../../assets/images/123.png'),
  repartidor5: require('../../../assets/images/123.png'),
};

const AVATARS = {
  carlos: 'https://ui-avatars.com/api/?name=Carlos&size=300&background=FF6B35&color=fff&bold=true',
  miguel: 'https://ui-avatars.com/api/?name=Miguel&size=300&background=4ADE80&color=fff&bold=true',
  ana: 'https://ui-avatars.com/api/?name=Ana&size=300&background=60A5FA&color=fff&bold=true',
  juan: 'https://ui-avatars.com/api/?name=Juan&size=300&background=FFD93D&color=fff&bold=true',
  maria: 'https://ui-avatars.com/api/?name=Maria&size=300&background=FF6B35&color=fff&bold=true',
  pedro: 'https://ui-avatars.com/api/?name=Pedro&size=300&background=4ADE80&color=fff&bold=true',
};

const testimonios = [
  {
    id: 1,
    nombre: "Miguel Rodríguez",
    avatar: AVATARS.miguel,
    rating: 5,
    rol: "Repartidor desde 2024",
    comentario: "Me cuida, me apoya y me presta. Estoy totalmente satisfecho con los servicios que ofrece. ¡Fue la mejor decisión!",
    emoji: "🌟"
  },
  {
    id: 2,
    nombre: "Ana Martínez",
    avatar: AVATARS.ana,
    rating: 5,
    rol: "Repartidora desde 2023",
    comentario: "La app es increíble, los préstamos son rápidos y sin complicaciones. Me han sacado de apuros.",
    emoji: "💪"
  },
  {
    id: 3,
    nombre: "Juan Pérez",
    avatar: AVATARS.juan,
    rating: 4,
    rol: "Repartidor desde 2025",
    comentario: "Excelente servicio, el dinero llega rápido y las cuotas son muy accesibles. 100% recomendado para repartidores.",
    emoji: "🚀"
  },
  {
    id: 4,
    nombre: "Jose Uriel",
    avatar: AVATARS.juan,
    rating: 4,
    rol: "Repartidor desde 2025",
    comentario: "Estoy sorprendido con esta app monitoreo, comunidad y prestamos pfff lo que nos hacia falta para poder laborar, ahora si sera mejor trabajar como repartidor y pasaje.",
    emoji: "🚀"
  }
];

export default function PrestamosScreen(_props: Props): JSX.Element {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(2000);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentTestimonioIndex, setCurrentTestimonioIndex] = useState(0);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const repartidor = {
    nombre: "Carlos",
    entregasHoy: 8,
    entregasSemana: 42,
    reputacion: 4.8,
    nivelesCompletados: 5,
    antiguedad: "3 meses",
    metaDiaria: 15,
    promedioDiario: 12,
    avatar: AVATARS.carlos
  };

  const prestamoConfig = {
    montoPreaprobado: 2000,
    plazoQuincenas: 2,
    interesQuincenal: 8,
    cuotaQuincenal: 1080,
    totalPagar: 2160,
    fechaProximoPago: "15 de agosto, 2026"
  };

  const banners = [
    {
      id: 1,
      title: "¡Tu moto te necesita!",
      description: "Mantenimiento preventivo",
      image: IMAGES.maintenance,
      emoji: "🛵"
    },
    {
      id: 2,
      title: "Equipo de seguridad",
      description: "Invierte en tu protección",
      image: IMAGES.safety,
      emoji: "🛡️"
    },
    {
      id: 3,
      title: "Crecimiento profesional",
      description: "Más herramientas, más pedidos",
      image: IMAGES.happy,
      emoji: "📈"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentTestimonioIndex + 1) % testimonios.length;
      const offset = nextIndex * (width - 40);
      
      scrollViewRef.current?.scrollTo({
        x: offset,
        animated: true,
      });
      setCurrentTestimonioIndex(nextIndex);
    }, 8000);

    return () => clearInterval(interval);
  }, [currentTestimonioIndex]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // ✅ FUNCIÓN PARA MOSTRAR EL POPUP DE PRIVACIDAD
  const handleSolicitarPrestamo = () => {
    setShowPrivacyModal(true);
  };

  // ✅ FUNCIÓN PARA ACEPTAR - REDIRIGE A SOLICITUD
  const handleAcceptPrivacy = () => {
    setShowPrivacyModal(false);
    
    // ✅ Navegar a la pantalla de solicitud con los datos del usuario
    navigation.navigate('SolicitudPrestamo', {
      userId: 'user123', // Reemplazar con el ID real del usuario
      userName: repartidor.nombre,
      montoPreaprobado: prestamoConfig.montoPreaprobado,
    });
  };

  // ✅ FUNCIÓN PARA RECHAZAR - REDIRIGE AL HOME
  const handleRejectPrivacy = () => {
    setShowPrivacyModal(false);
    Alert.alert(
      "Préstamo no disponible",
      "Para solicitar un préstamo, debes aceptar las políticas de privacidad.",
      [
        { 
          text: "Entendido", 
          onPress: () => {
            navigation.navigate('Prestamos');
          }
        }
      ]
    );
  };

  const handleConfirmarPrestamo = () => {
    setIsLoading(true);
    setShowModal(false);

    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        Alert.alert(
          "¡Préstamo Aprobado! 🎉",
          `Hola ${repartidor.nombre}, tu préstamo de $${selectedAmount} ha sido aprobado.
          
          📋 Detalles de tu préstamo:
          • Monto: $${selectedAmount}
          • Plazo: ${prestamoConfig.plazoQuincenas} quincenas
          • Cuota quincenal: $${prestamoConfig.cuotaQuincenal}
          • Total a pagar: $${prestamoConfig.totalPagar}
          • Próximo pago: ${prestamoConfig.fechaProximoPago}
          
          💰 El dinero estará disponible en tu cuenta en minutos.
          ¡Aprovecha esta oportunidad para impulsar tu negocio!`,
          [{ text: "¡Excelente!" }]
        );
      }, 1000);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNER PRINCIPAL */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <ImageBackground
            source={IMAGES.bannerMain}
            style={styles.mainBanner}
            imageStyle={styles.bannerImageStyle}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'rgba(255,107,53,0.3)']}
              style={styles.bannerOverlay}
            >
              <View style={styles.bannerContent}>
                <View style={styles.preapproveBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.preapproveText}>PREAPROBADO</Text>
                </View>
                
                <Text style={styles.bannerTitle}>
                  ¡Tu préstamo te espera!
                </Text>
                
                <View style={styles.amountDisplay}>
                  <Text style={styles.amountSymbol}>$</Text>
                  <Text style={styles.amountNumber}>
                    {prestamoConfig.montoPreaprobado.toLocaleString()}
                  </Text>
                </View>
                
                <Text style={styles.amountLabel}>
                  {repartidor.nombre}, tienes un monto preaprobado
                </Text>

                <View style={styles.quickInfo}>
                  <View style={styles.quickInfoItem}>
                    <Ionicons name="calendar-outline" size={16} color="#FFD93D" />
                    <Text style={styles.quickInfoText}>
                      Pago en {prestamoConfig.plazoQuincenas} quincenas
                    </Text>
                  </View>
                  <View style={styles.quickInfoDivider} />
                  <View style={styles.quickInfoItem}>
                    <Ionicons name="cash-outline" size={16} color="#4ADE80" />
                    <Text style={styles.quickInfoText}>
                      Cuota de ${prestamoConfig.cuotaQuincenal}/quincena
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* PERFIL DEL REPARTIDOR */}
        <Animated.View style={[styles.profileCard, { opacity: fadeAnim }]}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: repartidor.avatar }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{repartidor.nombre}</Text>
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Ionicons name="star" size={14} color="#FFD93D" />
                  <Text style={styles.profileStatText}>{repartidor.reputacion}</Text>
                </View>
                <View style={styles.profileStat}>
                  <Ionicons name="bicycle" size={14} color="#FF6B35" />
                  <Text style={styles.profileStatText}>{repartidor.entregasHoy} hoy</Text>
                </View>
                <View style={styles.profileStat}>
                  <Ionicons name="trophy" size={14} color="#4ADE80" />
                  <Text style={styles.profileStatText}>{repartidor.nivelesCompletados} niveles</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* BANNER ROTATIVO */}
        <Animated.View style={[styles.rotatingBanner, { opacity: fadeAnim }]}>
          <Image
            source={banners[currentBannerIndex].image}
            style={styles.rotatingImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.rotatingOverlay}
          >
            <View style={styles.rotatingContent}>
              <Text style={styles.rotatingEmoji}>
                {banners[currentBannerIndex].emoji}
              </Text>
              <View style={styles.rotatingText}>
                <Text style={styles.rotatingTitle}>
                  {banners[currentBannerIndex].title}
                </Text>
                <Text style={styles.rotatingDescription}>
                  {banners[currentBannerIndex].description}
                </Text>
              </View>
            </View>
          </LinearGradient>
          <View style={styles.rotatingDots}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.rotatingDot,
                  currentBannerIndex === index && styles.rotatingDotActive
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* CÓMO FUNCIONA */}
        <Animated.View style={[styles.howItWorks, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>
            📱 ¿Cómo funciona?
          </Text>
          
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: 'rgba(255,107,53,0.15)' }]}>
                <Ionicons name="hand-left" size={28} color="#FF6B35" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>1. Solicita tu préstamo</Text>
                <Text style={styles.stepDesc}>
                  Elige el monto que necesitas
                </Text>
              </View>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: 'rgba(74,222,128,0.15)' }]}>
                <Ionicons name="cash" size={28} color="#4ADE80" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>2. Recibe el dinero</Text>
                <Text style={styles.stepDesc}>
                  En menos de 24 horas en tu cuenta
                </Text>
              </View>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={[styles.stepIcon, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
                <Ionicons name="calendar" size={28} color="#60A5FA" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>3. Paga en quincenas</Text>
                <Text style={styles.stepDesc}>
                  Pagos fijos sin complicaciones
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* RAZONES PARA USAR EL PRÉSTAMO */}
        <Animated.View style={[styles.reasonsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>
            ¿Para qué usar tu préstamo?
          </Text>

          <View style={styles.reasonsGrid}>
            <View style={styles.reasonCard}>
              <View style={styles.reasonIconContainer}>
                <Ionicons name="construct-outline" size={28} color="#FF6B35" />
              </View>
              <Text style={styles.reasonCardTitle}>Mantenimiento</Text>
              <Text style={styles.reasonCardDesc}>
                Repara tu moto y no pares
              </Text>
            </View>

            <View style={styles.reasonCard}>
              <View style={[styles.reasonIconContainer, { backgroundColor: 'rgba(74,222,128,0.15)' }]}>
                <Ionicons name="shield-outline" size={28} color="#4ADE80" />
              </View>
              <Text style={styles.reasonCardTitle}>Equipo seguro</Text>
              <Text style={styles.reasonCardDesc}>
                Invierte en protección
              </Text>
            </View>

            <View style={styles.reasonCard}>
              <View style={[styles.reasonIconContainer, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
                <Ionicons name="trending-up-outline" size={28} color="#60A5FA" />
              </View>
              <Text style={styles.reasonCardTitle}>Crecer</Text>
              <Text style={styles.reasonCardDesc}>
                Más herramientas
              </Text>
            </View>

            <View style={styles.reasonCard}>
              <View style={[styles.reasonIconContainer, { backgroundColor: 'rgba(255,217,61,0.15)' }]}>
                <Ionicons name="home-outline" size={28} color="#FFD93D" />
              </View>
              <Text style={styles.reasonCardTitle}>Emergencias</Text>
              <Text style={styles.reasonCardDesc}>
                Imprevistos de la vida
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* SIMULADOR DE PRÉSTAMO */}
        <Animated.View style={[styles.simulatorContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>
            Simula tu préstamo
          </Text>

          <View style={styles.simulatorCard}>
            <View style={styles.simulatorHeader}>
              <Text style={styles.simulatorLabel}>Monto a solicitar</Text>
              <Text style={styles.simulatorValue}>${selectedAmount}</Text>
            </View>

            <View style={styles.simulatorControls}>
              <TouchableOpacity 
                style={styles.simulatorButton}
                onPress={() => setSelectedAmount(Math.max(200, selectedAmount - 200))}
              >
                <Ionicons name="remove" size={24} color="#FF6B35" />
              </TouchableOpacity>
              
              <View style={styles.simulatorSlider}>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${((selectedAmount - 200) / (prestamoConfig.montoPreaprobado - 500)) * 100}%` }]} />
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>$200</Text>
                  <Text style={styles.sliderLabel}>${prestamoConfig.montoPreaprobado}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.simulatorButton}
                onPress={() => setSelectedAmount(Math.min(prestamoConfig.montoPreaprobado, selectedAmount + 500))}
              >
                <Ionicons name="add" size={24} color="#FF6B35" />
              </TouchableOpacity>
            </View>

            <View style={styles.simulatorDetails}>
              <View style={styles.simulatorDetailItem}>
                <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.4)" />
                <Text style={styles.detailLabel}>Cuota quincenal</Text>
                <Text style={styles.detailValue}>
                  ${Math.round((selectedAmount * 1.08) / prestamoConfig.plazoQuincenas)}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.simulatorDetailItem}>
                <Ionicons name="cash-outline" size={18} color="rgba(255,255,255,0.4)" />
                <Text style={styles.detailLabel}>Total a pagar</Text>
                <Text style={styles.detailValue}>
                  ${Math.round(selectedAmount * 1.08)}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.simulatorDetailItem}>
                <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.4)" />
                <Text style={styles.detailLabel}>Plazo</Text>
                <Text style={styles.detailValue}>
                  {prestamoConfig.plazoQuincenas} quincenas
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* CARRUSEL DE TESTIMONIOS */}
        <Animated.View style={[styles.testimoniosContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>
            ⭐ Opiniones de repartidores
          </Text>
          
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={width - 40}
            snapToAlignment="center"
            contentContainerStyle={styles.testimoniosScrollContent}
            onScroll={(event) => {
              const offset = event.nativeEvent.contentOffset.x;
              const index = Math.round(offset / (width - 40));
              setCurrentTestimonioIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {testimonios.map((item) => (
              <View key={item.id} style={[styles.testimonioCard, { width: width - 60 }]}>
                <Text style={styles.testimonioEmoji}>{item.emoji}</Text>
                
                <View style={styles.testimonioHeader}>
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.testimonioAvatar}
                  />
                  <View style={styles.testimonioInfo}>
                    <Text style={styles.testimonioNombre}>{item.nombre}</Text>
                    <View style={styles.testimonioRating}>
                      {[1,2,3,4,5].map((star) => (
                        <Ionicons 
                          key={star} 
                          name={star <= item.rating ? "star" : "star-outline"} 
                          size={14} 
                          color={star <= item.rating ? "#FFD93D" : "rgba(255,255,255,0.2)"} 
                        />
                      ))}
                    </View>
                    <Text style={styles.testimonioRol}>{item.rol}</Text>
                  </View>
                </View>
                
                <Text style={styles.testimonioTexto}>
                  "{item.comentario}"
                </Text>
                
                <View style={styles.testimonioQuoteIcon}>
                  <Ionicons name="chatbubble" size={20} color="rgba(255,107,53,0.2)" />
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.testimoniosDots}>
            {testimonios.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.testimoniosDot,
                  currentTestimonioIndex === index && styles.testimoniosDotActive
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* BOTÓN PRINCIPAL */}
        <View style={styles.buttonSpacer} />
        <Animated.View 
          style={[
            styles.buttonContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <TouchableOpacity
            style={styles.solicitarButton}
            onPress={handleSolicitarPrestamo}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B35', '#E8552E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.buttonText}>Procesando...</Text>
                  <Ionicons name="refresh" size={20} color="#fff" />
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  SOLICITAR AHORA
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerNote}>
          🔒 Sin aval • Sin historial crediticio • Basado en tu desempeño
        </Text>
      </ScrollView>

      {/* MODAL DE CONFIRMACIÓN */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Image
                source={IMAGES.success}
                style={styles.modalImage}
              />
              <View style={styles.modalIconOverlay}>
                <Ionicons name="checkmark-circle" size={40} color="#4ADE80" />
              </View>
            </View>
            
            <Text style={styles.modalTitle}>
              Confirmar préstamo
            </Text>
            
            <Text style={styles.modalSubtitle}>
              {repartidor.nombre}, estás a punto de solicitar:
            </Text>

            <View style={styles.modalDetails}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Monto</Text>
                <Text style={styles.modalDetailValue}>${selectedAmount}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Cuota quincenal</Text>
                <Text style={styles.modalDetailValue}>
                  ${Math.round((selectedAmount * 1.08) / prestamoConfig.plazoQuincenas)}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Total a pagar</Text>
                <Text style={styles.modalDetailValue}>
                  ${Math.round(selectedAmount * 1.08)}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Plazo</Text>
                <Text style={styles.modalDetailValue}>
                  {prestamoConfig.plazoQuincenas} quincenas
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmarPrestamo}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE POLÍTICA DE PRIVACIDAD */}
      <Modal
        visible={showPrivacyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.privacyModalContent}>
            <View style={styles.privacyIconContainer}>
              <Ionicons name="shield-checkmark" size={60} color="#FF6B35" />
            </View>
            
            <Text style={styles.privacyTitle}>
              Política de Privacidad
            </Text>
            
            <Text style={styles.privacySubtitle}>
              Antes de solicitar tu préstamo, es importante que conozcas cómo manejamos tus datos.
            </Text>
            
            <View style={styles.privacyList}>
              <View style={styles.privacyItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                <Text style={styles.privacyItemText}>
                  Tus datos están seguros y protegidos
                </Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                <Text style={styles.privacyItemText}>
                  Solo usamos tu información para procesar tu préstamo
                </Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                <Text style={styles.privacyItemText}>
                  No compartimos tus datos con terceros sin tu consentimiento
                </Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                <Text style={styles.privacyItemText}>
                  Puedes solicitar la eliminación de tus datos en cualquier momento
                </Text>
              </View>
            </View>
            
            <Text style={styles.privacyNote}>
              Al aceptar, confirmas que has leído y aceptas nuestra política de privacidad.
            </Text>
            
            <View style={styles.privacyButtons}>
              <TouchableOpacity
                style={[styles.privacyButton, styles.privacyButtonReject]}
                onPress={handleRejectPrivacy}
              >
                <Text style={styles.privacyButtonTextReject}>Rechazar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.privacyButton, styles.privacyButtonAccept]}
                onPress={handleAcceptPrivacy}
              >
                <Text style={styles.privacyButtonTextAccept}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <Image
              source={IMAGES.money}
              style={styles.successImage}
            />
            <View style={styles.successIconOverlay}>
              <Ionicons name="checkmark-circle" size={60} color="#4ADE80" />
            </View>
            <Text style={styles.successTitle}>¡Préstamo Aprobado!</Text>
            <Text style={styles.successSubtitle}>
              ${selectedAmount} disponibles en tu cuenta
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================
// ESTILOS (igual que antes, no cambian)
// ============================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0A12' 
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mainBanner: {
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 12,
  },
  bannerImageStyle: {
    borderRadius: 24,
  },
  bannerOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  bannerContent: {
    alignItems: 'center',
  },
  preapproveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  preapproveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  amountSymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginRight: 4,
  },
  amountNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  quickInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'center',
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  rotatingBanner: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 140,
    position: 'relative',
    backgroundColor: '#1A1A26',
  },
  rotatingImage: {
    width: '100%',
    height: '100%',
  },
  rotatingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    justifyContent: 'flex-end',
  },
  rotatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rotatingEmoji: {
    fontSize: 34,
    width: 44,
    textAlign: 'center',
  },
  rotatingText: {
    flex: 1,
  },
  rotatingTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rotatingDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rotatingDots: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  rotatingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  rotatingDotActive: {
    width: 24,
    backgroundColor: '#FF6B35',
  },
  passarelaContainer: {
    marginTop: 16,
    height: 180,
    position: 'relative',
  },
  passarelaSlide: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  passarelaImage: {
    width: '100%',
    height: '100%',
  },
  passarelaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: 'flex-end',
  },
  passarelaContent: {
    alignItems: 'flex-start',
  },
  passarelaEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  passarelaTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  passarelaSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  passarelaDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    right: 16,
    gap: 6,
  },
  passarelaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  passarelaDotActive: {
    width: 24,
    backgroundColor: '#FF6B35',
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  profileStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  profileStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileStatText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  howItWorks: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  stepsContainer: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  stepLine: {
    height: 20,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 23,
  },
  reasonsContainer: {
    marginTop: 20,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reasonCard: {
    flex: 1,
    minWidth: (width - 50) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  reasonIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  reasonCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  reasonCardDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  simulatorContainer: {
    marginTop: 20,
  },
  simulatorCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  simulatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  simulatorLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  simulatorValue: {
    color: '#FF6B35',
    fontSize: 24,
    fontWeight: '800',
  },
  simulatorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  simulatorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  simulatorSlider: {
    flex: 1,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
  },
  simulatorDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
  },
  simulatorDetailItem: {
    alignItems: 'center',
    gap: 2,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  detailValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  detailDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  testimonialCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  testimonialAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  testimonialRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  testimonialRole: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  testimonialText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonSpacer: {
    height: 24,
  },
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  solicitarButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerNote: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A26',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  modalIconOverlay: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#0A0A12',
    borderRadius: 20,
    padding: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDetails: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  modalDetailLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  modalDetailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modalButtonConfirm: {
    backgroundColor: '#FF6B35',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    position: 'relative',
  },
  successImage: {
    width: 150,
    height: 150,
    borderRadius: 100,
  },
  successIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0A0A12',
    borderRadius: 30,
    padding: 8,
  },
  successTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 4,
  },
  testimoniosContainer: {
    marginTop: 20,
  },
  testimoniosScrollContent: {
    gap: 16,
  },
  testimonioCard: {
    width: width - 40,
    marginHorizontal: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    minHeight: 200,
  },
  testimonioEmoji: {
    fontSize: 28,
    position: 'absolute',
    top: 12,
    right: 16,
  },
  testimonioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  testimonioAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  testimonioInfo: {
    flex: 1,
  },
  testimonioNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  testimonioRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  testimonioRol: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  testimonioTexto: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    fontStyle: 'italic',
    marginTop: 4,
    paddingRight: 20,
  },
  testimonioQuoteIcon: {
    position: 'absolute',
    bottom: 12,
    right: 16,
  },
  testimoniosDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  testimoniosDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  testimoniosDotActive: {
    width: 24,
    backgroundColor: '#FF6B35',
  },
  privacyModalContent: {
    backgroundColor: '#1A1A26',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  privacyIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  privacySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  privacyList: {
    gap: 12,
    marginBottom: 20,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyItemText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  privacyNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  privacyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  privacyButtonReject: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  privacyButtonAccept: {
    backgroundColor: '#FF6B35',
  },
  privacyButtonTextReject: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyButtonTextAccept: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});