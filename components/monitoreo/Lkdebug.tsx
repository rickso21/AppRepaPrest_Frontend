import { useRoomContext } from "@livekit/react-native";
import { RoomEvent } from "livekit-client";
import { useEffect } from "react";

export default function LkDebug() {
  const room = useRoomContext();

  useEffect(() => {
    const log = (...a: any[]) => console.log("[LK]", ...a);

    const onPart = (p: any) => log("ParticipantConnected", p.identity);
    const onGone = (p: any) => log("ParticipantDisconnected", p.identity);
    const onSub = (t: any, _pub: any, p: any) =>
      log("TrackSubscribed", t.kind, "de", p.identity);
    const onUnsub = (t: any, _pub: any, p: any) =>
      log("TrackUnsubscribed", t.kind, "de", p.identity);
    const onPlay = () =>
      log("AudioPlaybackStatus canPlayback =", room.canPlaybackAudio);
    const onState = (s: any) => log("ConnectionState", s);

    // ✅ Nuevos: estado del track local y errores de dispositivo
    const onLocalPub = (pub: any) =>
      log("LocalTrackPublished", pub.kind, pub.source);
    const onLocalUnpub = (pub: any) => log("LocalTrackUnpublished", pub.kind);
    const onMicError = (e: any) => log("MediaDevicesError", e?.message);

    room.on(RoomEvent.ParticipantConnected, onPart);
    room.on(RoomEvent.ParticipantDisconnected, onGone);
    room.on(RoomEvent.TrackSubscribed, onSub);
    room.on(RoomEvent.TrackUnsubscribed, onUnsub);
    room.on(RoomEvent.AudioPlaybackStatusChanged, onPlay);
    room.on(RoomEvent.ConnectionStateChanged, onState);
    room.on(RoomEvent.LocalTrackPublished, onLocalPub);
    room.on(RoomEvent.LocalTrackUnpublished, onLocalUnpub);
    room.on(RoomEvent.MediaDevicesError, onMicError);

    log("remotos al entrar:", Array.from(room.remoteParticipants.keys()));
    log("mic enabled:", room.localParticipant?.isMicrophoneEnabled);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onPart);
      room.off(RoomEvent.ParticipantDisconnected, onGone);
      room.off(RoomEvent.TrackSubscribed, onSub);
      room.off(RoomEvent.TrackUnsubscribed, onUnsub);
      room.off(RoomEvent.AudioPlaybackStatusChanged, onPlay);
      room.off(RoomEvent.ConnectionStateChanged, onState);
      room.off(RoomEvent.LocalTrackPublished, onLocalPub);
      room.off(RoomEvent.LocalTrackUnpublished, onLocalUnpub);
      room.off(RoomEvent.MediaDevicesError, onMicError);
    };
  }, [room]);

  return null;
}
