import { Ionicons } from "@expo/vector-icons";
import {
    Alert,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { Ad } from "../../hooks/comunidad/useAds";

const BRAND = "#940000";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.07)";

type Props = {
  ad: Ad;
  onClicked?: (id: number) => void;
};

/**
 * Normaliza un número de teléfono para WhatsApp
 * - Si son 10 dígitos (México), agrega el prefijo 52
 * - Si ya tiene prefijo, lo deja
 */
function normalizarWhatsApp(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 10) return `52${clean}`;
  return clean;
}

export default function AdCard({ ad, onClicked }: Props) {
  const handlePress = async () => {
    // 1. Registrar el clic (no bloquea si falla)
    onClicked?.(ad.id);

    // 2. Determinar la URL de destino
    let url: string | null = null;

    if (ad.link_url && ad.link_url.trim()) {
      // Si es un link directo, usarlo tal cual
      url = ad.link_url.trim();
    } else if (ad.phone && ad.phone.trim()) {
      // Si solo hay teléfono, abrir WhatsApp con prefijo
      const numero = normalizarWhatsApp(ad.phone);
      url = `https://wa.me/${numero}`;
    }

    // 3. Si no hay nada, avisar
    if (!url) {
      Alert.alert(
        "Sin contacto",
        "Este anuncio no tiene forma de contacto configurada.",
      );
      return;
    }

    // 4. Verificar si el dispositivo puede abrir la URL
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "No disponible",
          "No se puede abrir este enlace en tu dispositivo.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch (e) {
      console.warn("[AdCard] error abriendo URL:", e);
      Alert.alert("Error", "No se pudo abrir el enlace.");
    }
  };

  // Texto del botón según lo que tenga el anuncio
  const ctaLabel =
    ad.cta_text && ad.cta_text.trim()
      ? ad.cta_text
      : ad.link_url
        ? "Ver más"
        : ad.phone
          ? "Contactar"
          : "Ver más";

  // Ícono según el tipo de acción
  const ctaIcon: any = ad.link_url
    ? "open-outline"
    : ad.phone
      ? "logo-whatsapp"
      : "arrow-forward";

  return (
    <View style={styles.card}>
      {/* ── Etiqueta "Patrocinado" ── */}
      <View style={styles.sponsoredRow}>
        <View style={styles.sponsoredBadge}>
          <Ionicons name="megaphone-outline" size={12} color={BRAND} />
          <Text style={styles.sponsoredText}>Patrocinado</Text>
        </View>
        <Text style={styles.merchantName} numberOfLines={1}>
          {ad.merchant?.nombre ?? ""}
        </Text>
      </View>

      {/* ── Imagen ── */}
      {ad.image_url && (
        <Image
          source={{ uri: ad.image_url }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      {/* ── Título + descripción ── */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {ad.title}
        </Text>
        {!!ad.description && (
          <Text style={styles.description} numberOfLines={2}>
            {ad.description}
          </Text>
        )}
      </View>

      {/* ── CTA ── */}
      <TouchableOpacity
        style={styles.cta}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>{ctaLabel}</Text>
        <Ionicons name={ctaIcon} size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sponsoredRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sponsoredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(255,107,53,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.35)",
  },
  sponsoredText: {
    color: BRAND,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  merchantName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    flex: 1,
  },
  media: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  body: { marginTop: 10, gap: 4 },
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  description: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BRAND,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});
