import { StyleSheet, View } from "react-native";
import type { Comentario } from "../../hooks/comunidad/useComunidad";
import CommentItem from "./CommentItem";

type Props = {
  comentarios: Comentario[];
};

export default function CommentList({ comentarios }: Props) {
  if (!comentarios?.length) return null;

  return (
    <View style={styles.box}>
      {comentarios.map((c, idx) => (
        <CommentItem key={c.id ?? idx} comentario={c} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    gap: 8,
  },
});
