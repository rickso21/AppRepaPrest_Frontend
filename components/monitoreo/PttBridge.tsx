import { useRoomContext } from "@livekit/react-native";
import { useEffect } from "react";

export default function PttBridge({ micOn }: { micOn: boolean }) {
  const room = useRoomContext();
  useEffect(() => {
    room.localParticipant
      .setMicrophoneEnabled(micOn)
      .catch((e: any) => console.warn("[PTT] mic:", e?.message));
  }, [micOn, room]);
  return null;
}
