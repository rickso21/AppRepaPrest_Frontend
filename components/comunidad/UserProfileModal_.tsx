import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { userService, type PerfilPublico } from "@/services/user/userService";
import MediaViewerModal from "./MediaViewerModal";

const BRAND = "#FF6B35";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.07)";
const PORTADA_HEIGHT = 160;

type Props = {
  visible: boolean;
  userId: number | null;
  onClose: () => void;
};

export default function UserProfileModal({ visible, userId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);

  // ── Estado del visor fullscreen (interno de este modal) ──
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerTipo, setViewerTipo] = useState<"image" | "video" | null>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const abrirVisor = (uri: string, tipo: "image" | "video" = "image") => {
    setViewerTipo(tipo);
    setViewerUri(uri);
    setViewerVisible(true);
  };

  const cerrarVisor = () => {
    setViewerVisible(false);
    setViewerTipo(null);
    setViewerUri(null);
  };

  useEffect(() => {
    if (!visible || !userId) {
      setPerfil(null);
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      const data = await userService.getUserById(userId);
      if (!active) return;
      setPerfil(data);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [visible, userId]);

  const initials = (perfil?.nombre || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <Modal
        visible={visible && !viewerVisible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            {loading && (
              <View style={styles.center}>
                <ActivityIndicator color={BRAND} size="large" />
              </View>
            )}

            {!loading && !perfil && (
              <View style={styles.center}>
                <Ionicons
                  name="person-circle-outline"
                  size={48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.errorText}>
                  No se pudo cargar el perfil
                </Text>
              </View>
            )}

            {!loading && perfil && (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {/* ── Portada (tocable) ── */}
                <View style={styles.portadaWrapper}>
                  {perfil.portada_url ? (
                    <Pressable
                      onPress={() => abrirVisor(perfil.portada_url!, "image")}
                      style={styles.portadaPressable}
                    >
                      <Image
                        source={{ uri: perfil.portada_url }}
                        style={styles.portada}
                        resizeMode="cover"
                      />
                      <View style={styles.expandBadge}>
                        <Ionicons
                          name="expand-outline"
                          size={16}
                          color="#fff"
                        />
                      </View>
                    </Pressable>
                  ) : (
                    <View style={[styles.portada, styles.portadaPlaceholder]}>
                      <Ionicons
                        name="image-outline"
                        size={32}
                        color="rgba(255,255,255,0.3)"
                      />
                    </View>
                  )}

                  {/* Avatar (tocable) */}
                  <View style={styles.avatarWrapper}>
                    <Pressable
                      onPress={() => {
                        if (perfil.avatar_url)
                          abrirVisor(perfil.avatar_url, "image");
                      }}
                      disabled={!perfil.avatar_url}
                      style={styles.avatarContainer}
                    >
                      {perfil.avatar_url ? (
                        <Image
                          source={{ uri: perfil.avatar_url }}
                          style={styles.avatarImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.avatarText}>{initials}</Text>
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* ── Nombre + grupo ── */}
                <View style={styles.headerInfo}>
                  <Text style={styles.nombre} numberOfLines={2}>
                    {perfil.nombre || "Usuario"}
                  </Text>
                  {!!perfil.grupo && (
                    <Text style={styles.grupo}>{perfil.grupo}</Text>
                  )}
                </View>

                {/* ── Datos ── */}
                <View style={styles.infoSection}>
                  <InfoRow
                    icon="call-outline"
                    label="Teléfono"
                    value={perfil.telefono}
                  />
                  <InfoRow
                    icon="mail-outline"
                    label="Correo"
                    value={perfil.email}
                  />
                  <InfoRow
                    icon="location-outline"
                    label="Ciudad"
                    value={perfil.ciudad}
                  />
                  <InfoRow
                    icon="id-card-outline"
                    label="ID"
                    value={perfil.id?.toString()}
                  />
                </View>
              </ScrollView>
            )}

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <MediaViewerModal
        visible={viewerVisible}
        tipo={viewerTipo}
        uri={viewerUri}
        onClose={cerrarVisor}
      />
    </>
  );
}

// ── Fila de datos ──
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#9CA3AF" />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "85%",
    paddingTop: 10,
    position: "relative",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 8,
  },
  center: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: { color: "rgba(255,255,255,0.5)", fontSize: 13 },

  // ── Portada ──
  portadaWrapper: {
    position: "relative",
    height: PORTADA_HEIGHT,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "visible",
  },
  portadaPressable: {
    width: "100%",
    height: PORTADA_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  portada: {
    width: "100%",
    height: PORTADA_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#0F0F17",
  },
  portadaPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  expandBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  // ── Avatar ──
  avatarWrapper: {
    position: "absolute",
    bottom: -36,
    left: 20,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: CARD,
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 42 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },

  // ── Header info ──
  headerInfo: {
    marginTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  nombre: { color: "#fff", fontSize: 20, fontWeight: "800" },
  grupo: {
    color: BRAND,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 4,
    textTransform: "uppercase",
  },

  // ── Info ──
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  infoLabel: { color: "#6B7280", fontSize: 11 },
  infoValue: { color: "#E5E7EB", fontSize: 14, marginTop: 2 },

  // ── Close ──
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});
