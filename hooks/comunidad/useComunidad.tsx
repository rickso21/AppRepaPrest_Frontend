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

// 🔧 FIX #11/#16: convierte cualquier id (number | string | null | "") a number > 0
//    o null. Evita que Number("") === 0 / Number(null) === 0 se tomen como ids
//    válidos y evita comparar "5" === 5 (siempre false).
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

// 🔧 FIX #2/#3: UNA sola función decide el group_id de cada scope. Para
//    "principal" cae al grupo_id del usuario, así NUNCA se pide el feed sin
//    filtrar mientras /grupo/:id todavía no responde.
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

// 🔧 FIX #4: normaliza SIEMPRE una publicación del backend. Antes `comentarios`
//    podía venir undefined y reventaba PostCard (`.length`) y enviarComentario
//    (`[...p.comentarios]`). Se usa tanto al listar como al crear.
const normalizarPublicacion = (p: any): Publicacion => ({
  ...p,
  post: p?.post ?? "",
  image: p?.image ?? null,
  video: p?.video ?? null,
  audio: p?.audio ?? null,
  user: p?.user ?? "",
  comentarios: Array.isArray(p?.comentarios) ? p.comentarios : [],
  reacciones: { ...EMPTY_REACTIONS, ...(p?.reacciones ?? {}) },
  mi_reaccion: p?.mi_reaccion ?? null,
  user_data: p?.user_data
    ? {
        id: p.user_data.id,
        nombre: p.user_data.nombre,
        avatar_url: p.user_data.avatar_url ?? null,
      }
    : undefined,
  links: Array.isArray(p?.links) ? p.links : [],
});

const MAX_VIDEO_MB = 100;
const MAX_IMAGE_MB = 20;
const MAX_AUDIO_SECONDS = 120;

// 🔧 FIX #7: constantes para validar tamaños (antes MAX_IMAGE_MB no se usaba
//    y el umbral de compresión estaba "hardcodeado" como 20).
const MB = 1024 * 1024;
const VIDEO_COMPRESS_THRESHOLD_MB = 20;

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
  // 🔧 FIX #2: se reemplaza el booleano `inFlightRef` (que DESCARTABA peticiones
  //    legítimas) por un id de petición: "gana la última" y las respuestas viejas
  //    se ignoran. `inFlightKeyRef` solo evita duplicar la MISMA petición.
  const requestIdRef = useRef(0);
  const inFlightKeyRef = useRef<string | null>(null);
  const userDataRef = useRef<UserData | null>(null);
  const enviandoRef = useRef(false); // 🔧 anti doble-tap en publicar/comentar
  const grabandoRef = useRef(false); // 🔧 estado de grabación legible sin closures viejas
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

  // 🔧 FIX #8: al salir de la pantalla se limpia el timer de grabación y se
  //    detiene el micrófono (antes quedaba grabando y el timer seguía
  //    llamando setState sobre un componente desmontado).
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

  // ----------------------------------------------------------
  // Init: leer userData
  // ----------------------------------------------------------
  useEffect(() => {
    (async () => {
      const u = await authService.getUserData();
      if (!mountedRef.current) return;
      if (u) {
        userDataRef.current = u as UserData; // 🔧 FIX #2: lo lee cargarPublicaciones
        setUserData(u as UserData);
      }
      // 🔧 FIX #3: si el usuario no tiene grupo no hay nada que cargar en
      //    "principal"; antes el spinner quedaba infinito.
      if (!u?.grupo_id) setLoading(false);
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
        // 🔧 Ya no es 100% silencioso: en desarrollo se ve por qué no cargó el grupo.
        if (__DEV__) console.warn("[useComunidad] error cargando grupo:", e);
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
    // En "global" se publica en el grupo propio (comportamiento original).
    if (scope === "global") return aNumero(userData?.grupo_id);
    return resolverGrupoId(scope, grupos, userData);
  }, [scope, grupos, userData]);

  // ----------------------------------------------------------
  // Fetch publicaciones — IDENTIDAD ESTABLE
  // ----------------------------------------------------------
  const cargarPublicaciones = useCallback(
    async (scopeOverride?: Scope, opts?: { force?: boolean }) => {
      const scopeActual = scopeOverride ?? scopeRef.current;
      const backendScope = scopeActual === "global" ? "global" : "group";
      const groupIdFiltro = resolverGrupoId(
        scopeActual,
        gruposRef.current,
        userDataRef.current,
      );

      // 🔧 FIX #3: nunca se pide un scope "group" SIN group_id (el backend
      //    devolvía el feed sin filtrar → publicaciones de otros grupos).
      if (backendScope === "group" && !groupIdFiltro) {
        if (scopeActual !== "principal") {
          // emergencia/monitoreo inexistente → lista vacía, sin spinner
          setPublicaciones([]);
          setLoading(false);
        } else if (userDataRef.current) {
          // usuario cargado pero sin grupo
          setLoading(false);
        }
        // principal con userData aún cargando: se espera; el efecto de carga
        // inicial volverá a llamar cuando el grupo sea conocido.
        setRefreshing(false);
        return;
      }

      // 🔧 FIX #2: misma petición ya en vuelo → no duplicar (salvo force)
      const key = `${backendScope}:${groupIdFiltro ?? "-"}`;
      if (!opts?.force && inFlightKeyRef.current === key) return;
      inFlightKeyRef.current = key;
      const myId = ++requestIdRef.current;

      try {
        const params: any = { scope: backendScope };
        if (groupIdFiltro) params.group_id = groupIdFiltro;

        const { data } = await api.get("/publication", { params });

        // 🔧 FIX #2: si mientras tanto se lanzó otra petición (p. ej. cambió el
        //    scope) esta respuesta es vieja y NO debe pisar el estado.
        if (!mountedRef.current || myId !== requestIdRef.current) return;

        if (data?.res) {
          setPublicaciones(
            (data.publicaciones ?? []).map(normalizarPublicacion),
          );
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
        // Solo la petición vigente apaga los indicadores de carga
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
    // 🔧 FIX #2/#3: ya NO se espera a /grupo/:id (grupos.principal). El grupo
    //    principal es userData.grupo_id, así la primera carga siempre va con
    //    group_id y no compite con la petición del foco.

    initialLoadDoneRef.current = true;
    setLoading(true);
    cargarPublicaciones();
  }, [userData?.grupo_id, cargarPublicaciones]);

  // ----------------------------------------------------------
  // cambiarScope
  // ----------------------------------------------------------
  const cambiarScope = useCallback(
    (nuevoScope: Scope) => {
      if (nuevoScope === scope) return;
      // 🔧 FIX #2: scopeRef se actualiza YA (el useEffect lo haría un render
      //    después) y se fuerza la petición: antes, si había una en vuelo, la
      //    del nuevo scope se descartaba y la lista quedaba vacía o con datos
      //    del scope anterior.
      scopeRef.current = nuevoScope;
      setScope(nuevoScope);
      setLoading(true);
      setPublicaciones([]);
      cargarPublicaciones(nuevoScope, { force: true });
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
        // 🔧 FIX #19: refresco silencioso. Antes `setLoading(true)` en cada foco
        //    reemplazaba toda la lista por un spinner (parpadeo al volver a la pantalla).
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

    // 🔧 FIX #21: el WS solo suscribe a los canales de TUS grupos
    //    (group.{id}); las publicaciones de otros grupos (lo que muestra
    //    "Global") nunca llegan por ahí. Antes el polling se omitía si el
    //    socket estaba conectado → Global quedaba desactualizado hasta
    //    refrescar a mano. Ahora Global siempre hace polling (cada 5 min).
    const interval = setInterval(() => {
      cargarPublicaciones("global");
    }, GLOBAL_POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [scope, cargarPublicaciones]);

  // ----------------------------------------------------------
  // WEBSOCKET
  // ----------------------------------------------------------
  useEffect(() => {
    // 🔧 FIX #17: comparación numérica (el payload puede traer "5" y el usuario 5).
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
        // 🔧 FIX #17: antes `payload.userId` sin `?.` → TypeError si llegaba un payload vacío.
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

  // ----------------------------------------------------------
  // 🎤 GRABACIÓN DE AUDIO
  // ----------------------------------------------------------
  const iniciarGrabacion = useCallback(async () => {
    if (grabandoRef.current) return; // 🔧 evita doble inicio
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

      grabandoRef.current = true;
      inicioGrabacionRef.current = Date.now();
      setGrabando(true);
      setDuracionAudio(0);

      if (timerRef.current) clearInterval(timerRef.current);

      // 🔧 FIX #8: antes se llamaba a `detenerGrabacion()` DENTRO del updater de
      //    setDuracionAudio (efecto secundario dentro de un updater: se ejecuta
      //    dos veces en StrictMode y usaba una versión vieja de la función).
      //    Ahora el tiempo se calcula con el reloj y se detiene vía ref.
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
      console.error("[iniciarGrabacion]", e);
      // 🔧 si falla a medias no se deja la UI "grabando"
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
    // 🔧 evita doble stop (límite de 120 s + botón "stop" casi a la vez)
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
      console.error("[detenerGrabacion]", e);
    } finally {
      // 🔧 FIX #8: antes `grabando` se quedaba en true si stop() lanzaba error
      if (mountedRef.current) {
        setGrabando(false);
        setDuracionAudio(0);
      }
    }
  }, [audioRecorder]);

  // Siempre apunta a la última versión (lo usa el timer del límite de duración)
  detenerGrabacionRef.current = detenerGrabacion;

  const cancelarAudio = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const estabaGrabando = grabandoRef.current;
    grabandoRef.current = false;

    // UI inmediata, no espera al módulo nativo
    setGrabando(false);
    setDuracionAudio(0);
    setAudioPost(null);

    try {
      if (estabaGrabando || audioRecorder.isRecording) {
        await audioRecorder.stop();
      }
      await setAudioModeAsync({ allowsRecording: false });
    } catch (e) {
      console.error("[cancelarAudio]", e);
    }
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

      // 🔧 FIX #7: MAX_IMAGE_MB estaba declarado pero nunca se validaba.
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

    // Tamaño original (fileSize del picker; si no viene, se lee del archivo)
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
      // La compresión falló: se intenta con el original... pero YA validando tamaño.
      uriFinal = originalUri;
      sizeFinalMB = sizeOriginalMB;
    } finally {
      if (mountedRef.current) {
        setComprimiendo(false);
        setProgresoCompresion(0);
      }
    }

    // 🔧 FIX #7: antes, si la compresión lanzaba error, el `catch` aceptaba el
    //    video original SIN comprobar MAX_VIDEO_MB (se podía subir un video de
    //    500 MB y el upload fallaba/colgaba). Ahora el límite se valida SIEMPRE.
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

    // 🔧 FIX #8: si se cierra el modal mientras se graba, también se detiene el
    //    micrófono (antes solo se reseteaba el estado visual y seguía grabando).
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

  // ----------------------------------------------------------
  // ✅ CAMBIO #4: CREAR PUBLICACIÓN (inserción local)
  // ----------------------------------------------------------
  const crearPublicacion = useCallback(async () => {
    // 🔧 FIX #5: no se puede publicar a mitad de compresión/grabación ni dos
    //    veces seguidas (doble tap → publicación duplicada).
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
          // 🔧 FIX #9: antes `total ?? 1` daba porcentajes absurdos (loaded*100)
          //    cuando el total no se conoce todavía.
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

        // ✅ Inserción local si el backend devuelve la publicación
        if (data.publicacion) {
          // 🔧 FIX #4/#16: se normaliza (comentarios siempre array) y, si el
          //    backend no manda autor, se completa con el usuario actual. Sin
          //    esto la publicación nueva no mostraba el botón de eliminar
          //    (esMia no la reconocía) ni el nombre del autor.
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
          // 🔧 sin duplicados si un reload (WS/foco) ya trajo esta publicación
          setPublicaciones((prev) =>
            prev.some((p) => p.id === nueva.id) ? prev : [nueva, ...prev],
          );
        } else {
          // Fallback: refetch (forzado para que no lo descarte otra petición)
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
    if (enviandoRef.current) return; // 🔧 anti doble-tap (comentario duplicado)
    enviandoRef.current = true;

    const postId = modalComment;
    if (mountedRef.current) setEnviando(true);
    try {
      const { data } = await api.post(`/publication/comment/${postId}`, {
        comment: textoComment.trim(),
      });

      if (data?.res) {
        cerrarModalComment();

        // Actualización local si el backend devuelve el comentario
        if (data.comentario) {
          setPublicaciones((prev) =>
            prev.map((p) => {
              if (p.id !== postId) return p;
              const actuales = p.comentarios ?? [];
              if (
                data.comentario.id != null &&
                actuales.some((c) => c.id === data.comentario.id)
              )
                return p;
              return { ...p, comentarios: [...actuales, data.comentario] };
            }),
          );
        } else {
          // Fallback: refetch (forzado)
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
        //forzado: si había otra petición en vuelo, el rollback se perdía
        // y la reacción "optimista" fallida quedaba mostrada.
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
      // 1) Por id (comparación numérica; también mira user_data.id)
      const miId = aNumero(userData?.id);
      const autorId = aNumero(pub.user_data?.id ?? pub.user_id);
      if (miId && autorId) return miId === autorId;

      // allback SOLO si el backend no mandó ids: nombre EXACTO.
      // antes `pub.user.includes(nombre)` marcaba como "mía"
      //    cualquier publicación de "Mariana" para el usuario "Ana" (y mostraba
      //    el botón eliminar), y reventaba si `pub.user` era undefined.
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
