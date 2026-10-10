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

export function useAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const vistosRef = useRef<Set<number>>(new Set());
  const loadedRef = useRef(false);

  const cargar = useCallback(async () => {
    if (loadedRef.current) return;
    setLoading(true);

    try {
      // 1) Intentar leer de cache
      try {
        const cached = await AsyncStorage.getItem(ADS_CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < ADS_CACHE_TTL_MS && Array.isArray(data)) {
            setAds(data);
            loadedRef.current = true;
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 2) Fetch real
      const { data } = await api.get("/ads", { params: { limit: 5 } });
      if (data?.res && Array.isArray(data.ads)) {
        setAds(data.ads);

        // Guardar en cache
        await AsyncStorage.setItem(
          ADS_CACHE_KEY,
          JSON.stringify({ data: data.ads, ts: Date.now() }),
        ).catch(() => {});

        // Registrar impresiones (una sola vez por sesión por anuncio)
        data.ads.forEach((ad: Ad) => {
          if (!vistosRef.current.has(ad.id)) {
            vistosRef.current.add(ad.id);
            api.post(`/ads/${ad.id}/impression`).catch(() => {});
          }
        });
      }

      loadedRef.current = true;
    } catch (e) {
      console.warn("[useAds] error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const registrarClick = useCallback((adId: number) => {
    api.post(`/ads/${adId}/click`).catch(() => {});
  }, []);

  return { ads, loading, cargar, registrarClick };
}
