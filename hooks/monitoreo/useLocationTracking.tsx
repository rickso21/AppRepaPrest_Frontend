// hooks/home/useLocationTracking.tsx — REEMPLAZA el actual (misma API pública)
// Cambio: watchPositionAsync (el SO avisa cuando te mueves) en vez de setInterval + getCurrentPosition.
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GoogleMapViewRef } from "../../components/maps/GoogleMapView";
import { api } from "../../services/conector/api";

type Args = {
  mapRef: React.RefObject<GoogleMapViewRef | null>;
  tokenRef: React.MutableRefObject<string | null>;
};

const MIN_SEND_GAP_MS = 4000;

export function useLocationTracking({ mapRef, tokenRef }: Args) {
  const [sinPermiso, setSinPermiso] = useState(false);
  const [ubicacionLista, setUbicacionLista] = useState(false);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enviar = useCallback(
    async (lat: number, lng: number) => {
      if (!tokenRef.current) return;
      try {
        // El servidor guarda y hace broadcast por WebSocket al grupo
        const { data } = await api.post("/mapa/ubicacion", {
          latitud: lat,
          longitud: lng,
        });
        if (data?.res && mountedRef.current) setUbicacionLista(true);
      } catch (e) {
        console.warn("[GPS] enviar falló:", e);
      }
    },
    [tokenRef],
  );

  const detenerMonitoreo = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    if (mountedRef.current) setUbicacionLista(false);
  }, []);

  const iniciarMonitoreo = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return setSinPermiso(true);
    setSinPermiso(false);

    subRef.current?.remove();
    subRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: MIN_SEND_GAP_MS,
        distanceInterval: 10,
      },
      (loc) => {
        const { latitude: lat, longitude: lng } = loc.coords;
        mapRef.current?.updateMyLocation(lat, lng);
        const now = Date.now();
        if (now - lastSentRef.current < MIN_SEND_GAP_MS) return;
        lastSentRef.current = now;
        enviar(lat, lng);
      },
    );
  }, [enviar, mapRef]);

  useEffect(() => detenerMonitoreo, [detenerMonitoreo]);

  return { sinPermiso, ubicacionLista, iniciarMonitoreo, detenerMonitoreo };
}
