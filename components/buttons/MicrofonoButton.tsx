// components/buttons/MicrofonoButton.tsx — ÚNICO responsable del micrófono (push-to-talk).
import { Ionicons } from "@expo/vector-icons";
import { useRoomContext } from "@livekit/react-native";
import { ConnectionState, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
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

  // Cola: las operaciones sobre el micrófono se ejecutan EN ORDEN (evita la carrera press/release)
  const cola = useRef<Promise<unknown>>(Promise.resolve());
  const encolar = useCallback((fn: () => Promise<unknown>) => {
    cola.current = cola.current
      .then(fn)
      .catch((e) => console.warn("[Mic]", e?.message ?? e));
    return cola.current;
  }, []);

  // Precalentamiento: publica la pista una vez (tarda segundos) y la deja muteada.
  // Así el primer "hablar" es instantáneo.
  useEffect(() => {
    const warm = () =>
      encolar(async () => {
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(false);
      });
    if (room.state === ConnectionState.Connected) warm();
    room.on(RoomEvent.Connected, warm);
    return () => {
      room.off(RoomEvent.Connected, warm);
    };
  }, [room, encolar]);

  const iniciar = useCallback(() => {
    if (disabled) {
      if (onBlockedPress) onBlockedPress();
      else Alert.alert("Error", blockedMessage);
      return;
    }
    if (room.state !== ConnectionState.Connected) return; // aún no conecta: no hacer nada

    setMicrofonoActivo(true); // respuesta visual inmediata
    onChange?.(true);
    encolar(() => room.localParticipant.setMicrophoneEnabled(true));
  }, [disabled, room, onChange, onBlockedPress, blockedMessage, encolar]);

  const detener = useCallback(() => {
    setMicrofonoActivo(false);
    onChange?.(false);
    if (room.state !== ConnectionState.Connected) return;
    encolar(() => room.localParticipant.setMicrophoneEnabled(false));
  }, [room, onChange, encolar]);

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
