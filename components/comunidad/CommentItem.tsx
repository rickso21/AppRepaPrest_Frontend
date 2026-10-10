import { StyleSheet, Text, View } from "react-native";
import type { Comentario } from "../../hooks/comunidad/useComunidad";

const BRAND = "#FF6B35";
const BORDER = "rgba(255,255,255,0.07)";

type Props = {
  comentario: Comentario;
};

export default function CommentItem({ comentario }: Props) {
  // Inicial del autor para el avatar
  const inicial = (comentario.nombre ?? "?").trim().charAt(0).toUpperCase();

  return (
    <View style={styles.row}>
      {/* Avatar con inicial */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{inicial}</Text>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.author} numberOfLines={1}>
            {comentario.nombre}
          </Text>
          <Text style={styles.date}>
            {comentario.fecha} · {comentario.hora}
          </Text>
        </View>

        <Text style={styles.text}>{comentario.comentario}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // Avatar circular con la inicial
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,107,53,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: BRAND,
    fontWeight: "800",
    fontSize: 13,
  },

  // Contenido a la derecha
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  author: {
    color: BRAND,
    fontWeight: "700",
    fontSize: 12,
    flexShrink: 1,
  },
  text: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 18,
  },
  date: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    flexShrink: 0,
  },
});
