import { useCallback, useEffect, useRef } from "react";
import { Vibration } from "react-native";
import type { GoogleMapViewRef } from "../../components/maps/GoogleMapView";
import { api } from "../conector/api";
import { SoundService } from "../home/SoundService";

type Args = {
  conectado: boolean;
  userIdNum: number;
  mapRef: React.RefObject<GoogleMapViewRef | null>;
  tokenRef: React.MutableRefObject<string | null>;
};

export function useRidersPolling({
  conectado,
  userIdNum,
  mapRef,
  tokenRef,
}: Args) {
  const userIdNumRef = useRef(userIdNum);
  const mountedRef = useRef(true);
  const suprimirAlertasRef = useRef(false);
  const alertasPanicoMostradasRef = useRef<Set<number>>(new Set());
  const cooldownPanicoRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    userIdNumRef.current = userIdNum;
  }, [userIdNum]);

  const obtenerRepartidores = useCallback(async () => {
    if (!conectado || !tokenRef.current || !mapRef.current) return;
    if (!mountedRef.current) return;

    try {
      const { data } = await api.get("/mapa/repartidores");
      if (!data.res) return;

      const usuariosConectados: any[] = data.data;
      const usuariosActivos = usuariosConectados.filter(
        (u) => u.estado === "conectado" || u.en_panico === true,
      );

      mapRef.current.loadAllRiders(usuariosActivos);

      if (suprimirAlertasRef.current) return;

      const idsEnPanico = new Set(
        usuariosConectados
          .filter((u) => u.en_panico === true && u.id !== userIdNumRef.current)
          .map((u) => u.id),
      );

      // Limpiar alertas ya no activas
      for (const id of Array.from(alertasPanicoMostradasRef.current)) {
        if (!idsEnPanico.has(id)) {
          alertasPanicoMostradasRef.current.delete(id);
          cooldownPanicoRef.current.delete(id);
        }
      }

      // Disparar alertas nuevas
      const now = Date.now();
      usuariosConectados.forEach((u) => {
        if (u.id === userIdNumRef.current) return;
        if (!u.en_panico) return;
        if (alertasPanicoMostradasRef.current.has(u.id)) return;

        const last = cooldownPanicoRef.current.get(u.id) ?? 0;
        if (now - last < 5000) return;

        alertasPanicoMostradasRef.current.add(u.id);
        cooldownPanicoRef.current.set(u.id, now);

        SoundService.playAlarma();
        Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
      });
    } catch {}
  }, [conectado, mapRef, tokenRef]);

  // Polling cada 3s
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (conectado) {
      obtenerRepartidores();
      interval = setInterval(obtenerRepartidores, 3000);
    } else {
      mapRef.current?.clearAllRiders();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [conectado, obtenerRepartidores, mapRef]);

  return {
    obtenerRepartidores,
    suprimirAlertasRef,
    alertasPanicoMostradasRef,
    cooldownPanicoRef,
  };
}
