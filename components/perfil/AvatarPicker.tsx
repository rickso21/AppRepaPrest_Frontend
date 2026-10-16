import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const AVATAR_SIZE = 92;

type Props = {
  uri: string | null;
  initials: string;
  onPress: () => void;
};

export default function AvatarPicker({ uri, initials, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.circle} onPress={onPress}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} />
        ) : (
          <Text style={styles.initials}>{initials}</Text>
        )}
      </Pressable>
      <View style={styles.badge}>
        <Ionicons name="camera" size={13} color="#fff" />
      </View>
    </View>
  );
}

export { AVATAR_SIZE };

const styles = StyleSheet.create({
  wrap: { marginTop: -AVATAR_SIZE / 2, marginLeft: 22 },
  circle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#940000",
    borderWidth: 4,
    borderColor: "#0F0F17",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  initials: { color: "#fff", fontSize: 28, fontWeight: "800" },
  badge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#2196F3",
    borderWidth: 2,
    borderColor: "#0F0F17",
    alignItems: "center",
    justifyContent: "center",
  },
});
