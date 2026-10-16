import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Keyboard,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    KeyboardAvoidingView,
    KeyboardProvider,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND = "#940000";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.07)";

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.preview}
      nativeControls
      contentFit="cover"
    />
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  visible: boolean;
  texto: string;
  imagen: string | null;
  video: string | null;
  audio: string | null; // 👈 nuevo
  enviando: boolean;
  grabando: boolean; // 👈 nuevo
  duracionAudio: number; // 👈 nuevo
  progresoSubida?: number;
  comprimiendo?: boolean;
  progresoCompresion?: number;
  onChangeTexto: (t: string) => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onStartRecording: () => void; // 👈 nuevo
  onStopRecording: () => void; // 👈 nuevo
  onCancelRecording: () => void; // 👈 nuevo
  onClose: () => void;
  onSubmit: () => void;
};

export default function CreatePostModal({
  visible,
  texto,
  imagen,
  video,
  audio,
  enviando,
  grabando,
  duracionAudio,
  comprimiendo = false,
  onChangeTexto,
  onPickImage,
  onPickVideo,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onClose,
  onSubmit,
}: Props) {
  const bloqueado = enviando || comprimiendo || grabando;
  const insets = useSafeAreaInsets();

  const [inputHeight, setInputHeight] = useState(80);

  const tieneMedia = !!imagen || !!video || !!audio;
  const alturaMaxima = tieneMedia ? 70 : 110;
  const alturaAplicada = Math.min(Math.max(inputHeight, 70), alturaMaxima);

  const handleClose = () => {
    if (grabando) onCancelRecording();
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    onSubmit();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardProvider>
        <View style={styles.overlay}>
          <View style={styles.bottomAnchor}>
            <KeyboardAvoidingView
              behavior="padding"
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -24}
              style={styles.avoiding}
            >
              <View
                style={[
                  styles.card,
                  { paddingBottom: Math.max(insets.bottom, 20) + 12 },
                ]}
              >
                <View style={styles.handle} />

                <View style={styles.header}>
                  <Text style={styles.title}>Nueva publicación</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={enviando || comprimiendo}
                    hitSlop={8}
                    style={styles.closeBtn}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={enviando || comprimiendo ? "#6B7280" : "#fff"}
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.textarea, { height: alturaAplicada }]}
                  placeholder="¿Qué estás pensando?"
                  placeholderTextColor="#6B7280"
                  multiline
                  value={texto}
                  onChangeText={onChangeTexto}
                  editable={!bloqueado}
                  onContentSizeChange={(e) => {
                    setInputHeight(e.nativeEvent.contentSize.height + 16);
                  }}
                  scrollEnabled
                />

                {/* Preview imagen */}
                {imagen && (
                  <Image
                    source={{ uri: imagen }}
                    style={styles.preview}
                    resizeMode="cover"
                  />
                )}

                {/* Preview video */}
                {video && <VideoPreview uri={video} />}

                {/* Preview audio */}
                {audio && !grabando && (
                  <View style={styles.audioPreview}>
                    <Ionicons name="musical-notes" size={18} color={BRAND} />
                    <Text style={styles.audioPreviewText}>Audio grabado</Text>
                    <TouchableOpacity onPress={onCancelRecording} hitSlop={8}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Grabando */}
                {grabando && (
                  <View style={styles.recordingRow}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingTime}>
                      {formatDuration(duracionAudio)}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity onPress={onStopRecording} hitSlop={8}>
                      <Ionicons name="stop-circle" size={32} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onCancelRecording} hitSlop={8}>
                      <Ionicons name="close-circle" size={32} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Botones de media */}
                {!grabando && (
                  <View style={styles.mediaRow}>
                    <TouchableOpacity
                      style={[
                        styles.imageBtn,
                        bloqueado && styles.imageBtnDisabled,
                      ]}
                      onPress={onPickImage}
                      disabled={bloqueado}
                    >
                      <Ionicons
                        name="image-outline"
                        size={18}
                        color={bloqueado ? "#6B7280" : BRAND}
                      />
                      <Text
                        style={[
                          styles.imageBtnText,
                          bloqueado && styles.imageBtnTextDisabled,
                        ]}
                      >
                        {imagen ? "Cambiar imagen" : "Imagen"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.imageBtn,
                        bloqueado && styles.imageBtnDisabled,
                      ]}
                      onPress={onPickVideo}
                      disabled={bloqueado}
                    >
                      <Ionicons
                        name="videocam-outline"
                        size={18}
                        color={bloqueado ? "#6B7280" : BRAND}
                      />
                      <Text
                        style={[
                          styles.imageBtnText,
                          bloqueado && styles.imageBtnTextDisabled,
                        ]}
                      >
                        {video ? "Cambiar video" : "Video"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.imageBtn,
                        bloqueado && styles.imageBtnDisabled,
                      ]}
                      onPress={onStartRecording}
                      disabled={bloqueado}
                    >
                      <Ionicons
                        name="mic-outline"
                        size={18}
                        color={bloqueado ? "#6B7280" : BRAND}
                      />
                      <Text
                        style={[
                          styles.imageBtnText,
                          bloqueado && styles.imageBtnTextDisabled,
                        ]}
                      >
                        Audio
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Botones al pie */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnGhost]}
                    onPress={handleClose}
                    disabled={enviando || comprimiendo}
                  >
                    <Text style={styles.btnGhostText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.btn,
                      styles.btnPrimary,
                      (enviando || comprimiendo || grabando) &&
                        styles.btnPrimaryDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={enviando || comprimiendo || grabando}
                  >
                    {enviando || comprimiendo ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnPrimaryText}>Publicar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </KeyboardProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  bottomAnchor: { flex: 1, justifyContent: "flex-end" },
  avoiding: { width: "100%" },
  card: {
    backgroundColor: CARD,
    paddingHorizontal: 20,
    paddingTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 10,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "800" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  textarea: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    color: "#fff",
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: BORDER,
  },
  preview: {
    width: "100%",
    height: 120,
    borderRadius: 10,
  },
  mediaRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  imageBtnDisabled: { opacity: 0.5 },
  imageBtnText: { color: BRAND, fontWeight: "700", fontSize: 13 },
  imageBtnTextDisabled: { color: "#6B7280" },

  // ── Audio preview ──
  audioPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,107,53,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
  },
  audioPreviewText: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  // ── Grabando ──
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  recordingTime: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.06)" },
  btnGhostText: { color: "#E5E7EB", fontWeight: "700" },
  btnPrimary: { backgroundColor: BRAND },
  btnPrimaryDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
});
