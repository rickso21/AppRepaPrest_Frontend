import { JSX } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  userName: string;
  subtitle: string;
  avatarUrl?: string | null;
  onAvatarPress?: () => void;
};

export default function AppHeader({
  userName,
  subtitle,
  avatarUrl,
  onAvatarPress,
}: Props): JSX.Element {
  const initials = (userName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const tieneAvatar = !!avatarUrl;

  return (
    <View style={styles.header}>
      <View style={styles.avatarGlow}>
        <Pressable
          onPress={onAvatarPress}
          style={styles.avatar}
          hitSlop={6}
          accessibilityLabel="Abrir menú de usuario"
        >
          {tieneAvatar ? (
            <Image
              source={{ uri: avatarUrl! }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.headerContent}>
        <Text style={styles.userName} numberOfLines={1}>
          {userName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },

  // Estilos
  avatarGlow: {
    borderRadius: 36,
    padding: 3,
    backgroundColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#0F0F17", // aro interior oscuro
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#0F0F17",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 33,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  headerContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },

  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    lineHeight: 23,
  },

  subtitle: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 3,
    textTransform: "uppercase",
    lineHeight: 16,
  },
});
