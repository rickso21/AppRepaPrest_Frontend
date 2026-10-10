import { AudioSession } from "@livekit/react-native";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { api } from "../../services/conector/api";

async function getStorage(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export function useLiveKitToken(conectado: boolean) {
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);

  // tokenRef = token de sesión de TU API (userToken)
  const tokenRef = useRef<string | null>(null);
  const fetchingTokenRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getStorage("userToken").then((t) => {
      if (!active) return;
      tokenRef.current = t;
    });
    return () => {
      active = false;
    };
  }, []);

  //limpiar cuando conectado === false
  useEffect(() => {
    // Si no está conectado → limpia estado y no hagas nada
    if (!conectado) {
      setLivekitToken(null);
      setLivekitUrl(null);
      fetchingTokenRef.current = false;
      return;
    }

    // Evita doble fetch si ya está en curso
    if (fetchingTokenRef.current) return;

    const tryFetch = async () => {
      if (!tokenRef.current) {
        // Espera corta por si el SecureStore aún no resolvió
        await new Promise((r) => setTimeout(r, 200));
        if (!tokenRef.current) {
          console.warn("[LiveKit] userToken no disponible todavía");
          return;
        }
      }

      fetchingTokenRef.current = true;
      try {
        const { data } = await api.post("/livekit/token");
        if (data?.res && mountedRef.current) {
          setLivekitToken(data.data.token);
          setLivekitUrl(data.data.url);
        } else {
          console.warn("[LiveKit] respuesta sin token:", data);
        }
      } catch (err) {
        console.error("[LiveKit] Error al obtener token:", err);
      } finally {
        fetchingTokenRef.current = false;
      }
    };

    tryFetch();
  }, [conectado]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (conectado) {
          await AudioSession.startAudioSession();
        } else {
          await AudioSession.stopAudioSession();
        }
      } catch (err) {
        if (active) console.error("[AudioSession] Error:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [conectado]);

  return { livekitToken, livekitUrl, tokenRef };
}
