import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GoogleMapViewRef } from "../../components/maps/GoogleMapView";
import { api } from "../../services/conector/api";

type Args = {
  mapRef: React.RefObject<GoogleMapViewRef | null>;
  tokenRef: React.MutableRefObject<string | null>;
};

const getLocationConTimeout = (
  timeoutMs = 8000,
): Promise<Location.LocationObject> =>
  Promise.race([
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("GPS_TIMEOUT")), timeoutMs),
    ),
  ]);

export function useLocationTracking({ mapRef, tokenRef }: Args) {
  const [sinPermiso, setSinPermiso] = useState(false);
  const [ubicacionLista, setUbicacionLista] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enviarUbicacion = useCallback(
    async (lat: number, lng: number) => {
      if (!tokenRef.current) return;
      try {
        const { data } = await api.post("/mapa/ubicacion", {
          latitud: lat,
          longitud: lng,
        });
        if (data?.res && mountedRef.current) setUbicacionLista(true);
      } catch (e) {
        console.warn("[GPS] enviarUbicacion falló:", e);
      }
    },
    [tokenRef],
  );

  const iniciarMonitoreo = useCallback(async () => {
    // 1) Permisos
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setSinPermiso(true);
      return;
    }
    setSinPermiso(false);

    try {
      const location = await getLocationConTimeout(8000);
      const { latitude, longitude } = location.coords;

      await enviarUbicacion(latitude, longitude);
      mapRef.current?.updateMyLocation(latitude, longitude);

      if (mountedRef.current) setUbicacionLista(true);
    } catch (e) {
      console.warn("[GPS] primer fix falló:", e);
      // Alert.alert(
      //   "GPS lento",
      //   "No se pudo obtener tu ubicación. Se reintentará automáticamente."
      // );
    }

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      if (!tokenRef.current) return;
      try {
        const loc = await getLocationConTimeout(6000);
        const { latitude: lat, longitude: lng } = loc.coords;
        await enviarUbicacion(lat, lng);
        mapRef.current?.updateMyLocation(lat, lng);
      } catch (e) {
        console.warn("[GPS] tick falló:", e);
      }
    }, 5000);
  }, [enviarUbicacion, mapRef, tokenRef]);

  const detenerMonitoreo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mountedRef.current) setUbicacionLista(false);
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => detenerMonitoreo();
  }, [detenerMonitoreo]);

  return { sinPermiso, ubicacionLista, iniciarMonitoreo, detenerMonitoreo };
}
