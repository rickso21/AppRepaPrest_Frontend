import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CARD = "#1A1A24";
const BORDER = "rgba(255,255,255,0.07)";

export type LinkTipo =
  | "youtube"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "vimeo"
  | "spotify"
  | "linkedin"
  | "whatsapp";

type Props = {
  tipo: LinkTipo;
  url: string;
};

// Configuración visual por tipo de link
const LINK_CONFIG: Record<
  LinkTipo,
  { icon: string; color: string; label: string }
> = {
  youtube: { icon: "logo-youtube", color: "#FF0000", label: "YouTube" },
  facebook: { icon: "logo-facebook", color: "#1877F2", label: "Facebook" },
  instagram: { icon: "logo-instagram", color: "#E4405F", label: "Instagram" },
  tiktok: { icon: "logo-tiktok", color: "#FFFFFF", label: "TikTok" },
  twitter: { icon: "logo-twitter", color: "#1DA1F2", label: "Twitter" },
  vimeo: { icon: "logo-vimeo", color: "#1AB7EA", label: "Vimeo" },
  spotify: { icon: "musical-notes", color: "#1DB954", label: "Spotify" },
  linkedin: { icon: "logo-linkedin", color: "#0A66C2", label: "LinkedIn" },
  whatsapp: { icon: "logo-whatsapp", color: "#25D366", label: "WhatsApp" },
};

// Extrae el ID de video de YouTube
function getYoutubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export default function LinkPreview({ tipo, url }: Props) {
  const config = LINK_CONFIG[tipo];
  if (!config) return null;

  // Miniatura especial para YouTube
  const youtubeId = tipo === "youtube" ? getYoutubeId(url) : null;
  const thumbnailUrl = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : null;

  const handlePress = () => {
    Linking.openURL(url).catch(() => {});
  };

  // Dominio limpio para mostrar
  const dominio = url
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace("www.", "");

  // ── Preview con miniatura (solo YouTube) ──
  if (thumbnailUrl) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.cardMedia,
          pressed && { opacity: 0.85 },
        ]}
        onPress={handlePress}
      >
        <View style={styles.thumbWrap}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={22} color="#fff" />
            </View>
          </View>
          <View style={styles.badgeOverlay}>
            <Ionicons name="logo-youtube" size={14} color="#FF0000" />
            <Text style={styles.badgeText}>YouTube</Text>
          </View>
        </View>
        <Text style={styles.urlBelow} numberOfLines={1}>
          {dominio}
        </Text>
      </Pressable>
    );
  }

  // ── Preview simple (otros servicios) ──
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={handlePress}
    >
      <View style={[styles.iconWrap, { backgroundColor: config.color + "22" }]}>
        <Ionicons name={config.icon as any} size={22} color={config.color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{config.label}</Text>
        <Text style={styles.url} numberOfLines={1}>
          {dominio}
        </Text>
      </View>

      <Ionicons name="open-outline" size={18} color="#6B7280" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ── Card simple (otros servicios) ──
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  url: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },

  // ── Card con miniatura (YouTube) ──
  cardMedia: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  thumbWrap: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    paddingLeft: 4,
  },
  badgeOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  urlBelow: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    padding: 10,
  },
});
