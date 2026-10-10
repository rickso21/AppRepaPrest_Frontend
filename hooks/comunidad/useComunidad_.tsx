import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { Video as VideoCompressor } from "react-native-compressor";
import { authService } from "../../services/auth/AuthService";
import { api, getMediaBaseUrl } from "../../services/conector/api";
import { useRealtimeComunidad } from "./useRealtimeComunidad";

// ============================================================
// TIPOS
// ============================================================

export type Comentario = {
  id?: number;
  nombre: string;
  comentario: string;
  fecha: string;
  hora: string;
  avatar_url?: string | null;
  audio?: string | null;
};

export type ReactionType = "like" | "love" | "haha" | "sad" | "angry";

export type UserDataAutor = {
  id: number;
  nombre: string;
  avatar_url: string | null;
};

export type LinkTipo =
  | "youtube"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "vimeo"
  | "spotify"
  | "linkedin"
  | "whatsapp";

export type LinkDetectado = {
  tipo: LinkTipo;
  url: string;
};

export type Publicacion = {
  id: number;
  user_id?: number | null;
  post: string;
  image: string | null;
  video: string | null;
  audio: string | null;
  user: string;
  user_data?: UserDataAutor;
  fecha: string;
  hora: string;
  comentarios: Comentario[];
  reacciones: Record<ReactionType, number>;
  mi_reaccion: ReactionType | null;
  links?: LinkDetectado[];
};

export type UserData = {
  id: number;
  nombre?: string;
  apellido_p?: string;
  apellido_m?: string;
  email?: string;
  telefono?: string;
  grupo_id?: number;
  [key: string]: any;
};

export type Scope = "principal" | "emergencia" | "monitoreo" | "global";

export type GrupoInfo = {
  id: number;
  name: string;
};

export type GruposUsuario = {
  principal: GrupoInfo | null;
  emergencia: GrupoInfo | null;
  monitoreo: GrupoInfo | null;
};

type Args = {
  autoLoad?: boolean;
};

// ============================================================
// CONSTANTES
// ============================================================

const EMPTY_REACTIONS: Record<ReactionType, number> = {
  like: 0,
  love: 0,
  haha: 0,
  sad: 0,
  angry: 0,
};

const REACTION_KEYS: ReactionType[] = ["like", "love", "haha", "sad", "angry"];

const esReaccionValida = (v: any): v is ReactionType =>
  typeof v === "string" && REACTION_KEYS.includes(v as ReactionType);

const MAX_VIDEO_MB = 100;
const MAX_IMAGE_MB = 20;
const MAX_AUDIO_SECONDS = 120;

// ✅ CAMBIO #6: polling global a 5 min (antes 60s)
const GLOBAL_POLLING_INTERVAL = 300_000;

// Debounce para eventos del WS (agrupa ráfagas en 1 fetch)
const WS_RELOAD_DEBOUNCE_MS = 2000;

// ============================================================
// HOOK
// ============================================================

export function useComunidad({ autoLoad = true }: Args = {}) {
  // ----------------------------------------------------------
  // Estado
  // ----------------------------------------------------------
  const [userData, setUserData] = useState<UserData | null>(null);

  const [grupo, setGrupo] = useState("");
  const [imgGrupo, setImgGrupo] = useState<string | null>(null);
  const [grupoData, setGrupoData] = useState<any>(null);
  const [grupos, setGrupos] = useState<GruposUsuario>({
    principal: null,
    emergencia: null,
    monitoreo: null,
  });
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [modalPost, setModalPost] = useState(false);
  const [textoPost, setTextoPost] = useState("");
  const [imagenPost, setImagenPost] = useState<string | null>(null);
  const [videoPost, setVideoPost] = useState<string | null>(null);
  const [audioPost, setAudioPost] = useState<string | null>(null);

  const [progresoSubida, setProgresoSubida] = useState(0);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [progresoCompresion, setProgresoCompresion] = useState(0);

  const [grabando, setGrabando] = useState(false);
  const [duracionAudio, setDuracionAudio] = useState(0);

  const [modalComment, setModalComment] = useState<number | null>(null);
  const [textoComment, setTextoComment] = useState("");
  const [scope, setScope] = useState<Scope>("principal");

  // ----------------------------------------------------------
  // 🎤 Audio recorder
  // ----------------------------------------------------------
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----------------------------------------------------------
  // Derivados
  // ----------------------------------------------------------
  const grupoId = userData?.grupo_id ?? null;
  const miUserId = userData?.id ?? null;

  const grupoIdActivo = useMemo(() => {
    if (scope === "principal") return grupos.principal?.id ?? null;
    if (scope === "emergencia") return grupos.emergencia?.id ?? null;
    if (scope === "monitoreo") return grupos.monitoreo?.id ?? null;
    return null;
  }, [scope, grupos]);

  // ----------------------------------------------------------
  // Refs anti-bucle
  // ----------------------------------------------------------
  const mountedRef = useRef(true);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const lastFocusFetchRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  const scopeRef = useRef<Scope>(scope);
  const gruposRef = useRef<GruposUsuario>(grupos);

  const wsCallbacksRef = useRef({
    onPostCreated: (_p: any) => {},
    onCommentCreated: (_p: any) => {},
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  useEffect(() => {
    gruposRef.current = grupos;
  }, [grupos]);

  // ----------------------------------------------------------
  // Init: leer userData
  // ----------------------------------------------------------
  useEffect(() => {
    (async () => {
      const u = await authService.getUserData();
      if (!mountedRef.current) return;
      if (u) setUserData(u as UserData);
    })();
  }, []);

  // ----------------------------------------------------------
  // Cargar info del grupo
  // ----------------------------------------------------------
  useEffect(() => {
    if (!grupoId) return;
    let active = true;

    (async () => {
      try {
        const { data } = await api.get(`/grupo/${grupoId}`);
        if (!active || !data?.res) return;

        const g = data.grupo;
        setGrupoData(g);

        const imgAdmin =
          g?.admin?.logo_url ||
          g?.admin?.portada_url ||
          g?.admin?.avatar_url ||
          g?.img_url ||
          null;

        setImgGrupo(imgAdmin);

        if (g?.group_name) setGrupo(g.group_name);

        setGrupos({
          principal: g ? { id: g.id, name: g.group_name } : null,
          emergencia: g?.grupo_emergencia
            ? { id: g.grupo_emergencia.id, name: g.grupo_emergencia.group_name }
            : null,
          monitoreo: g?.grupo_monitoreo
            ? { id: g.grupo_monitoreo.id, name: g.grupo_monitoreo.group_name }
            : null,
        });
      } catch (e) {
        // silencioso
      }
    })();

    return () => {
      active = false;
    };
  }, [grupoId]);

  // ----------------------------------------------------------
  // Helper: ID del grupo destino
  // ----------------------------------------------------------
  const getGroupIdParaPublicar = useCallback((): number | null => {
    if (scope === "global") return userData?.grupo_id ?? null;
    if (scope === "principal") return grupos.principal?.id ?? null;
    if (scope === "emergencia") return grupos.emergencia?.id ?? null;
    if (scope === "monitoreo") return grupos.monitoreo?.id ?? null;
    return null;
  }, [scope, grupos, userData]);

  // ----------------------------------------------------------
  // Fetch publicaciones — IDENTIDAD ESTABLE
  // ----------------------------------------------------------
  const cargarPublicaciones = useCallback(async (scopeOverride?: Scope) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const scopeActual = scopeOverride ?? scopeRef.current;
    const gruposActual = gruposRef.current;

    const backendScope = scopeActual === "global" ? "global" : "group";

    let groupIdFiltro: number | null = null;
    if (scopeActual === "principal")
      groupIdFiltro = gruposActual.principal?.id ?? null;
    else if (scopeActual === "emergencia")
      groupIdFiltro = gruposActual.emergencia?.id ?? null;
    else if (scopeActual === "monitoreo")
      groupIdFiltro = gruposActual.monitoreo?.id ?? null;

    try {
      const params: any = { scope: backendScope };
      if (groupIdFiltro) params.group_id = groupIdFiltro;

      const { data } = await api.get("/publication", { params });
      if (!mountedRef.current) return;

      if (data?.res) {
        const pubs: Publicacion[] = (data.publicaciones ?? []).map(
          (p: any) => ({
            ...p,
            video: p.video ?? null,
            audio: p.audio ?? null,
            reacciones: { ...EMPTY_REACTIONS, ...(p.reacciones ?? {}) },
            mi_reaccion: p.mi_reaccion ?? null,
            user_data: p.user_data
              ? {
                  id: p.user_data.id,
                  nombre: p.user_data.nombre,
                  avatar_url: p.user_data.avatar_url ?? null,
                }
              : undefined,
            links: Array.isArray(p.links) ? p.links : [],
          }),
        );
        setPublicaciones(pubs);
      }
    } catch (e: any) {
      if (__DEV__) {
        console.error(
          "[useComunidad] error fetch:",
          e?.message,
          e?.response?.data,
        );
      }
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // scheduleReload (debounce para eventos WS)
  // ----------------------------------------------------------
  const scheduleReload = useCallback(() => {
    if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
    reloadTimeoutRef.current = setTimeout(() => {
      reloadTimeoutRef.current = null;
      if (mountedRef.current) cargarPublicaciones();
    }, WS_RELOAD_DEBOUNCE_MS);
  }, [cargarPublicaciones]);

  // ----------------------------------------------------------
  // Carga inicial
  // ----------------------------------------------------------
  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    if (!userData?.grupo_id) return;
    if (!grupos.principal?.id) return;

    initialLoadDoneRef.current = true;
    setLoading(true);
    cargarPublicaciones();
  }, [userData?.grupo_id, grupos.principal?.id, cargarPublicaciones]);

  // ----------------------------------------------------------
  // cambiarScope
  // ----------------------------------------------------------
  const cambiarScope = useCallback(
    (nuevoScope: Scope) => {
      if (nuevoScope === scope) return;
      setScope(nuevoScope);
      setLoading(true);
      setPublicaciones([]);
      cargarPublicaciones(nuevoScope);
    },
    [scope, cargarPublicaciones],
  );

  // ----------------------------------------------------------
  // useFocusEffect (con throttle)
  // ----------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      if (!autoLoad) return;

      const now = Date.now();
      if (now - lastFocusFetchRef.current < 3000) return;
      lastFocusFetchRef.current = now;

      let active = true;
      (async () => {
        const ok = await authService.isAuthenticated();
        if (!active || !ok) return;
        if (mountedRef.current) setLoading(true);
        cargarPublicaciones();
      })();

      return () => {
        active = false;
      };
    }, [autoLoad, cargarPublicaciones]),
  );

  // ----------------------------------------------------------
  // onRefresh
  // ----------------------------------------------------------
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPublicaciones();
  }, [cargarPublicaciones]);

  // ----------------------------------------------------------
  // ✅ CAMBIO #6: Polling global (5 min + condicional al WS)
  // ----------------------------------------------------------
  useEffect(() => {
    if (scope !== "global") return;

    const pusher = (globalThis as any).__pusher_instance;
    const isConnected = pusher?.connection?.state === "connected";
    if (isConnected) return;

    const interval = setInterval(() => {
      cargarPublicaciones("global");
    }, GLOBAL_POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [scope, cargarPublicaciones]);

  // ----------------------------------------------------------
  // WEBSOCKET
  // ----------------------------------------------------------
  useEffect(() => {
    wsCallbacksRef.current.onPostCreated = (payload: any) => {
      if (!mountedRef.current) return;
      if (miUserId && payload?.userId === miUserId) return;
      scheduleReload();
    };
    wsCallbacksRef.current.onCommentCreated = (payload: any) => {
      if (!mountedRef.current) return;
      if (miUserId && payload?.userId === miUserId) return;
      scheduleReload();
    };
  }, [miUserId, scheduleReload]);

  useRealtimeComunidad({
    groupIds: [
      grupos.principal?.id,
      grupos.emergencia?.id,
      grupos.monitoreo?.id,
    ].filter((id): id is number => typeof id === "number" && id > 0),

    onPostCreated: useCallback(
      (p: any) => wsCallbacksRef.current.onPostCreated(p),
      [],
    ),

    onCommentCreated: useCallback(
      (p: any) => wsCallbacksRef.current.onCommentCreated(p),
      [],
    ),

    onPostDeleted: useCallback((payload: any) => {
      if (!mountedRef.current) return;
      if (!payload?.id) return;
      setPublicaciones((prev) => prev.filter((p) => p.id !== payload.id));
    }, []),

    onPostReacted: useCallback(
      (payload: any) => {
        if (!mountedRef.current) return;
        if (miUserId && payload.userId === miUserId) return;

        const tipoAnterior: ReactionType | null = esReaccionValida(
          payload.tipoAnterior,
        )
          ? payload.tipoAnterior
          : null;
        const tipoNuevo: ReactionType | null = esReaccionValida(payload.type)
          ? payload.type
          : null;
        const esRemoved = payload.accion === "removed";

        setPublicaciones((prev) =>
          prev.map((p) => {
            if (p.id !== payload.postId) return p;
            const counts: Record<ReactionType, number> = {
              ...EMPTY_REACTIONS,
              ...(p.reacciones ?? {}),
            };
            if (tipoAnterior && counts[tipoAnterior] > 0)
              counts[tipoAnterior]--;
            if (!esRemoved && tipoNuevo)
              counts[tipoNuevo] = (counts[tipoNuevo] || 0) + 1;
            return { ...p, reacciones: counts };
          }),
        );
      },
      [miUserId],
    ),
  });

  // ----------------------------------------------------------
  // 🎤 GRABACIÓN DE AUDIO
  // ----------------------------------------------------------
  const iniciarGrabacion = useCallback(async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso al micrófono.");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setGrabando(true);
      setDuracionAudio(0);

      timerRef.current = setInterval(() => {
        setDuracionAudio((d) => {
          if (d + 1 >= MAX_AUDIO_SECONDS) {
            detenerGrabacion();
            return MAX_AUDIO_SECONDS;
          }
          return d + 1;
        });
      }, 1000);
    } catch (e) {
      console.error("[iniciarGrabacion]", e);
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  }, [audioRecorder]);

  const detenerGrabacion = useCallback(async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = audioRecorder.uri;
      setGrabando(false);
      setDuracionAudio(0);

      if (uri) {
        setAudioPost(uri);
        setImagenPost(null);
        setVideoPost(null);
      }
    } catch (e) {
      console.error("[detenerGrabacion]", e);
    }
  }, [audioRecorder]);

  const cancelarAudio = useCallback(async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }
    } catch (e) {
      console.error("[cancelarAudio]", e);
    }
    setGrabando(false);
    setDuracionAudio(0);
    setAudioPost(null);
  }, [audioRecorder]);

  // ----------------------------------------------------------
  // Seleccionar IMAGEN
  // ----------------------------------------------------------
  const seleccionarImagen = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      setImagenPost(a.uri);
      setVideoPost(null);
      setAudioPost(null);
    }
  }, []);

  // ----------------------------------------------------------
  // Seleccionar VIDEO
  // ----------------------------------------------------------
  const seleccionarVideo = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.5,
      videoMaxDuration: 300,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const a = result.assets[0];
    const originalUri = a.uri;

    try {
      const info = new File(originalUri);
      const sizeMB = (info.size ?? 0) / (1024 * 1024);

      if (sizeMB > 20) {
        setComprimiendo(true);
        setProgresoCompresion(0);

        const comprimido = await VideoCompressor.compress(
          originalUri,
          { compressionMethod: "auto", minimumFileSizeForCompress: 10 },
          (progress) => {
            if (mountedRef.current)
              setProgresoCompresion(Math.round(progress * 100));
          },
        );

        const infoComp = new File(comprimido);
        const sizeCompMB = (infoComp.size ?? 0) / (1024 * 1024);

        if (sizeCompMB > MAX_VIDEO_MB) {
          Alert.alert(
            "Video muy grande",
            `El video pesa ${sizeCompMB.toFixed(1)} MB después de comprimir. El límite es ${MAX_VIDEO_MB} MB.`,
          );
          setComprimiendo(false);
          setProgresoCompresion(0);
          return;
        }

        setVideoPost(comprimido);
      } else {
        setVideoPost(originalUri);
      }

      setImagenPost(null);
      setAudioPost(null);
    } catch (err) {
      setVideoPost(originalUri);
      setImagenPost(null);
      setAudioPost(null);
    } finally {
      if (mountedRef.current) {
        setComprimiendo(false);
        setProgresoCompresion(0);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Modal post
  // ----------------------------------------------------------
  const abrirModalPost = useCallback(() => {
    setModalPost(true);
    setProgresoSubida(0);
  }, []);

  const cerrarModalPost = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setModalPost(false);
    setTextoPost("");
    setImagenPost(null);
    setVideoPost(null);
    setAudioPost(null);
    setProgresoSubida(0);
    setComprimiendo(false);
    setProgresoCompresion(0);
    setGrabando(false);
    setDuracionAudio(0);
  }, []);

  // ----------------------------------------------------------
  // ✅ CAMBIO #4: CREAR PUBLICACIÓN (inserción local)
  // ----------------------------------------------------------
  const crearPublicacion = useCallback(async () => {
    if (!textoPost.trim() && !imagenPost && !videoPost && !audioPost) {
      Alert.alert("Atención", "Escribe algo o agrega una imagen/video/audio.");
      return;
    }

    if (mountedRef.current) {
      setEnviando(true);
      setProgresoSubida(0);
    }

    try {
      const form = new FormData();
      form.append("txt", textoPost.trim());

      const groupDestino = getGroupIdParaPublicar();
      if (groupDestino) {
        form.append("group_id", String(groupDestino));
      }

      if (imagenPost) {
        const ext =
          imagenPost.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
        const mime =
          ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "png"
              ? "image/png"
              : ext === "gif"
                ? "image/gif"
                : ext === "webp"
                  ? "image/webp"
                  : `image/${ext}`;

        // @ts-ignore
        form.append("img", {
          uri: imagenPost,
          name: `post_${Date.now()}.${ext}`,
          type: mime,
        } as any);
      }

      if (videoPost) {
        const ext =
          videoPost.split(".").pop()?.split("?")[0]?.toLowerCase() || "mp4";
        const mime = ext === "mov" ? "video/quicktime" : `video/${ext}`;

        // @ts-ignore
        form.append("video", {
          uri: videoPost,
          name: `video_${Date.now()}.${ext}`,
          type: mime,
        } as any);
      }

      if (audioPost) {
        const ext =
          audioPost.split(".").pop()?.split("?")[0]?.toLowerCase() || "m4a";
        const mime =
          ext === "m4a"
            ? "audio/m4a"
            : ext === "mp3"
              ? "audio/mpeg"
              : `audio/${ext}`;

        // @ts-ignore
        form.append("audio", {
          uri: audioPost,
          name: `audio_${Date.now()}.${ext}`,
          type: mime,
        } as any);
      }

      const { data } = await api.post("/publication/save", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total ?? 1;
          const pct = Math.round((progressEvent.loaded * 100) / total);
          if (mountedRef.current) setProgresoSubida(pct);
        },
      });

      if (data?.res) {
        cerrarModalPost();

        // ✅ Inserción local si el backend devuelve la publicación
        if (data.publicacion) {
          const nueva: Publicacion = {
            ...data.publicacion,
            video: data.publicacion.video ?? null,
            audio: data.publicacion.audio ?? null,
            reacciones: {
              ...EMPTY_REACTIONS,
              ...(data.publicacion.reacciones ?? {}),
            },
            mi_reaccion: data.publicacion.mi_reaccion ?? null,
            comentarios: data.publicacion.comentarios ?? [],
            links: Array.isArray(data.publicacion.links)
              ? data.publicacion.links
              : [],
          };
          setPublicaciones((prev) => [nueva, ...prev]);
        } else {
          // Fallback: refetch global
          cargarPublicaciones();
        }
      } else {
        Alert.alert("Error", data?.msg ?? "No se pudo publicar");
      }
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.msg ?? e?.message ?? "Error de red",
      );
    } finally {
      if (mountedRef.current) {
        setEnviando(false);
        setProgresoSubida(0);
      }
    }
  }, [
    textoPost,
    imagenPost,
    videoPost,
    audioPost,
    cerrarModalPost,
    cargarPublicaciones,
    getGroupIdParaPublicar,
  ]);

  // ----------------------------------------------------------
  // Eliminar publicación
  // ----------------------------------------------------------
  const eliminarPublicacion = useCallback((id: number) => {
    Alert.alert("Eliminar", "¿Seguro que deseas eliminar esta publicación?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await api.delete(`/publication/delete/${id}`);
            if (data?.res) {
              if (mountedRef.current) {
                setPublicaciones((prev) => prev.filter((p) => p.id !== id));
              }
            } else {
              Alert.alert("Error", data?.msg ?? "No se pudo eliminar");
            }
          } catch (e: any) {
            Alert.alert(
              "Error",
              e?.response?.data?.msg ?? e?.message ?? "Error de red",
            );
          }
        },
      },
    ]);
  }, []);

  // ----------------------------------------------------------
  // Modal comentario
  // ----------------------------------------------------------
  const abrirModalComment = useCallback((postId: number) => {
    setModalComment(postId);
    setTextoComment("");
  }, []);

  const cerrarModalComment = useCallback(() => {
    setModalComment(null);
    setTextoComment("");
  }, []);

  // ----------------------------------------------------------
  // ✅ CAMBIO #4: ENVIAR COMENTARIO (actualización local)
  // ----------------------------------------------------------
  const enviarComentario = useCallback(async () => {
    if (modalComment === null) return;
    if (!textoComment.trim()) return;

    if (mountedRef.current) setEnviando(true);
    try {
      const { data } = await api.post(`/publication/comment/${modalComment}`, {
        comment: textoComment.trim(),
      });

      if (data?.res) {
        cerrarModalComment();

        // ✅ Actualización local si el backend devuelve el comentario
        if (data.comentario && modalComment !== null) {
          setPublicaciones((prev) =>
            prev.map((p) =>
              p.id === modalComment
                ? { ...p, comentarios: [...p.comentarios, data.comentario] }
                : p,
            ),
          );
        } else {
          // Fallback: refetch global
          cargarPublicaciones();
        }
      } else {
        Alert.alert("Error", data?.msg ?? "No se pudo comentar");
      }
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.msg ?? e?.message ?? "Error de red",
      );
    } finally {
      if (mountedRef.current) setEnviando(false);
    }
  }, [modalComment, textoComment, cerrarModalComment, cargarPublicaciones]);

  // ----------------------------------------------------------
  // Reaccionar (optimista)
  // ----------------------------------------------------------
  const reaccionar = useCallback(
    async (postId: number, type: ReactionType) => {
      if (mountedRef.current) {
        setPublicaciones((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const anterior = p.mi_reaccion;
            const counts: Record<ReactionType, number> = {
              ...EMPTY_REACTIONS,
              ...(p.reacciones ?? {}),
            };
            if (anterior && counts[anterior] > 0) counts[anterior]--;
            const nueva = anterior === type ? null : type;
            if (nueva) counts[nueva] = (counts[nueva] || 0) + 1;
            return { ...p, reacciones: counts, mi_reaccion: nueva };
          }),
        );
      }

      try {
        await api.post(`/publication/${postId}/reaccionar`, { type });
      } catch (e) {
        if (mountedRef.current) cargarPublicaciones();
      }
    },
    [cargarPublicaciones],
  );

  // ----------------------------------------------------------
  // Helper
  // ----------------------------------------------------------
  const esMia = useCallback(
    (pub: Publicacion) => {
      if (pub.user_id && userData?.id) return pub.user_id === userData.id;
      return !!userData?.nombre && pub.user.includes(userData.nombre);
    },
    [userData],
  );

  return {
    grupo,
    imgGrupo,
    grupoData,
    grupos,
    publicaciones,
    baseUrl: getMediaBaseUrl(),

    loading,
    refreshing,
    enviando,
    progresoSubida,
    comprimiendo,
    progresoCompresion,

    modalPost,
    textoPost,
    imagenPost,
    videoPost,
    audioPost,
    setTextoPost,
    abrirModalPost,
    cerrarModalPost,
    seleccionarImagen,
    seleccionarVideo,
    crearPublicacion,

    grabando,
    duracionAudio,
    iniciarGrabacion,
    detenerGrabacion,
    cancelarAudio,

    modalComment,
    textoComment,
    setTextoComment,
    abrirModalComment,
    cerrarModalComment,
    enviarComentario,

    onRefresh,
    eliminarPublicacion,
    esMia,
    reaccionar,
    scope,
    cambiarScope,
    getGroupIdParaPublicar,
  };
}

export type UseComunidadReturn = ReturnType<typeof useComunidad>;
