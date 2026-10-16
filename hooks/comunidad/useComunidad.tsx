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
import { detectarTipoLink, extraerUrls } from "../../components/utils/mapsLink";
import { authService } from "../../services/auth/AuthService";
import { api, getMediaBaseUrl } from "../../services/conector/api";
import { useRealtimeComunidad } from "./useRealtimeComunidad";

// TIPOS

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
  | "whatsapp"
  | "maps";

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

// CONSTANTES
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

const aNumero = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const mismoUsuario = (a: any, b: any): boolean => {
  const x = aNumero(a);
  const y = aNumero(b);
  return x !== null && y !== null && x === y;
};

const normalizarNombre = (s?: string | null): string =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const resolverGrupoId = (
  scope: Scope,
  grupos: GruposUsuario,
  userData: UserData | null,
): number | null => {
  if (scope === "principal")
    return grupos.principal?.id ?? aNumero(userData?.grupo_id);
  if (scope === "emergencia") return grupos.emergencia?.id ?? null;
  if (scope === "monitoreo") return grupos.monitoreo?.id ?? null;
  return null; // "global" no filtra por grupo
};

// 🔧 Convierte fecha+hora UTC a hora local del dispositivo
function convertirFechaHoraLocal(
  fechaRaw: string,
  horaRaw: string,
): { fecha: string; hora: string } {
  try {
    if (!fechaRaw || !horaRaw) {
      return { fecha: fechaRaw, hora: horaRaw };
    }

    // 1) Parsear fecha según su formato
    let year: number, month: number, day: number;

    if (fechaRaw.includes("/")) {
      // Formato DD/MM/YYYY
      const [d, m, y] = fechaRaw.split("/").map(Number);
      day = d;
      month = m;
      year = y;
    } else if (fechaRaw.includes("-")) {
      // Formato YYYY-MM-DD
      const [y, m, d] = fechaRaw.split("-").map(Number);
      year = y;
      month = m;
      day = d;
    } else {
      return { fecha: fechaRaw, hora: horaRaw };
    }

    // 2) Parsear hora (con o sin segundos)
    const horaPartes = horaRaw.split(":").map(Number);
    const hh = horaPartes[0] ?? 0;
    const mm = horaPartes[1] ?? 0;
    const ss = horaPartes[2] ?? 0;

    // 3) Validar
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      !Number.isFinite(hh) ||
      !Number.isFinite(mm)
    ) {
      return { fecha: fechaRaw, hora: horaRaw };
    }

    // 4) Construir Date como UTC
    //    month - 1 porque Date usa 0-11 para meses
    const date = new Date(Date.UTC(year, month - 1, day, hh, mm, ss));

    if (isNaN(date.getTime())) {
      return { fecha: fechaRaw, hora: horaRaw };
    }

    // 5) Extraer valores locales
    const yearL = date.getFullYear();
    const monthL = String(date.getMonth() + 1).padStart(2, "0");
    const dayL = String(date.getDate()).padStart(2, "0");
    const hoursL = String(date.getHours()).padStart(2, "0");
    const minutesL = String(date.getMinutes()).padStart(2, "0");

    // 6) Devolver en el MISMO formato que el backend (DD/MM/YYYY + HH:MM)
    return {
      fecha: `${dayL}/${monthL}/${yearL}`,
      hora: `${hoursL}:${minutesL}`,
    };
  } catch {
    return { fecha: fechaRaw, hora: horaRaw };
  }
}
const normalizarPublicacion = (p: any): Publicacion => {
  const post: string = p?.post ?? "";

  // 1) Links del backend (si vienen)
  let links: LinkDetectado[] = Array.isArray(p?.links) ? p.links : [];

  // 2) Fallback: detectar en el frontend si el backend no los manda
  if (links.length === 0 && post) {
    links = extraerUrls(post)
      .map((u) => {
        const tipo = detectarTipoLink(u);
        return tipo ? { tipo, url: u } : null;
      })
      .filter((x): x is LinkDetectado => x !== null);
  }

  // 🔧 Convertir fecha/hora UTC a local
  const { fecha: fechaLocal, hora: horaLocal } = convertirFechaHoraLocal(
    p?.fecha ?? "",
    p?.hora ?? "",
  );

  const comentariosNormalizados = Array.isArray(p?.comentarios)
    ? p.comentarios.map((c: any) => {
        const { fecha: cf, hora: ch } = convertirFechaHoraLocal(
          c?.fecha ?? "",
          c?.hora ?? "",
        );
        return { ...c, fecha: cf, hora: ch };
      })
    : [];

  return {
    ...p,
    post,
    image: p?.image ?? null,
    video: p?.video ?? null,
    audio: p?.audio ?? null,
    user: p?.user ?? "",
    fecha: fechaLocal,
    hora: horaLocal,
    comentarios: comentariosNormalizados,
    reacciones: { ...EMPTY_REACTIONS, ...(p?.reacciones ?? {}) },
    mi_reaccion: p?.mi_reaccion ?? null,
    user_data: p?.user_data
      ? {
          id: p.user_data.id,
          nombre: p.user_data.nombre,
          avatar_url: p.user_data.avatar_url ?? null,
        }
      : undefined,
    links,
  };
};

const MAX_VIDEO_MB = 100;
const MAX_IMAGE_MB = 20;
const MAX_AUDIO_SECONDS = 120;

const MB = 1024 * 1024;
const VIDEO_COMPRESS_THRESHOLD_MB = 20;

const GLOBAL_POLLING_INTERVAL = 300_000;

const WS_RELOAD_DEBOUNCE_MS = 2000;

// HOOK

export function useComunidad({ autoLoad = true }: Args = {}) {
  // Estado
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

  // Audio recorder
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const requestIdRef = useRef(0);
  const inFlightKeyRef = useRef<string | null>(null);
  const userDataRef = useRef<UserData | null>(null);
  const enviandoRef = useRef(false);
  const grabandoRef = useRef(false);
  const inicioGrabacionRef = useRef(0);
  const detenerGrabacionRef = useRef<() => void>(() => {});
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
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        if (audioRecorder.isRecording) {
          Promise.resolve(audioRecorder.stop()).catch(() => {});
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  useEffect(() => {
    gruposRef.current = grupos;
  }, [grupos]);

  useEffect(() => {
    (async () => {
      const u = await authService.getUserData();
      if (!mountedRef.current) return;
      if (u) {
        userDataRef.current = u as UserData;
        setUserData(u as UserData);
      }
      if (!u?.grupo_id) setLoading(false);
    })();
  }, []);

  // Cargar info del grupo
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
        // if (__DEV__) console.warn("[useComunidad] error cargando grupo:", e);
      }
    })();

    return () => {
      active = false;
    };
  }, [grupoId]);

  const getGroupIdParaPublicar = useCallback((): number | null => {
    if (scope === "global") return aNumero(userData?.grupo_id);
    return resolverGrupoId(scope, grupos, userData);
  }, [scope, grupos, userData]);

  // Fetch publicaciones — IDENTIDAD ESTABLE
  const cargarPublicaciones = useCallback(
    async (scopeOverride?: Scope, opts?: { force?: boolean }) => {
      const scopeActual = scopeOverride ?? scopeRef.current;
      const backendScope = scopeActual === "global" ? "global" : "group";
      const groupIdFiltro = resolverGrupoId(
        scopeActual,
        gruposRef.current,
        userDataRef.current,
      );

      if (backendScope === "group" && !groupIdFiltro) {
        if (scopeActual !== "principal") {
          setPublicaciones([]);
          setLoading(false);
        } else if (userDataRef.current) {
          setLoading(false);
        }
        setRefreshing(false);
        return;
      }

      const key = `${backendScope}:${groupIdFiltro ?? "-"}`;
      if (!opts?.force && inFlightKeyRef.current === key) return;
      inFlightKeyRef.current = key;
      const myId = ++requestIdRef.current;

      try {
        const params: any = { scope: backendScope };
        if (groupIdFiltro) params.group_id = groupIdFiltro;

        const { data } = await api.get("/publication", { params });

        if (!mountedRef.current || myId !== requestIdRef.current) return;

        if (data?.res) {
          setPublicaciones(
            (data.publicaciones ?? []).map(normalizarPublicacion),
          );
        }
      } catch (e: any) {
      } finally {
        if (myId === requestIdRef.current) {
          inFlightKeyRef.current = null;
          if (mountedRef.current) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      }
    },
    [],
  );

  // scheduleReload (debounce para eventos WS)
  const scheduleReload = useCallback(() => {
    if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
    reloadTimeoutRef.current = setTimeout(() => {
      reloadTimeoutRef.current = null;
      if (mountedRef.current) cargarPublicaciones();
    }, WS_RELOAD_DEBOUNCE_MS);
  }, [cargarPublicaciones]);

  // Carga inicial
  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    if (!userData?.grupo_id) return;
    initialLoadDoneRef.current = true;
    setLoading(true);
    cargarPublicaciones();
  }, [userData?.grupo_id, cargarPublicaciones]);

  // cambiarScope
  const cambiarScope = useCallback(
    (nuevoScope: Scope) => {
      if (nuevoScope === scope) return;
      scopeRef.current = nuevoScope;
      setScope(nuevoScope);
      setLoading(true);
      setPublicaciones([]);
      cargarPublicaciones(nuevoScope, { force: true });
    },
    [scope, cargarPublicaciones],
  );

  // useFocusEffect (con throttle)
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
        cargarPublicaciones();
      })();

      return () => {
        active = false;
      };
    }, [autoLoad, cargarPublicaciones]),
  );

  // onRefresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPublicaciones();
  }, [cargarPublicaciones]);

  useEffect(() => {
    if (scope !== "global") return;

    const interval = setInterval(() => {
      cargarPublicaciones("global");
    }, GLOBAL_POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [scope, cargarPublicaciones]);

  // WEBSOCKET
  useEffect(() => {
    wsCallbacksRef.current.onPostCreated = (payload: any) => {
      if (!mountedRef.current) return;
      if (mismoUsuario(payload?.userId, miUserId)) return;
      scheduleReload();
    };
    wsCallbacksRef.current.onCommentCreated = (payload: any) => {
      if (!mountedRef.current) return;
      if (mismoUsuario(payload?.userId, miUserId)) return;
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
        if (!payload) return;
        if (mismoUsuario(payload.userId, miUserId)) return;

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

  // GRABACIÓN DE AUDIO
  const iniciarGrabacion = useCallback(async () => {
    if (grabandoRef.current) return;
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso al micrófono.");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionModeAndroid: "doNotMix",
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      grabandoRef.current = true;
      inicioGrabacionRef.current = Date.now();
      setGrabando(true);
      setDuracionAudio(0);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        const seg = Math.floor(
          (Date.now() - inicioGrabacionRef.current) / 1000,
        );
        if (seg >= MAX_AUDIO_SECONDS) {
          detenerGrabacionRef.current();
          return;
        }
        setDuracionAudio(seg);
      }, 500);
    } catch (e) {
      grabandoRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setGrabando(false);
      setDuracionAudio(0);
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  }, [audioRecorder]);

  const detenerGrabacion = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!grabandoRef.current) return;
    grabandoRef.current = false;

    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = audioRecorder.uri;
      if (uri && mountedRef.current) {
        setAudioPost(uri);
        setImagenPost(null);
        setVideoPost(null);
      }
    } catch (e) {
    } finally {
      if (mountedRef.current) {
        setGrabando(false);
        setDuracionAudio(0);
      }
    }
  }, [audioRecorder]);

  detenerGrabacionRef.current = detenerGrabacion;

  const cancelarAudio = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const estabaGrabando = grabandoRef.current;
    grabandoRef.current = false;

    setGrabando(false);
    setDuracionAudio(0);
    setAudioPost(null);

    try {
      if (estabaGrabando || audioRecorder.isRecording) {
        await audioRecorder.stop();
      }
      await setAudioModeAsync({ allowsRecording: false });
    } catch (e) {}
  }, [audioRecorder]);

  // Seleccionar IMAGEN
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

      const sizeMB = (a.fileSize ?? 0) / MB;
      if (sizeMB > MAX_IMAGE_MB) {
        Alert.alert(
          "Imagen muy grande",
          `La imagen pesa ${sizeMB.toFixed(1)} MB. El límite es ${MAX_IMAGE_MB} MB.`,
        );
        return;
      }

      setImagenPost(a.uri);
      setVideoPost(null);
      setAudioPost(null);
    }
  }, []);

  // Seleccionar VIDEO
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

    let sizeOriginalMB = (a.fileSize ?? 0) / MB;
    if (!sizeOriginalMB) {
      try {
        sizeOriginalMB = (new File(originalUri).size ?? 0) / MB;
      } catch {}
    }

    let uriFinal = originalUri;
    let sizeFinalMB = sizeOriginalMB;

    try {
      if (sizeOriginalMB > VIDEO_COMPRESS_THRESHOLD_MB) {
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

        uriFinal = comprimido;
        try {
          sizeFinalMB = (new File(comprimido).size ?? 0) / MB;
        } catch {
          sizeFinalMB = sizeOriginalMB;
        }
      }
    } catch (err) {
      uriFinal = originalUri;
      sizeFinalMB = sizeOriginalMB;
    } finally {
      if (mountedRef.current) {
        setComprimiendo(false);
        setProgresoCompresion(0);
      }
    }
    if (sizeFinalMB > MAX_VIDEO_MB) {
      Alert.alert(
        "Video muy grande",
        `El video pesa ${sizeFinalMB.toFixed(1)} MB. El límite es ${MAX_VIDEO_MB} MB.`,
      );
      return;
    }

    setVideoPost(uriFinal);
    setImagenPost(null);
    setAudioPost(null);
  }, []);

  // Modal post
  const abrirModalPost = useCallback(() => {
    setModalPost(true);
    setProgresoSubida(0);
  }, []);

  const cerrarModalPost = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (grabandoRef.current || audioRecorder.isRecording) {
      grabandoRef.current = false;
      try {
        Promise.resolve(audioRecorder.stop()).catch(() => {});
      } catch {}
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
  }, [audioRecorder]);

  const crearPublicacion = useCallback(async () => {
    if (enviandoRef.current) return;
    if (comprimiendo || grabando) return;

    if (!textoPost.trim() && !imagenPost && !videoPost && !audioPost) {
      Alert.alert("Atención", "Escribe algo o agrega una imagen/video/audio.");
      return;
    }

    enviandoRef.current = true;
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
          if (!progressEvent.total) return;
          const pct = Math.min(
            100,
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
          );
          if (mountedRef.current) setProgresoSubida(pct);
        },
      });

      if (data?.res) {
        cerrarModalPost();

        if (data.publicacion) {
          const yo = userDataRef.current;
          const base = normalizarPublicacion(data.publicacion);
          const miId = aNumero(yo?.id);
          const nueva: Publicacion = {
            ...base,
            user_id: base.user_id ?? miId,
            user_data:
              base.user_data ??
              (yo && miId
                ? {
                    id: miId,
                    nombre:
                      [yo.nombre, yo.apellido_p].filter(Boolean).join(" ") ||
                      base.user,
                    avatar_url: yo.avatar_url ?? null,
                  }
                : undefined),
          };
          setPublicaciones((prev) =>
            prev.some((p) => p.id === nueva.id) ? prev : [nueva, ...prev],
          );
        } else {
          cargarPublicaciones(undefined, { force: true });
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
      enviandoRef.current = false;
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
    comprimiendo,
    grabando,
    cerrarModalPost,
    cargarPublicaciones,
    getGroupIdParaPublicar,
  ]);

  // Eliminar publicación
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

  // Modal comentario
  const abrirModalComment = useCallback((postId: number) => {
    setModalComment(postId);
    setTextoComment("");
  }, []);

  const cerrarModalComment = useCallback(() => {
    setModalComment(null);
    setTextoComment("");
  }, []);

  // ENVIAR COMENTARIO (actualización local)
  const enviarComentario = useCallback(async () => {
    if (modalComment === null) return;
    if (!textoComment.trim()) return;
    if (enviandoRef.current) return;
    enviandoRef.current = true;

    const postId = modalComment;
    if (mountedRef.current) setEnviando(true);
    try {
      const { data } = await api.post(`/publication/comment/${postId}`, {
        comment: textoComment.trim(),
      });

      if (data?.res) {
        cerrarModalComment();

        if (data.comentario) {
          // 🔧 Normalizar el comentario también (fecha/hora local)
          const comentarioNorm = {
            ...data.comentario,
            ...convertirFechaHoraLocal(
              data.comentario?.fecha ?? "",
              data.comentario?.hora ?? "",
            ),
          };

          setPublicaciones((prev) =>
            prev.map((p) => {
              if (p.id !== postId) return p;
              const actuales = p.comentarios ?? [];
              if (
                comentarioNorm.id != null &&
                actuales.some((c) => c.id === comentarioNorm.id)
              )
                return p;
              return { ...p, comentarios: [...actuales, comentarioNorm] };
            }),
          );
        } else {
          cargarPublicaciones(undefined, { force: true });
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
      enviandoRef.current = false;
      if (mountedRef.current) setEnviando(false);
    }
  }, [modalComment, textoComment, cerrarModalComment, cargarPublicaciones]);

  // Reaccionar
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
        if (mountedRef.current) cargarPublicaciones(undefined, { force: true });
      }
    },
    [cargarPublicaciones],
  );

  // ----------------------------------------------------------
  // Helper
  // ----------------------------------------------------------
  const esMia = useCallback(
    (pub: Publicacion) => {
      const miId = aNumero(userData?.id);
      const autorId = aNumero(pub.user_data?.id ?? pub.user_id);
      if (miId && autorId) return miId === autorId;
      const autor = normalizarNombre(pub.user);
      if (!autor) return false;
      const nombre = normalizarNombre(userData?.nombre);
      const completo = normalizarNombre(
        [userData?.nombre, userData?.apellido_p, userData?.apellido_m]
          .filter(Boolean)
          .join(" "),
      );
      return autor === nombre || autor === completo;
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
