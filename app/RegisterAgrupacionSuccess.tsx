import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { JSX, useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const backgroundImage = require("../assets/images/photo-1519501025264-65ba15a82390.jpg");

export default function RegisterAgrupacionSuccessScreen(): JSX.Element {
  const router = useRouter();
  const { agrupacion, codigo } = useLocalSearchParams<{
    agrupacion?: string;
    codigo?: string;
  }>();

  const [copiado, setCopiado] = useState<boolean>(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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
  }, [fade, slide]);

  const onPressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const copiarCodigo = async () => {
    if (!codigo) return;
    await Clipboard.setStringAsync(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  const handleFinalizar = () => {
    router.replace("/login");
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.scrim} />

      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Animated.View
          style={[
            styles.content,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          </View>

          <Text style={styles.title}>Agrupación creada correctamente</Text>
          <Text style={styles.warning}>
            Pronto nos contactaremos contigo para validar tu cuenta
          </Text>

          {agrupacion && (
            <Text style={styles.agrupacionName}>"{agrupacion}"</Text>
          )}

          <Text style={styles.codeLabel}>CÓDIGO DE INVITACIÓN</Text>

          <Pressable style={styles.couponBox} onPress={copiarCodigo}>
            <View style={styles.couponNotchLeft} />
            <Text style={styles.couponCode}>{codigo ?? "—"}</Text>
            <View style={styles.couponNotchRight} />
          </Pressable>

          <Text style={styles.copiedHint}>
            {copiado ? "Código copiado" : "Toca el código para copiarlo"}
          </Text>

          <Text style={styles.shareText}>
            Compártela con tu agrupación para que se registren
          </Text>

          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
              width: "100%",
              marginTop: 8,
            }}
          >
            <Pressable
              style={styles.finishButton}
              onPress={handleFinalizar}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <Text style={styles.finishButtonText}>FINALIZAR</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 10, 20, 0.55)",
  },
  container: { flex: 1, backgroundColor: "transparent" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 22,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  warning: {
    fontSize: 12.5,
    color: "#ff3535",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  agrupacionName: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    marginTop: 22,
    textAlign: "center",
  },
  codeLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 22,
    marginBottom: 10,
  },
  couponBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "#ff3535",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 26,
    minWidth: "80%",
  },
  couponNotchLeft: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0F0F17",
    position: "absolute",
    left: -6,
  },
  couponNotchRight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0F0F17",
    position: "absolute",
    right: -6,
  },
  couponCode: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ff3535",
    letterSpacing: 2,
  },
  copiedHint: { fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 9 },
  shareText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 26,
    marginBottom: 28,
    lineHeight: 19,
  },
  finishButton: {
    backgroundColor: "#ff3535",
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#ff3535",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
});
