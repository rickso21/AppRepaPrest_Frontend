import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { JSX, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { authService } from "@/services/auth/AuthService";
import type { DesglosePago } from "../../services/prestamos/PrestamoService";
import { PrestamoService } from "../../services/prestamos/PrestamoService";
import type { MontoSugerido } from "../../services/prestamos/prestamoValidator";
import DesglosePagosView from "./desglosePagosView";
import MontoSelector from "./montoSelector";
import PlazoSelector from "./plazoSelector";
import SolicitudEnviadaView from "./SolicitudEnviadaView";

const { width } = Dimensions.get("window");

const IMAGES = {
  bannerMain: require("../../assets/images/ayuda.webp"),
  maintenance: require("../../assets/images/download.jpg"),
  safety: require("../../assets/images/security.webp"),
  happy: require("../../assets/images/crecimiento.webp"),
  success: require("../../assets/images/123.png"),
  money: require("../../assets/images/123.png"),
};

const AVATARS = {
  carlos:
    "https://ui-avatars.com/api/?name=Carlos&size=300&background=FF6B35&color=fff&bold=true",
  miguel:
    "https://ui-avatars.com/api/?name=Miguel&size=300&background=4ADE80&color=fff&bold=true",
  ana: "https://ui-avatars.com/api/?name=Ana&size=300&background=60A5FA&color=fff&bold=true",
  juan: "https://ui-avatars.com/api/?name=Juan&size=300&background=FFD93D&color=fff&bold=true",
};

const generarAvatar = (nombre: string): string =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    nombre,
  )}&size=300&background=FF6B35&color=fff&bold=true`;

const testimonios = [
  {
    id: 1,
    nombre: "Miguel Rodríguez",
    avatar: AVATARS.miguel,
    rating: 5,
    rol: "Repartidor desde 2024",
    comentario:
      "Me cuida, me apoya y me presta. Estoy totalmente satisfecho con los servicios que ofrece. ¡Fue la mejor decisión!",
    emoji: "🌟",
  },
  {
    id: 2,
    nombre: "Ana Martínez",
    avatar: AVATARS.ana,
    rating: 5,
    rol: "Repartidora desde 2023",
    comentario:
      "La app es increíble, los préstamos son rápidos y sin complicaciones. Me han sacado de apuros.",
    emoji: "💪",
  },
  {
    id: 3,
    nombre: "Juan Pérez",
    avatar: AVATARS.juan,
    rating: 4,
    rol: "Repartidor desde 2025",
    comentario:
      "Excelente servicio, el dinero llega rápido y las cuotas son muy accesibles. 100% recomendado para repartidores.",
    emoji: "🚀",
  },
];

type Props = {
  lineaCredito: {
    id: number;
    montoAprobado: number;
    montoDisponible: number;
    montosSugeridos: MontoSugerido[];
    plazosDisponibles: number[];
    tienePrestamosPagados: boolean;
    incrementoPendiente: boolean;
    esNuevoUsuario: boolean;
  };
  onRefresh?: (opts?: { silencioso?: boolean }) => void | Promise<void>;
};

export default function PrestamosSolicitudView({
  lineaCredito,
  onRefresh,
}: Props): JSX.Element {
  const esNuevoUsuario = lineaCredito.esNuevoUsuario;

  // ========== ESTADOS DE SOLICITUD ==========
  const [montoSeleccionado, setMontoSeleccionado] =
    useState<MontoSugerido | null>(null);
  const [plazoSeleccionado, setPlazoSeleccionado] = useState<1 | 2 | null>(
    null,
  );
  const [simulacion, setSimulacion] = useState<{
    pagoQuincenal: number;
    montoTotal: number;
    desglose: DesglosePago[];
  } | null>(null);
  const [loadingSimulacion, setLoadingSimulacion] = useState(false);
  const [loadingCrear, setLoadingCrear] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [solicitudEnviada, setSolicitudEnviada] = useState<{
    folio: string;
    montoSolicitado: number;
    pagoQuincenal: number;
    numeroPagos: number;
  } | null>(null);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentTestimonioIndex, setCurrentTestimonioIndex] = useState(0);

  const [repartidor, setRepartidor] = useState({
    nombre: "",
    apellidos: "",
    entregasHoy: 0,
    reputacion: 0,
    nivelesCompletados: 0,
    avatar: AVATARS.carlos,
  });
  const [loadingUsuario, setLoadingUsuario] = useState(true);

  useEffect(() => {
    let mounted = true;

    const cargarUsuario = async () => {
      try {
        const user = await authService.getUserData();
        if (!mounted || !user) return;

        const nombrePuro = user.nombre?.split(" ")[0] ?? "Usuario";
        const apellidos = [user.apellido_p, user.apellido_m]
          .filter(Boolean)
          .join(" ");
        const nombreCompleto = apellidos
          ? `${nombrePuro} ${apellidos}`.trim()
          : nombrePuro;

        setRepartidor({
          nombre: nombrePuro,
          apellidos,
          entregasHoy: 8,
          reputacion: 4.8,
          nivelesCompletados: 5,
          avatar: generarAvatar(nombreCompleto),
        });
      } catch (error) {
      } finally {
        if (mounted) setLoadingUsuario(false);
      }
    };
    cargarUsuario();

    return () => {
      mounted = false;
    };
  }, []);

  const banners = [
    {
      id: 1,
      title: "¡Tu moto te necesita!",
      description: "Mantenimiento preventivo",
      image: IMAGES.maintenance,
      emoji: "🛵",
    },
    {
      id: 2,
      title: "Equipo de seguridad",
      description: "Invierte en tu protección",
      image: IMAGES.safety,
      emoji: "🛡️",
    },
    {
      id: 3,
      title: "Crecimiento profesional",
      description: "Más herramientas, más pedidos",
      image: IMAGES.happy,
      emoji: "📈",
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentTestimonioIndex + 1) % testimonios.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (width - 60),
        animated: true,
      });
      setCurrentTestimonioIndex(nextIndex);
    }, 8000);

    return () => clearInterval(interval);
  }, [currentTestimonioIndex]);

  useEffect(() => {
    if (!montoSeleccionado || !plazoSeleccionado) {
      setSimulacion(null);
      return;
    }

    let mounted = true;
    setLoadingSimulacion(true);

    PrestamoService.simular(montoSeleccionado.monto, plazoSeleccionado)
      .then((res) => {
        if (mounted && res.success) {
          setSimulacion({
            pagoQuincenal: res.data.pago_por_quincena,
            montoTotal: res.data.monto_total_pagar,
            desglose: res.data.desglose_pagos,
          });
        }
      })
      .catch(() => {
        Alert.alert("Error", "No se pudo calcular la simulación");
      })
      .finally(() => {
        if (mounted) setLoadingSimulacion(false);
      });

    return () => {
      mounted = false;
    };
  }, [montoSeleccionado, plazoSeleccionado]);

  // ========== CREAR PRÉSTAMO ==========
  const handleCrearPrestamo = async () => {
    if (!montoSeleccionado || !plazoSeleccionado) return;

    setLoadingCrear(true);
    setShowConfirmModal(false);

    try {
      const res = await PrestamoService.crear(
        montoSeleccionado.monto,
        plazoSeleccionado,
      );

      if (res.success) {
        setSolicitudEnviada({
          folio: res.data.prestamo.folio,
          montoSolicitado: res.data.prestamo.monto_solicitado,
          pagoQuincenal: res.data.prestamo.pago_quincenal,
          numeroPagos: res.data.prestamo.numero_pagos,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.msg || "Error al crear la solicitud";
      Alert.alert("Error", msg);
    } finally {
      setLoadingCrear(false);
    }
  };

  const canSubmit =
    montoSeleccionado !== null &&
    plazoSeleccionado !== null &&
    simulacion !== null &&
    !loadingSimulacion;

  // ============================================================
  // Si la solicitud fue enviada → mostrar pantalla de seguimiento
  // ============================================================
  if (solicitudEnviada) {
    return (
      <SolicitudEnviadaView
        folio={solicitudEnviada.folio}
        montoSolicitado={solicitudEnviada.montoSolicitado}
        pagoQuincenal={solicitudEnviada.pagoQuincenal}
        numeroPagos={solicitudEnviada.numeroPagos}
        onRefresh={onRefresh}
      />
    );
  }

  const nombreMostrar = loadingUsuario
    ? "Cargando..."
    : repartidor.nombre || "Usuario";

  const nombreCompleto = repartidor.apellidos
    ? `${repartidor.nombre} ${repartidor.apellidos}`
    : repartidor.nombre || "Usuario";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== BANNER PRINCIPAL ========== */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <ImageBackground
            source={IMAGES.bannerMain}
            style={styles.mainBanner}
            imageStyle={styles.bannerImageStyle}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.7)", "rgba(255,107,53,0.3)"]}
              style={styles.bannerOverlay}
            >
              <View style={styles.bannerContent}>
                <View style={styles.preapproveBadge}>
                  <Ionicons
                    name={esNuevoUsuario ? "sparkles" : "checkmark-circle"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.preapproveText}>
                    {esNuevoUsuario
                      ? "PRIMER PRÉSTAMO"
                      : lineaCredito.tienePrestamosPagados
                        ? "LÍNEA ACTUALIZADA"
                        : "PREAPROBADO"}
                  </Text>
                </View>

                <Text style={styles.bannerTitle}>
                  {esNuevoUsuario
                    ? "¡Bienvenido! Empieza hoy"
                    : "¡Tu préstamo te espera!"}
                </Text>

                <View style={styles.amountDisplay}>
                  <Text style={styles.amountSymbol}>$</Text>
                  <Text style={styles.amountNumber}>
                    {lineaCredito.montoDisponible.toLocaleString()}
                  </Text>
                </View>

                <Text style={styles.amountLabel}>
                  {`${nombreMostrar}, ${
                    esNuevoUsuario
                      ? "tienes tu primer monto disponible"
                      : "tienes un monto disponible"
                  }`}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* ========== PERFIL ========== */}
        <Animated.View style={[styles.profileCard, { opacity: fadeAnim }]}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: repartidor.avatar }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{nombreCompleto}</Text>
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Ionicons name="star" size={14} color="#FFD93D" />
                  <Text style={styles.profileStatText}>
                    {repartidor.reputacion}
                  </Text>
                </View>
                <View style={styles.profileStat}>
                  <Ionicons name="bicycle" size={14} color="#FF6B35" />
                  <Text style={styles.profileStatText}>
                    {repartidor.entregasHoy} hoy
                  </Text>
                </View>
                <View style={styles.profileStat}>
                  <Ionicons name="trophy" size={14} color="#4ADE80" />
                  <Text style={styles.profileStatText}>
                    {repartidor.nivelesCompletados} niveles
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ========== BANNER ROTATIVO ========== */}
        <Animated.View style={[styles.rotatingBanner, { opacity: fadeAnim }]}>
          <Image
            source={banners[currentBannerIndex].image}
            style={styles.rotatingImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
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
                  currentBannerIndex === index && styles.rotatingDotActive,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* ========== CÓMO FUNCIONA ========== */}
        <Animated.View style={[styles.howItWorks, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>📱 ¿Cómo funciona?</Text>

          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: "rgba(255,107,53,0.15)" },
                ]}
              >
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
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: "rgba(74,222,128,0.15)" },
                ]}
              >
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
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: "rgba(96,165,250,0.15)" },
                ]}
              >
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

        {/* ========== RAZONES ========== */}
        <Animated.View style={[styles.reasonsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>¿Para qué usar tu préstamo?</Text>

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
              <View
                style={[
                  styles.reasonIconContainer,
                  { backgroundColor: "rgba(74,222,128,0.15)" },
                ]}
              >
                <Ionicons name="shield-outline" size={28} color="#4ADE80" />
              </View>
              <Text style={styles.reasonCardTitle}>Equipo seguro</Text>
              <Text style={styles.reasonCardDesc}>Invierte en protección</Text>
            </View>

            <View style={styles.reasonCard}>
              <View
                style={[
                  styles.reasonIconContainer,
                  { backgroundColor: "rgba(96,165,250,0.15)" },
                ]}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={28}
                  color="#60A5FA"
                />
              </View>
              <Text style={styles.reasonCardTitle}>Crecer</Text>
              <Text style={styles.reasonCardDesc}>Más herramientas</Text>
            </View>

            <View style={styles.reasonCard}>
              <View
                style={[
                  styles.reasonIconContainer,
                  { backgroundColor: "rgba(255,217,61,0.15)" },
                ]}
              >
                <Ionicons name="home-outline" size={28} color="#FFD93D" />
              </View>
              <Text style={styles.reasonCardTitle}>Emergencias</Text>
              <Text style={styles.reasonCardDesc}>Imprevistos de la vida</Text>
            </View>
          </View>
        </Animated.View>

        {/* SECCIÓN DE SOLICITUD */}
        <View style={styles.solicitudSection}>
          <View style={styles.solicitudHeader}>
            <Ionicons name="flash" size={20} color="#FF6B35" />
            <Text style={styles.solicitudTitle}>Solicita tu préstamo</Text>
          </View>

          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Elige el monto</Text>
          </View>
          <MontoSelector
            montos={lineaCredito.montosSugeridos}
            montoSeleccionado={montoSeleccionado?.monto ?? null}
            esNuevoUsuario={esNuevoUsuario}
            onSelect={(monto) => {
              setMontoSeleccionado(monto);
              if (!monto.puede_2_quincenas && monto.puede_1_quincena) {
                setPlazoSeleccionado(1);
              } else if (!monto.puede_1_quincena && monto.puede_2_quincenas) {
                setPlazoSeleccionado(2);
              } else {
                setPlazoSeleccionado(null);
              }
            }}
          />

          {montoSeleccionado && (
            <>
              <View style={[styles.stepHeader, { marginTop: 20 }]}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepLabel}>Elige el plazo</Text>
              </View>
              <PlazoSelector
                plazosDisponibles={montoSeleccionado.plazos_disponibles}
                plazoSeleccionado={plazoSeleccionado}
                onSelect={setPlazoSeleccionado}
              />
            </>
          )}

          {loadingSimulacion && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#FF6B35" />
              <Text style={styles.loadingText}>Calculando...</Text>
            </View>
          )}

          {simulacion && !loadingSimulacion && (
            <>
              <View style={[styles.stepHeader, { marginTop: 20 }]}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepLabel}>Revisa el desglose</Text>
              </View>
              <DesglosePagosView
                desglose={simulacion.desglose}
                pagoQuincenal={simulacion.pagoQuincenal}
                montoTotal={simulacion.montoTotal}
              />
            </>
          )}
        </View>

        {/* ========== TESTIMONIOS ========== */}
        <Animated.View
          style={[styles.testimoniosContainer, { opacity: fadeAnim }]}
        >
          <Text style={styles.sectionTitle}>⭐ Opiniones de repartidores</Text>

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
              <View
                key={item.id}
                style={[styles.testimonioCard, { width: width - 60 }]}
              >
                <Text style={styles.testimonioEmoji}>{item.emoji}</Text>

                <View style={styles.testimonioHeader}>
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.testimonioAvatar}
                  />
                  <View style={styles.testimonioInfo}>
                    <Text style={styles.testimonioNombre}>{item.nombre}</Text>
                    <View style={styles.testimonioRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= item.rating ? "star" : "star-outline"}
                          size={14}
                          color={
                            star <= item.rating
                              ? "#FFD93D"
                              : "rgba(255,255,255,0.2)"
                          }
                        />
                      ))}
                    </View>
                    <Text style={styles.testimonioRol}>{item.rol}</Text>
                  </View>
                </View>

                <Text style={styles.testimonioTexto}>"{item.comentario}"</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.testimoniosDots}>
            {testimonios.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.testimoniosDot,
                  currentTestimonioIndex === index &&
                    styles.testimoniosDotActive,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* ========== BOTÓN SOLICITAR ========== */}
        {canSubmit && (
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              onPress={() => setShowConfirmModal(true)}
              activeOpacity={0.85}
              disabled={loadingCrear}
            >
              <LinearGradient
                colors={["#FF6B35", "#E8552E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loadingCrear ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>SOLICITAR AHORA</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footerNote}>
          {esNuevoUsuario
            ? "🔒 Tu primer préstamo sin aval ni historial"
            : "🔒 Sin aval • Sin historial crediticio"}
        </Text>
      </ScrollView>

      {/* ========== MODAL DE CONFIRMACIÓN ========== */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="shield-checkmark" size={50} color="#FF6B35" />
            </View>
            <Text style={styles.modalTitle}>
              {esNuevoUsuario
                ? "¡Confirma tu primer préstamo!"
                : "Confirmar solicitud"}
            </Text>
            <Text style={styles.modalSubtitle}>
              Vas a solicitar ${montoSeleccionado?.monto} a {plazoSeleccionado}{" "}
              {plazoSeleccionado === 1 ? "quincena" : "quincenas"}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCrearPrestamo}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextConfirm,
                  ]}
                >
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A12" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  mainBanner: {
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 12,
  },
  bannerImageStyle: { borderRadius: 24 },
  bannerOverlay: { flex: 1, padding: 24, justifyContent: "center" },
  bannerContent: { alignItems: "center" },
  preapproveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  preapproveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  amountDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  amountSymbol: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginRight: 4,
  },
  amountNumber: { fontSize: 48, fontWeight: "900", color: "#fff" },
  amountLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },

  profileCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  profileContainer: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: "#fff" },
  profileStats: { flexDirection: "row", gap: 12, marginTop: 4 },
  profileStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  profileStatText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },

  rotatingBanner: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: 140,
    position: "relative",
    backgroundColor: "#1A1A26",
  },
  rotatingImage: { width: "100%", height: "100%" },
  rotatingOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    justifyContent: "flex-end",
  },
  rotatingContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  rotatingEmoji: { fontSize: 34, width: 44, textAlign: "center" },
  rotatingText: { flex: 1 },
  rotatingTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rotatingDescription: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rotatingDots: {
    position: "absolute",
    bottom: 12,
    right: 16,
    flexDirection: "row",
    gap: 6,
  },
  rotatingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  rotatingDotActive: { width: 24, backgroundColor: "#FF6B35" },

  howItWorks: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  stepsContainer: { gap: 8 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stepContent: { flex: 1 },
  stepTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  stepDesc: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  stepLine: {
    height: 20,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 23,
  },

  reasonsContainer: { marginTop: 20 },
  reasonsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reasonCard: {
    flex: 1,
    minWidth: (width - 50) / 2,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  reasonIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  reasonCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  reasonCardDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },

  solicitudSection: {
    marginTop: 24,
    backgroundColor: "rgba(255,107,53,0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.2)",
  },
  solicitudHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  solicitudTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,107,53,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: "#FF6B35", fontSize: 11, fontWeight: "800" },
  stepLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
    marginTop: 12,
  },
  loadingText: { color: "rgba(255,255,255,0.6)", fontSize: 13 },

  buttonWrapper: { marginTop: 24 },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  footerNote: {
    textAlign: "center",
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    marginTop: 24,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1A1A26",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalIconContainer: { alignItems: "center", marginBottom: 12 },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonCancel: { backgroundColor: "rgba(255,255,255,0.05)" },
  modalButtonConfirm: { backgroundColor: "#FF6B35" },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  modalButtonTextConfirm: { color: "#fff" },

  testimoniosContainer: { marginTop: 24 },
  testimoniosScrollContent: { gap: 16 },
  testimonioCard: {
    width: width - 60,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    position: "relative",
    minHeight: 200,
  },
  testimonioEmoji: {
    fontSize: 28,
    position: "absolute",
    top: 12,
    right: 16,
  },
  testimonioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  testimonioAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  testimonioInfo: { flex: 1 },
  testimonioNombre: { fontSize: 15, fontWeight: "700", color: "#fff" },
  testimonioRating: { flexDirection: "row", gap: 2, marginTop: 2 },
  testimonioRol: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 1,
  },
  testimonioTexto: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 22,
    fontStyle: "italic",
    marginTop: 4,
    paddingRight: 20,
  },
  testimoniosDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  testimoniosDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  testimoniosDotActive: { width: 24, backgroundColor: "#FF6B35" },
});
