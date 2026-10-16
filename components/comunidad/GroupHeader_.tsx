import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";

import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BRAND = "#940000";
const BORDER = "rgba(255,255,255,0.07)";

type Scope = "principal" | "emergencia" | "monitoreo" | "global";

type Props = {
  grupo: string;
  imgGrupo: string | null;
  totalPublicaciones: number;
  userAvatarUrl?: string | null;
  userName?: string;
  onAvatarPress?: () => void;
  onGroupPress?: () => void;
  scope?: Scope;
  onScopeChange?: (scope: Scope) => void;

  grupos?: {
    principal: { id: number; name: string } | null;
    emergencia: { id: number; name: string } | null;
    monitoreo: { id: number; name: string } | null;
  };
};

export default function GroupHeader({
  grupo,
  imgGrupo,
  totalPublicaciones,
  userName,
  onGroupPress,
  scope = "principal",
  onScopeChange,
  grupos,
}: Props) {
  const initials = (userName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const tituloActual =
    scope === "global"
      ? "Global"
      : scope === "emergencia"
        ? (grupos?.emergencia?.name ?? "Emergencias")
        : scope === "monitoreo"
          ? (grupos?.monitoreo?.name ?? "Monitoreo")
          : (grupos?.principal?.name ?? grupo ?? "Comunidad");

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.header}>
        <Pressable
          style={styles.groupInfo}
          onPress={onGroupPress}
          disabled={!onGroupPress}
        >
          {imgGrupo ? (
            <Image source={{ uri: imgGrupo }} style={styles.groupImage} />
          ) : (
            <View style={[styles.groupImage, styles.placeholder]}>
              <Ionicons name="people" size={22} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {tituloActual}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {totalPublicaciones === 0 && (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              )}
              <Text style={styles.subtitle}>
                {totalPublicaciones === 0
                  ? "Actualizando..."
                  : `${totalPublicaciones} publicación${totalPublicaciones === 1 ? "" : "es"}`}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Selector de scope (scrollable horizontal) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scopeRow}
      >
        {/* 1. Monitoreo */}
        {grupos?.monitoreo && (
          <ScopeChip
            icon="eye-outline"
            label="Monitoreo"
            active={scope === "monitoreo"}
            onPress={() => onScopeChange?.("monitoreo")}
          />
        )}

        {/* 2. Mi grupo (Principal) */}
        <ScopeChip
          icon="people-outline"
          label="Mi grupo"
          active={scope === "principal"}
          onPress={() => onScopeChange?.("principal")}
        />

        {/* 3. Emergencias */}
        {grupos?.emergencia && (
          <ScopeChip
            icon="alert-circle-outline"
            label="Emergencias"
            active={scope === "emergencia"}
            onPress={() => onScopeChange?.("emergencia")}
          />
        )}

        {/* 4. Global */}
        <ScopeChip
          icon="globe-outline"
          label="Global"
          active={scope === "global"}
          onPress={() => onScopeChange?.("global")}
        />
      </ScrollView>
    </View>
  );
}

// ============================================================
// Chip reutilizable
// ============================================================
function ScopeChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: any;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.scopeChip, active && styles.scopeChipActive]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? "#fff" : "rgba(255,255,255,0.6)"}
      />
      <Text
        style={[styles.scopeChipText, active && styles.scopeChipTextActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: "#940000",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
  },
  groupInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  groupImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND,
  },
  placeholder: { alignItems: "center", justifyContent: "center" },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  subtitle: { color: "rgba(255,255,255,0.6)", fontSize: 12 },

  scopeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scopeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  scopeChipActive: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderColor: "rgba(255,255,255,0.4)",
  },
  scopeChipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  scopeChipTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
});
