import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { JSX, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

// Detecta pantallas chicas para ajustar tamaños
const isSmallScreen = height < 700;

const topImage = require("../assets/images/12345.jpg");

type Rol = "asociado" | "administrador";

export default function RoleSelectionScreen(): JSX.Element {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Rol | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, slide, pulse]);

  const elegirRol = (rol: Rol) => {
    setSeleccion(rol);
    setTimeout(() => {
      if (rol === "administrador") {
        router.push("/register-agrupacion");
      } else {
        router.push({ pathname: "/register", params: { rol } });
      }
    }, 250);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          {/* Imagen superior con overlay */}
          <View style={styles.topImageWrapper}>
            <Image
              source={topImage}
              style={styles.topImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
          </View>

          {/* Texto principal */}
          <View style={styles.textBlock}>
            <Text style={styles.titleAccent}>¿Quieres registrarte?</Text>
            <Text style={styles.subtitle}>Elige tu rol para continuar:</Text>
          </View>

          {/* Dos tarjetas de selección */}
          <View style={styles.cardsRow}>
            {/* Asociado — con latido */}
            <Animated.View style={{ flex: 1, transform: [{ scale: pulse }] }}>
              <Pressable
                style={[
                  styles.card,
                  seleccion === "asociado" && styles.cardSelected,
                ]}
                onPress={() => elegirRol("asociado")}
              >
                <View
                  style={[
                    styles.cardIconCircle,
                    { backgroundColor: "rgba(255,107,53,0.15)" },
                  ]}
                >
                  <Ionicons
                    name="bicycle"
                    size={isSmallScreen ? 28 : 34}
                    color="#f84807"
                  />
                </View>
                <Text style={styles.cardTitle}>Soy Delivery</Text>
                <Text style={styles.cardDesc}>Repartidor / Chofer</Text>
                <Text style={styles.cardDetail}>
                  Regístrate y comienza tu aventura
                </Text>
              </Pressable>
            </Animated.View>

            {/* Administrador — sin latido */}
            <View style={{ flex: 1 }}>
              <Pressable
                style={[
                  styles.card,
                  seleccion === "administrador" && styles.cardSelected,
                ]}
                onPress={() => elegirRol("administrador")}
              >
                <View
                  style={[
                    styles.cardIconCircle,
                    { backgroundColor: "rgba(33,150,243,0.15)" },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={isSmallScreen ? 28 : 34}
                    color="#2196F3"
                  />
                </View>
                <Text style={styles.cardTitle}>Soy Administrador</Text>
                <Text style={styles.cardDesc}>Dueño de agrupación</Text>
                <Text style={styles.cardDetail}>
                  Registra tu agrupación y gestiona
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Volver al login */}
          <Pressable
            style={styles.loginContainer}
            onPress={() => router.push("/login")}
            hitSlop={8}
          >
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F17" },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },

  content: {
    flex: 1,
    justifyContent: "space-between", // 👈 distribuye el espacio
  },

  topImageWrapper: {
    width: "100%",
    // 👇 Se adapta: 28% en pantallas chicas, 32% en grandes
    height: isSmallScreen ? height * 0.26 : height * 0.32,
    maxHeight: 280,
    position: "relative",
  },
  topImage: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,15,23,0.35)",
  },

  textBlock: {
    paddingHorizontal: 24,
    marginTop: isSmallScreen ? 12 : 18,
    marginBottom: isSmallScreen ? 12 : 18,
  },
  titleAccent: {
    fontSize: isSmallScreen ? 26 : 30,
    fontWeight: "800",
    color: "#940000",
  },
  subtitle: {
    fontSize: 13,
    color: "#fff",
    marginTop: 4,
    fontWeight: "400",
  },

  cardsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    alignItems: "stretch",
  },
  card: {
    flex: 1,
    backgroundColor: "#1C1C28",
    borderRadius: 18,
    paddingVertical: isSmallScreen ? 18 : 24,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "flex-start",
  },
  cardSelected: {
    borderColor: "#940000",
    backgroundColor: "rgba(255,107,53,0.08)",
  },
  cardIconCircle: {
    width: isSmallScreen ? 50 : 58,
    height: isSmallScreen ? 50 : 58,
    borderRadius: isSmallScreen ? 25 : 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: isSmallScreen ? 10 : 12,
  },
  cardTitle: {
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  cardDesc: {
    fontSize: isSmallScreen ? 11 : 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 3,
    textAlign: "center",
  },
  cardDetail: {
    fontSize: isSmallScreen ? 9 : 10,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    marginTop: 5,
    lineHeight: isSmallScreen ? 12 : 14,
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: isSmallScreen ? 16 : 22,
    marginBottom: isSmallScreen ? 12 : 20,
    paddingHorizontal: 24,
  },
  loginText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  loginLink: { color: "#940000", fontSize: 14, fontWeight: "700" },
});
