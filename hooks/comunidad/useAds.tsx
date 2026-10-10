import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/services/conector/api";

export type Ad = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  phone: string | null;
  cta_text: string;
  merchant: {
    id: number | null;
    nombre: string;
  };
};

const ADS_CACHE_KEY = "@ads_cache_v1";
const ADS_CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutos

// FIX #13: el set vive a nivel de módulo → "una sola vez por sesión por
//    anuncio" ahora es cierto de verdad. Antes era un useRef por instancia del
//    hook: cada vez que se reabría la pantalla se volvían a contar impresiones.
const impresionesRegistradas = new Set<number>();

export function useAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cargar = useCallback(async (opts?: { force?: boolean }) => {
    if (loadedRef.current && !opts?.force) return;
    if (mountedRef.current) setLoading(true);

    try {
      let anuncios: Ad[] | null = null;

      // 1) Intentar leer de cache (se omite si se pide refrescar)
      if (!opts?.force) {
        try {
          const cached = await AsyncStorage.getItem(ADS_CACHE_KEY);
          if (cached) {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < ADS_CACHE_TTL_MS && Array.isArray(data)) {
              anuncios = data;
            }
          }
        } catch {}
      }

      // 2) Fetch real
      if (!anuncios) {
        const { data } = await api.get("/ads", { params: { limit: 5 } });
        if (data?.res && Array.isArray(data.ads)) {
          anuncios = data.ads as Ad[];
          AsyncStorage.setItem(
            ADS_CACHE_KEY,
            JSON.stringify({ data: anuncios, ts: Date.now() }),
          ).catch(() => {});
        }
      }

      // FIX #13: YA NO se registran impresiones aquí. Antes se enviaban todas
      //    al descargar (aunque el usuario nunca llegara a verlas) y NINGUNA
      //    cuando los anuncios salían de la caché. Ahora la pantalla llama a
      //    registrarImpresion() cuando el anuncio es realmente visible.
      if (anuncios) {
        if (mountedRef.current) setAds(anuncios);
        loadedRef.current = true;
      }
    } catch (e) {
      console.warn("[useAds] error:", e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Refresco manual (pull-to-refresh): ignora la caché
  const recargarAds = useCallback(() => cargar({ force: true }), [cargar]);

  // Identidad estable: la pantalla la captura dentro de un callback de FlatList
  const registrarImpresion = useCallback((adId: number) => {
    if (impresionesRegistradas.has(adId)) return;
    impresionesRegistradas.add(adId);
    api.post(`/ads/${adId}/impression`).catch(() => {
      // si falló, se permite reintentar en la próxima vez que se vea
      impresionesRegistradas.delete(adId);
    });
  }, []);

  const registrarClick = useCallback((adId: number) => {
    api.post(`/ads/${adId}/click`).catch(() => {});
  }, []);

  return {
    ads,
    loading,
    cargar,
    recargarAds,
    registrarImpresion,
    registrarClick,
  };
}
