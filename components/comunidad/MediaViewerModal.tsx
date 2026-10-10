import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

const BRAND = "#FF6B35";

type Props = {
  visible: boolean;
  tipo: "image" | "video" | null;
  uri: string | null;
  onClose: () => void;
};

function FullVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.fullMedia}
      nativeControls
      contentFit="contain"
    />
  );
}

export default function MediaViewerModal({
  visible,
  tipo,
  uri,
  onClose,
}: Props) {
  const { width, height } = useWindowDimensions();

  if (!uri || !tipo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Botón cerrar (arriba izquierda) */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.closeText}>Volver</Text>
        </TouchableOpacity>

        {/* Contenido */}
        <View style={[styles.content, { width, height }]}>
          {tipo === "image" ? (
            <Image
              source={{ uri }}
              style={styles.fullMedia}
              resizeMode="contain"
            />
          ) : (
            <FullVideo uri={uri} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullMedia: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  closeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
