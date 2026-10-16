import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(320, width * 0.82);

const BRAND = "#c20c0c";
const BRAND_DARK = "#c20c0c";
const BRAND_SOFT = "rgba(255,107,53,0.12)";
const BORDER = "rgba(255,255,255,0.06)";

type UserInfo = {
  nombreCompleto?: string;
  telefono?: string;
  userIdNum?: number | string;
  email?: string;
  rol?: string;
  avatarUrl?: string | null;
};

type Notification = {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  user: UserInfo;
  notifications?: Notification[];
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
  onDisableAccount?: () => void;
  disabling?: boolean;
};

export default function UserDrawer({
  visible,
  onClose,
  user,
  notifications = [],
  onOpenProfile,
  onOpenNotifications,
  onLogout,
  onDisableAccount,
  disabling = false,
}: Props) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  const noLeidas = notifications.filter((n) => !n.leida).length;
  const tieneAvatar = !!user?.avatarUrl;

  const iniciales = (user?.nombreCompleto || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX }] }]}
          onStartShouldSetResponder={() => true}
        >
          {/*Degradado naranja → oscuro */}
          <LinearGradient
            colors={["#1F120A", "#14141F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Header con avatar grande + glow naranja */}
          <View style={styles.header}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarBig}>
                {tieneAvatar ? (
                  <Image
                    source={{ uri: user.avatarUrl! }}
                    style={styles.avatarBigImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarBigText}>{iniciales}</Text>
                )}
              </View>
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {user?.nombreCompleto ?? "Usuario"}
            </Text>

            {!!user?.rol && (
              <View style={styles.rolePill}>
                <View style={styles.roleDot} />
                <Text style={styles.roleText}>{user.rol}</Text>
              </View>
            )}
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Mi cuenta */}
            {onOpenProfile && (
              <Pressable
                style={({ pressed }) => [
                  styles.action,
                  pressed && styles.actionPressed,
                ]}
                onPress={onOpenProfile}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="person-outline" size={18} color={BRAND} />
                </View>
                <Text style={styles.actionText}>Mi cuenta</Text>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </Pressable>
            )}

            {/* Información */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información</Text>
              <InfoRow
                icon="call-outline"
                label="Teléfono"
                value={user?.telefono}
              />
              <InfoRow icon="mail-outline" label="Correo" value={user?.email} />
              <InfoRow
                icon="id-card-outline"
                label="ID"
                value={user?.userIdNum?.toString()}
              />
            </View>

            {/* Notificaciones */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text style={styles.sectionTitle}>Notificaciones</Text>
                  {noLeidas > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{noLeidas}</Text>
                    </View>
                  )}
                </View>
                {onOpenNotifications && (
                  <Pressable onPress={onOpenNotifications}>
                    <Text style={styles.link}>Ver todas</Text>
                  </Pressable>
                )}
              </View>

              {notifications.length === 0 ? (
                <Text style={styles.empty}>No tienes notificaciones</Text>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <View key={n.id} style={styles.notif}>
                    <View
                      style={[
                        styles.notifDot,
                        !n.leida && styles.notifDotUnread,
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{n.titulo}</Text>
                      <Text style={styles.notifMsg} numberOfLines={2}>
                        {n.mensaje}
                      </Text>
                      <Text style={styles.notifDate}>{n.fecha}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Logout */}
            {onLogout && (
              <Pressable
                style={({ pressed }) => [
                  styles.logout,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={onLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </Pressable>
            )}

            {/* Inhabilitar cuenta */}
            {onDisableAccount && (
              <Pressable
                style={({ pressed }) => [
                  styles.deleteAccount,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={onDisableAccount}
                disabled={disabling}
              >
                {disabling ? (
                  <ActivityIndicator size="small" color="#9CA3AF" />
                ) : (
                  <>
                    <Ionicons name="power-outline" size={18} color="#9CA3AF" />
                    <Text style={styles.deleteAccountText}>
                      Eliminar cuenta
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={BRAND} />
      </View>
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
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    overflow: "hidden",

    borderRightWidth: 1,
    borderRightColor: "rgba(255,107,53,0.25)",

    shadowColor: BRAND,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 6, height: 0 },
    elevation: 14,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 26,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  avatarRing: {
    padding: 3,
    borderRadius: 42,
    backgroundColor: BRAND_SOFT,
    shadowColor: BRAND,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    marginBottom: 14,
  },

  avatarBig: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#1E1E2E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: BRAND,
  },

  avatarBigImage: {
    width: "100%",
    height: "100%",
    borderRadius: 39,
  },

  avatarBigText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  name: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
    maxWidth: "85%",
  },

  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BRAND_SOFT,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.35)",
  },

  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND,
  },

  roleText: {
    color: BRAND,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  actionPressed: {
    backgroundColor: BRAND_SOFT,
  },

  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
  },

  actionText: {
    color: "#F3F4F6",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#9CA3AF",
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  link: {
    color: BRAND,
    fontSize: 12,
    fontWeight: "600",
  },

  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BRAND_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
  },

  infoLabel: {
    color: "#6B7280",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  infoValue: {
    color: "#F3F4F6",
    fontSize: 14,
    marginTop: 2,
    fontWeight: "500",
  },

  empty: {
    color: "#6B7280",
    fontSize: 13,
    paddingVertical: 12,
  },

  notif: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: "#3F3F52",
  },

  notifDotUnread: {
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },

  notifTitle: {
    color: "#F3F4F6",
    fontSize: 13,
    fontWeight: "600",
  },

  notifMsg: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },

  notifDate: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 4,
  },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },

  logoutText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 14,
  },

  deleteAccount: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  deleteAccountText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
});
