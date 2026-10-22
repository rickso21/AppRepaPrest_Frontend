// hooks/home/useRidersRealtime.tsx — REEMPLAZA useRidersPolling.tsx (misma forma de retorno)
import { useCallback, useEffect, useRef } from "react";
import { Vibration } from "react-native";
import type { GoogleMapViewRef } from "../../components/maps/GoogleMapView";
import { api } from "../../services/conector/api";
import { echo } from "../../services/conector/echo";
import { SoundService } from "../../services/home/SoundService";

type Args = {
  conectado: boolean;
  userIdNum: number;
  grupoId: number | string | null;
  mapRef: React.RefObject<GoogleMapViewRef | null>;
  tokenRef: React.MutableRefObject<string | null>;
};

const RENDER_THROTTLE_MS = 400; // agrupa ráfagas de eventos en un solo repintado del mapa
const SAFETY_RESYNC_MS = 60_000; // red de seguridad (antes eran 3 s)

export function useRidersRealtime({
  conectado,
  userIdNum,
  grupoId,
  mapRef,
  tokenRef,
}: Args) {
  const meRef = useRef(userIdNum);
  const mountedRef = useRef(true);
  const ridersRef = useRef<Map<number, any>>(new Map());
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    meRef.current = userIdNum;
  }, [userIdNum]);

  const render = useCallback(() => {
    if (renderTimer.current) return;
    renderTimer.current = setTimeout(() => {
      renderTimer.current = null;
      if (!mountedRef.current) return;
      mapRef.current?.loadAllRiders(Array.from(ridersRef.current.values()));
    }, RENDER_THROTTLE_MS);
  }, [mapRef]);

  const dispararAlarma = useCallback((id: number) => {
    if (suprimirAlertasRef.current || id === meRef.current) return;
    if (alertasPanicoMostradasRef.current.has(id)) return;
    const now = Date.now();
    if (now - (cooldownPanicoRef.current.get(id) ?? 0) < 5000) return;
    alertasPanicoMostradasRef.current.add(id);
    cooldownPanicoRef.current.set(id, now);
    SoundService.playAlarma();
    Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
  }, []);

  // Snapshot por HTTP: solo al conectar, al (re)suscribirse y cada 60 s
  const obtenerRepartidores = useCallback(async () => {
    if (!conectado || !tokenRef.current || !mountedRef.current) return;
    try {
      const { data } = await api.get("/mapa/repartidores");
      if (!data?.res) return;
      const lista: any[] = data.data;
      ridersRef.current = new Map(
        lista
          .filter((u) => u.estado === "conectado" || u.en_panico)
          .map((u) => [u.id, u]),
      );
      lista.forEach((u) => u.en_panico && dispararAlarma(u.id));
      render();
    } catch {}
  }, [conectado, tokenRef, render, dispararAlarma]);

  useEffect(() => {
    if (conectado && !grupoId) {
      console.warn(
        "[RT] conectado pero SIN grupoId: no se suscribe a ningún canal",
      );
    }
    if (!conectado || !grupoId) {
      ridersRef.current.clear();
      mapRef.current?.clearAllRiders();
      return;
    }

    const canal = `grupo.${grupoId}`;
    const ch = echo.private(canal);

    // ── DIAGNÓSTICO (quitar cuando funcione) ──
    console.log(
      "[RT] suscribiendo a",
      `private-${canal}`,
      "| ws:",
      echo.pusher.connection.state,
    );
    const onWs = (st: any) =>
      console.log("[RT] ws", st.previous, "->", st.current);
    const onSubErr = (e: any) =>
      console.warn("[RT] subscription_error", JSON.stringify(e));
    const onAny = (ev: string, data: any) =>
      !ev.startsWith("pusher:") &&
      console.log("[RT] evento", ev, JSON.stringify(data));
    echo.pusher.connection.bind("state_change", onWs);
    ch.raw.bind("pusher:subscription_error", onSubErr);
    ch.raw.bind_global(onAny);

    const handlers: Record<string, (e: any) => void> = {
      "ubicacion.actualizada": (e) => {
        if (e.id === meRef.current) return;
        const prev = ridersRef.current.get(e.id) ?? {};
        ridersRef.current.set(e.id, {
          ...prev,
          id: e.id,
          nombre: e.nombre,
          latitud: e.latitud,
          longitud: e.longitud,
          estado: "conectado",
          ultima_ubicacion: e.hora,
        });
        render();
      },

      "estado.cambiado": (e) => {
        if (e.id === meRef.current) return;
        if (e.estado === "conectado") return void obtenerRepartidores(); // trae datos completos
        const r = ridersRef.current.get(e.id);
        if (r && !r.en_panico) ridersRef.current.delete(e.id);
        render();
      },

      "panico.activado": (e) => {
        if (e.id === meRef.current) return;
        const prev = ridersRef.current.get(e.id) ?? {};
        ridersRef.current.set(e.id, {
          ...prev,
          id: e.id,
          nombre: e.nombre,
          latitud: e.latitud,
          longitud: e.longitud,
          estado: "conectado",
          en_panico: true,
          tipo_emergencia: e.tipoEmergencia,
          hora_panico: e.hora,
        });
        dispararAlarma(e.id);
        render();
      },

      "panico.desactivado": (e) => {
        alertasPanicoMostradasRef.current.delete(e.id);
        cooldownPanicoRef.current.delete(e.id);
        const r = ridersRef.current.get(e.id);
        if (r) r.en_panico = false;
        const sigueAlguien = Array.from(ridersRef.current.values()).some(
          (u) => u.en_panico,
        );
        if (!sigueAlguien) {
          SoundService.stopAll().catch(() => {});
          Vibration.cancel();
        }
        render();
      },
    };
    Object.entries(handlers).forEach(([ev, fn]) => ch.raw.bind(ev, fn));

    // Se dispara en la 1ª suscripción y también tras cada reconexión → recupera lo perdido offline
    const onSubscribed = () => {
      console.log("[RT] suscrito OK a", canal);
      obtenerRepartidores();
    };
    ch.raw.bind("pusher:subscription_succeeded", onSubscribed);

    const safety = setInterval(obtenerRepartidores, SAFETY_RESYNC_MS);

    return () => {
      Object.entries(handlers).forEach(([ev, fn]) => ch.raw.unbind(ev, fn));
      ch.raw.unbind("pusher:subscription_succeeded", onSubscribed);
      echo.pusher.connection.unbind("state_change", onWs);
      ch.raw.unbind("pusher:subscription_error", onSubErr);
      ch.raw.unbind_global(onAny);
      echo.leave(canal);
      clearInterval(safety);
      if (renderTimer.current) clearTimeout(renderTimer.current);
      renderTimer.current = null;
    };
  }, [conectado, grupoId, mapRef, obtenerRepartidores, render, dispararAlarma]);

  return {
    obtenerRepartidores,
    suprimirAlertasRef,
    alertasPanicoMostradasRef,
    cooldownPanicoRef,
  };
}
