import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  uri: string | null;
  onPress: () => void;
};

export default function CoverPhoto({ uri, onPress }: Props) {
  return (
    <Pressable style={styles.wrap} onPress={onPress}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <View style={styles.placeholder} />
      )}
      <View style={styles.badge}>
        <Ionicons name="camera" size={15} color="#fff" />
        <Text style={styles.badgeText}>Cambiar portada</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", height: 170, backgroundColor: "#1C1C28" },
  image: { width: "100%", height: "100%" },
  placeholder: { width: "100%", height: "100%", backgroundColor: "#1C1C28" },
  badge: {
    position: "absolute",
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,15,23,0.75)",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
