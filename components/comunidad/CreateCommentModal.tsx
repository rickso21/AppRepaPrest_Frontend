import {
  ActivityIndicator,
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

type Props = {
  visible: boolean;
  texto: string;
  enviando: boolean;
  onChangeTexto: (t: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function CreateCommentModal({
  visible,
  texto,
  enviando,
  onChangeTexto,
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();

  const handleClose = () => {
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
              {/*paddingBottom dinámico según el área segura */}
              <View
                style={[
                  styles.card,
                  { paddingBottom: Math.max(insets.bottom, 20) + 12 },
                ]}
              >
                <Text style={styles.title}>Nuevo comentario</Text>

                <TextInput
                  style={styles.textarea}
                  placeholder="Escribe tu comentario..."
                  placeholderTextColor="#6B7280"
                  multiline
                  value={texto}
                  onChangeText={onChangeTexto}
                  editable={!enviando}
                />

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnGhost]}
                    onPress={handleClose}
                    disabled={enviando}
                  >
                    <Text style={styles.btnGhostText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={handleSubmit}
                    disabled={enviando}
                  >
                    {enviando ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnPrimaryText}>Comentar</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  bottomAnchor: {
    flex: 1,
    justifyContent: "flex-end",
  },

  avoiding: {
    width: "100%",
  },

  card: {
    backgroundColor: CARD,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
    maxHeight: "90%",
  },

  title: { color: "#fff", fontSize: 16, fontWeight: "800" },

  textarea: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    color: "#fff",
    padding: 12,
    minHeight: 90,
    maxHeight: 160,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: BORDER,
  },

  actions: { flexDirection: "row", gap: 10, marginTop: 4 },

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
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
});
