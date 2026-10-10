import { Ionicons } from "@expo/vector-icons";
import { AudioSession, useRoomContext } from "@livekit/react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

type Props = {
  disabled?: boolean;
  onChange?: (activo: boolean) => void;
  onBlockedPress?: () => void;
  blockedMessage?: string;
};

export default function MicrofonoButton({
  disabled = false,
  onChange,
  onBlockedPress,
  blockedMessage = "Conéctate primero para usar el micrófono",
}: Props) {
  const [microfonoActivo, setMicrofonoActivo] = useState(false);
  const room = useRoomContext();

  // Al montar, asegurar que el micrófono arranca silenciado
  useEffect(() => {
    if (room.state === "connected") {
      room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
    }
  }, [room]);

  const iniciar = useCallback(async () => {
    if (disabled) {
      if (onBlockedPress) onBlockedPress();
      else Alert.alert("Error", blockedMessage);
      return;
    }

    if (room.state !== "connected") {
      console.warn("[Mic] Room no conectada, esperando...");
      return;
    }

    try {
      // Asegurar que la sesión de audio esté activa
      await AudioSession.startAudioSession();
      await room.localParticipant.setMicrophoneEnabled(true);
      setMicrofonoActivo(true);
      onChange?.(true);
    } catch (err) {
      console.error("[Mic] Error al activar micrófono:", err);
      Alert.alert("Error", "No se pudo activar el micrófono");
    }
  }, [disabled, room, onChange, onBlockedPress, blockedMessage]);

  const detener = useCallback(async () => {
    try {
      await room.localParticipant.setMicrophoneEnabled(false);
    } catch (err) {
      console.error("[Mic] Error al desactivar micrófono:", err);
    }
    setMicrofonoActivo(false);
    onChange?.(false);
  }, [room, onChange]);

  return (
    <Pressable
      onPressIn={iniciar}
      onPressOut={detener}
      style={[
        styles.microfonoButton,
        microfonoActivo && styles.microfonoButtonActive,
        disabled && styles.microfonoButtonDisabled,
      ]}
      disabled={disabled}
    >
      <Ionicons
        name={microfonoActivo ? "mic" : "mic-outline"}
        size={28}
        color={microfonoActivo ? "#4CAF50" : "#fff"}
      />
      {microfonoActivo && (
        <View style={styles.microfonoIndicador}>
          <View style={styles.puntoParpadeanteMic} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  microfonoButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  microfonoButtonActive: {
    backgroundColor: "rgba(76,175,80,0.15)",
    borderColor: "rgba(76,175,80,0.4)",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.6,
  },
  microfonoButtonDisabled: { opacity: 0.4 },
  microfonoIndicador: { position: "absolute", top: -4, right: -4 },
  puntoParpadeanteMic: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
