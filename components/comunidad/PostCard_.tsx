// components/comunidad/PostCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { memo, useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type {
  Publicacion,
  ReactionType,
} from "../../hooks/comunidad/useComunidad";
import CommentList from "./CommentList";
import LinkPreview from "./LinkPreview";

const BRAND = "#940000";
const CARD = "#16161F";
const BORDER = "rgba(255,255,255,0.07)";

const EMOJIS: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  sad: "😢",
  angry: "😡",
};

const EMPTY_REACTIONS: Record<ReactionType, number> = {
  like: 0,
  love: 0,
  haha: 0,
  sad: 0,
  angry: 0,
};

const REACTION_KEYS: ReactionType[] = ["like", "love", "haha", "sad", "angry"];

const AUTOPLAYS = 2;
const VIDEO_HEIGHT = 220;

// ============================================================
// PostVideo
// ============================================================
const PostVideo = memo(function PostVideo({
  uri,
  esVisible,
  onExpand,
}: {
  uri: string;
  esVisible: boolean;
  onExpand: () => void;
}) {
  const [muted, setMuted] = useState(true);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [autoplaysRestantes, setAutoplaysRestantes] = useState(AUTOPLAYS);
  const [mostrarPlay, setMostrarPlay] = useState(false);
  const [mostrarIconoCentral, setMostrarIconoCentral] = useState(false);

  const autoplaysRef = useRef(AUTOPLAYS);
  const yaSeEjecutoRef = useRef(false);
  const usuarioPausoRef = useRef(false);
  const iconoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileName = uri.split("/").pop() ?? "";

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = true;
  });

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  } as any);

  const flashIcono = () => {
    setMostrarIconoCentral(true);
    if (iconoTimerRef.current) clearTimeout(iconoTimerRef.current);
    iconoTimerRef.current = setTimeout(() => {
      setMostrarIconoCentral(false);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (iconoTimerRef.current) clearTimeout(iconoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!esVisible) {
      yaSeEjecutoRef.current = false;
    }
  }, [esVisible]);

  useEffect(() => {
    const sub = player.addListener("playToEnd", () => {
      try {
        if (autoplaysRef.current > 1) {
          autoplaysRef.current -= 1;
          setAutoplaysRestantes(autoplaysRef.current);
          player.currentTime = 0;
          player.play();
        } else {
          autoplaysRef.current = 0;
          setAutoplaysRestantes(0);
          setReproduciendo(false);
          setMostrarPlay(true);
          player.currentTime = 0;
          player.pause();
        }
      } catch (e) {}
    });

    return () => sub.remove();
  }, [player, fileName]);

  useEffect(() => {
    if (!esVisible) return;
    if (autoplaysRef.current <= 0) return;
    if (usuarioPausoRef.current) return;
    if (reproduciendo) return;
    if (yaSeEjecutoRef.current) return;

    const t = setTimeout(() => {
      if (!esVisible) return;
      if (yaSeEjecutoRef.current) return;

      yaSeEjecutoRef.current = true;

      try {
        player.play();
        setReproduciendo(true);
        setMostrarPlay(false);
      } catch (e) {
        yaSeEjecutoRef.current = false;
      }
    }, 400);

    return () => clearTimeout(t);
  }, [esVisible, player, reproduciendo, fileName]);

  useEffect(() => {
    if (esVisible) return;
    if (!reproduciendo) return;

    try {
      player.pause();
      setReproduciendo(false);
    } catch (e) {}
  }, [esVisible, player, reproduciendo]);

  const playManual = () => {
    autoplaysRef.current = 1;
    setAutoplaysRestantes(1);
    usuarioPausoRef.current = false;
    yaSeEjecutoRef.current = true;

    try {
      player.currentTime = 0;
      player.play();
      setReproduciendo(true);
      setMostrarPlay(false);
      flashIcono();
    } catch (e) {}
  };

  const pausarManual = () => {
    try {
      player.pause();
      setReproduciendo(false);
      setMostrarPlay(true);
      usuarioPausoRef.current = true;
      flashIcono();
    } catch (e) {}
  };

  const togglePlay = () => {
    if (reproduciendo) {
      pausarManual();
    } else {
      if (autoplaysRef.current > 0 && !mostrarPlay) {
        try {
          player.play();
          setReproduciendo(true);
          setMostrarPlay(false);
          flashIcono();
        } catch (e) {}
      } else {
        playManual();
      }
    }
  };

  const toggleMute = () => {
    const nuevo = !muted;
    player.muted = nuevo;
    setMuted(nuevo);
  };

  return (
    <View style={styles.videoWrapper}>
      <Pressable onPress={togglePlay} style={styles.videoTouchable}>
        <VideoView
          player={player}
          style={styles.postMedia}
          nativeControls={false}
          contentFit="contain"
        />
      </Pressable>

      {mostrarIconoCentral && (
        <View pointerEvents="none" style={styles.centerIconOverlay}>
          <View style={styles.centerIconCircle}>
            <Ionicons
              name={reproduciendo ? "pause" : "play"}
              size={44}
              color="#fff"
            />
          </View>
        </View>
      )}

      {mostrarPlay && !reproduciendo && (
        <Pressable style={styles.playOverlay} onPress={playManual}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={36} color="#fff" />
          </View>
        </Pressable>
      )}

      {reproduciendo && (
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={pausarManual}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pause" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.expandBtn}
        onPress={onExpand}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="expand-outline" size={18} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.muteBtn}
        onPress={toggleMute}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={muted ? "volume-mute" : "volume-high"}
          size={18}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
});

// ============================================================
// AudioPlayer (expo-audio)
// ============================================================
function AudioPlayer({ uri }: { uri: string }) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  const playing = status.playing;
  const position = status.currentTime ?? 0;
  const duration = status.duration ?? 0;

  const toggle = () => {
    if (playing) {
      player.pause();
    } else {
      if (position >= duration && duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <TouchableOpacity
      style={styles.audioPlayer}
      onPress={toggle}
      activeOpacity={0.8}
    >
      <Ionicons name={playing ? "pause" : "play"} size={20} color="#fff" />
      <View style={styles.audioTrack}>
        <View
          style={[
            styles.audioProgress,
            { width: `${duration > 0 ? (position / duration) * 100 : 0}%` },
          ]}
        />
      </View>
      <Text style={styles.audioTime}>
        {formatTime(playing ? position : duration)}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================
// PostCard
// ============================================================
type Scope = "principal" | "emergencia" | "monitoreo" | "global";

type Props = {
  publicacion: Publicacion;
  baseUrl: string;
  esMio: boolean;
  esVisible: boolean;
  scope: Scope;
  onDelete: (id: number) => void;
  onComment: (id: number) => void;
  onReaccionar: (id: number, type: ReactionType) => void;
  onOpenMedia: (tipo: "image" | "video", uri: string) => void;
  onOpenProfile?: (userId: number) => void;
};

function PostCardComponent({
  publicacion,
  baseUrl,
  esMio,
  esVisible,
  scope,
  onDelete,
  onComment,
  onReaccionar,
  onOpenMedia,
  onOpenProfile,
}: Props) {
  const reacciones = publicacion.reacciones ?? EMPTY_REACTIONS;
  const miReaccion = publicacion.mi_reaccion;

  const avatarUrl = publicacion.user_data?.avatar_url ?? null;
  const nombreAutor =
    publicacion.user_data?.nombre ?? publicacion.user ?? "Usuario";
  const autorId = publicacion.user_data?.id ?? publicacion.user_id ?? null;

  const canOpenProfile = scope !== "global" && !!autorId && !!onOpenProfile;

  const initials = (nombreAutor || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const imageUri = publicacion.image
    ? `${baseUrl}/img/publish/${publicacion.image}`
    : null;
  const videoUri = publicacion.video
    ? `${baseUrl}/img/publish/${publicacion.video}`
    : null;
  const audioUri = publicacion.audio
    ? `${baseUrl}/audio/publish/${publicacion.audio}`
    : null;

  const handleOpenProfile = () => {
    if (autorId && onOpenProfile) onOpenProfile(Number(autorId));
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorTouchable}
          activeOpacity={0.7}
          onPress={handleOpenProfile}
          disabled={!canOpenProfile}
        >
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {nombreAutor}
            </Text>
            <Text style={styles.fecha}>
              {publicacion.fecha} · {publicacion.hora}
            </Text>
          </View>
        </TouchableOpacity>

        {esMio && (
          <TouchableOpacity
            onPress={() => onDelete(publicacion.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Texto */}
      {!!publicacion.post && (
        <Text style={styles.postText}>{publicacion.post}</Text>
      )}

      {/* Links */}
      {publicacion.links && publicacion.links.length > 0 && (
        <View style={{ gap: 6 }}>
          {publicacion.links.map((link, idx) => (
            <LinkPreview key={idx} tipo={link.tipo} url={link.url} />
          ))}
        </View>
      )}

      {/* Imagen */}
      {imageUri && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpenMedia("image", imageUri)}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Video */}
      {videoUri && (
        <PostVideo
          uri={videoUri}
          esVisible={esVisible}
          onExpand={() => onOpenMedia("video", videoUri)}
        />
      )}

      {/* Audio */}
      {audioUri && <AudioPlayer uri={audioUri} />}

      {/* Reacciones */}
      <View style={styles.reactionsRow}>
        {REACTION_KEYS.map((key) => {
          const activo = miReaccion === key;
          const total = reacciones[key] ?? 0;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onReaccionar(publicacion.id, key)}
              activeOpacity={0.7}
              style={[styles.reactionBtn, activo && styles.reactionBtnActive]}
            >
              <Text style={styles.reactionEmoji}>{EMOJIS[key]}</Text>
              {total > 0 && (
                <Text
                  style={[
                    styles.reactionCount,
                    activo && styles.reactionCountActive,
                  ]}
                >
                  {total}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => onComment(publicacion.id)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#9CA3AF" />
          <Text style={styles.footerText}>
            {publicacion.comentarios.length} comentario
            {publicacion.comentarios.length === 1 ? "" : "s"}
          </Text>
        </TouchableOpacity>
      </View>

      <CommentList comentarios={publicacion.comentarios} />
    </View>
  );
}

export default memo(PostCardComponent, (prev, next) => {
  // Si el post cambió (like, comment, delete) → re-render
  if (prev.publicacion !== next.publicacion) return false;

  // Mismo post: re-render solo si cambia algo visual
  return (
    prev.esVisible === next.esVisible &&
    prev.esMio === next.esMio &&
    prev.scope === next.scope &&
    prev.baseUrl === next.baseUrl &&
    prev.onDelete === next.onDelete &&
    prev.onComment === next.onComment &&
    prev.onReaccionar === next.onReaccionar &&
    prev.onOpenMedia === next.onOpenMedia &&
    prev.onOpenProfile === next.onOpenProfile
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  authorTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,107,53,0.3)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  avatarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  userName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  fecha: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  postText: { color: "#E5E7EB", fontSize: 14, lineHeight: 20 },

  postImage: {
    marginTop: 10,
    width: "100%",
    height: VIDEO_HEIGHT,
    borderRadius: 10,
    backgroundColor: "#000",
  },

  videoWrapper: {
    position: "relative",
    marginTop: 10,
    width: "100%",
    height: VIDEO_HEIGHT,
  },
  videoTouchable: {
    width: "100%",
    height: VIDEO_HEIGHT,
    borderRadius: 10,
    overflow: "hidden",
  },
  postMedia: {
    width: "100%",
    height: VIDEO_HEIGHT,
    backgroundColor: "#000",
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
  },
  playCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    paddingLeft: 4,
  },
  centerIconOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  centerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  expandBtn: {
    position: "absolute",
    top: 12,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  muteBtn: {
    position: "absolute",
    top: 12,
    right: 52,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  reactionBtnActive: {
    backgroundColor: "rgba(255,107,53,0.15)",
    borderColor: BRAND,
  },
  reactionEmoji: { fontSize: 15 },
  reactionCount: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
    minWidth: 8,
    textAlign: "center",
  },
  reactionCountActive: { color: BRAND },
  footer: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { color: "#9CA3AF", fontSize: 12 },
  pauseBtn: {
    position: "absolute",
    top: 12,
    left: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },

  // ── AudioPlayer ──
  audioPlayer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,107,53,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
  },
  audioTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  audioProgress: {
    height: "100%",
    backgroundColor: BRAND,
  },
  audioTime: {
    color: "#fff",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    minWidth: 40,
    textAlign: "right",
  },
});
