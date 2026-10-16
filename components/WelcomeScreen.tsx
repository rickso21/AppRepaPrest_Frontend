import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { JSX, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

const backgroundImage = require("../assets/images/photo-1519501025264-65ba15a82390.jpg");

type Feature = {
  icon: string;
  color: string;
  title: string;
  desc: string;
};

const FEATURES: Feature[] = [
  {
    icon: "locate",
    color: "#1fd125",
    title: "Monitoreo GPS",
    desc: "Seguimiento en tiempo real",
  },
  {
    icon: "cash-outline",
    color: "#ef9905",
    title: "Préstamos al momento",
    desc: "Solicita tu primer préstamo",
  },
  {
    icon: "people",
    color: "#ff6932",
    title: "Red Social",
    desc: "Protección y comunidad",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}): JSX.Element {
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 500,
      delay: 250 + index * 120,
      useNativeDriver: true,
    }).start();
  }, [appear, index]);

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            translateX: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.featureItem}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: feature.color + "26" },
          ]}
        >
          <Ionicons
            name={feature.icon as any}
            size={24}
            color={feature.color}
          />
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureText}>{feature.title}</Text>
          <Text style={styles.featureDesc}>{feature.desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

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

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.008,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [fade, slide, buttonPulse]);

  const onPressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.scrim} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.overlay,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/images/123.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Delivery Sobre Ruedas</Text>
            <Text style={styles.subtitle}>Herramientas a tu medida</Text>
          </View>

          <View style={styles.featuresWrap}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </View>

          <Animated.View
            style={{
              transform: [
                { scale: Animated.multiply(buttonScale, buttonPulse) },
              ],
              width: "100%",
            }}
          >
            <Pressable
              style={styles.button}
              onPress={() => router.push("/login")}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <Text style={styles.buttonText}>EMPEZAR</Text>
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            </Pressable>
          </Animated.View>

          <Text style={styles.version}>Beta v1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },

  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 10, 20, 0.75)",
  },

  safeArea: { flex: 1, backgroundColor: "transparent" },

  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
    paddingHorizontal: 28,
    paddingVertical: Platform.OS === "ios" ? 50 : 36,
    alignItems: "center",
  },

  overlay: {
    flex: 1,
    width: "100%",
    maxWidth: 500,
    justifyContent: "space-between",
    paddingBottom: 70,
  },

  header: {
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },

  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#940000",
    shadowColor: "#940000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  //940000
  logoImage: {
    width: "88%",
    height: "88%",
    borderRadius: 68,
  },

  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 20,
    letterSpacing: 1,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    letterSpacing: 0.5,
    fontWeight: "400",
    textAlign: "center",
  },

  // ─────────────────────────────────────────────
  // ✅ TARJETAS ESTILO FORMULARIO BLANCO
  // ─────────────────────────────────────────────
  featuresWrap: {
    width: "100%",
    marginVertical: 24,
    gap: 12,
    // ❌ Sin backgroundColor: "#f5f5f5"
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#ffffff", // ✅ fondo blanco
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)", // ✅ borde sutil
    width: "100%",
    shadowColor: "#000", // ✅ sombra suave
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },

  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    flexShrink: 0,
    backgroundColor: "#f2f2f7", // ✅ gris claro sutil
  },

  featureContent: {
    flex: 1, // ✅ ocupa el espacio restante
    justifyContent: "center",
    alignItems: "flex-start", // ✅ texto a la izquierda
  },

  featureText: {
    color: "#1a1a2e", // ✅ texto oscuro
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  featureDesc: {
    color: "#6b6b80", // ✅ gris oscuro
    fontSize: 12,
    marginTop: 3,
  },

  // ─────────────────────────────────────────────
  // BOTÓN Y VERSIÓN
  // ─────────────────────────────────────────────
  button: {
    backgroundColor: "#c91111",
    paddingVertical: 20,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#c91111",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 9,
    elevation: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 10,
    letterSpacing: 2,
  },

  version: {
    color: "rgba(255, 255, 255, 0.41)",
    textAlign: "center",
    fontSize: 11,
    marginTop: 20,
    letterSpacing: 1,
    width: "100%",
  },
});
