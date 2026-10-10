import { useEffect, useRef } from "react";
import { echo, onEchoReady } from "../../services/conector/echo";

type Args = {
  groupIds?: number[];
  onPostCreated?: (payload: any) => void;
  onPostDeleted?: (payload: any) => void;
  onCommentCreated?: (payload: any) => void;
  onPostReacted?: (payload: any) => void;
};

const dlog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

export function useRealtimeComunidad({
  groupIds,
  onPostCreated,
  onPostDeleted,
  onCommentCreated,
  onPostReacted,
}: Args) {
  const cbPostCreated = useRef(onPostCreated);
  const cbPostDeleted = useRef(onPostDeleted);
  const cbCommentCreated = useRef(onCommentCreated);
  const cbPostReacted = useRef(onPostReacted);

  cbPostCreated.current = onPostCreated;
  cbPostDeleted.current = onPostDeleted;
  cbCommentCreated.current = onCommentCreated;
  cbPostReacted.current = onPostReacted;

  // Suscripciones activas persistidas entre renders (no se re-crean)
  const channelsRef = useRef<Map<number, { name: string; channel: any }>>(
    new Map(),
  );
  const pusherBoundRef = useRef<{
    pusher: any;
    onConnected: () => void;
  } | null>(null);

  const safeGroupIds = Array.isArray(groupIds)
    ? groupIds.filter((id): id is number => typeof id === "number" && id > 0)
    : [];

  const idsKey = safeGroupIds.slice().sort().join(",");

  useEffect(() => {
    if (!safeGroupIds.length) {
      dlog("[Realtime] Sin canales para suscribir (groupIds vacío)");
      return;
    }

    let cancelled = false;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeReady: (() => void) | null = null;
    let iniciado = false;

    const subscribeTo = (groupId: number) => {
      // Si ya existe este canal, NO re-suscribir
      if (channelsRef.current.has(groupId)) {
        dlog("[Realtime] Canal ya activo:", `group.${groupId}`);
        return;
      }

      const channelName = `group.${groupId}`;
      dlog("[Realtime] Suscribiendo AHORA a", channelName);

      const channel = echo.private(channelName);

      channel.listen("post.created", (payload: any) => {
        dlog(`[Realtime] post.created (group.${groupId}):`, payload);
        cbPostCreated.current?.(payload);
      });
      channel.listen("post.deleted", (payload: any) => {
        dlog(`[Realtime] post.deleted (group.${groupId}):`, payload);
        cbPostDeleted.current?.(payload);
      });
      channel.listen("comment.created", (payload: any) => {
        dlog(`[Realtime] comment.created (group.${groupId}):`, payload);
        cbCommentCreated.current?.(payload);
      });
      channel.listen("post.reacted", (payload: any) => {
        dlog(`[Realtime] post.reacted (group.${groupId}):`, payload);
        cbPostReacted.current?.(payload);
      });

      channelsRef.current.set(groupId, { name: channelName, channel });
    };

    const leaveChannel = (groupId: number) => {
      const entry = channelsRef.current.get(groupId);
      if (!entry) return;
      dlog("[Realtime] Abandonando canal:", entry.name);
      try {
        echo.leave(entry.name);
      } catch {}
      channelsRef.current.delete(groupId);
    };

    const syncChannels = () => {
      if (cancelled) return;

      const idsDeseados = new Set(safeGroupIds);
      const idsActuales = new Set(channelsRef.current.keys());

      // Comparar ambos sets — si son iguales, no hacer nada
      const mismos =
        idsDeseados.size === idsActuales.size &&
        Array.from(idsDeseados).every((id) => idsActuales.has(id));

      if (mismos) {
        return; // ← sin log, sin trabajo
      }

      // Leave los que ya NO queremos
      Array.from(idsActuales).forEach((gid) => {
        if (!idsDeseados.has(gid)) leaveChannel(gid);
      });

      // Subscribe los nuevos
      safeGroupIds.forEach(subscribeTo);

      dlog(
        "[Realtime] Sync completa. Canales activos:",
        Array.from(channelsRef.current.keys()),
      );
    };

    const iniciarConPusher = (pusher: any) => {
      if (iniciado) return;
      iniciado = true;

      if (pusher.connection?.state === "connected") {
        syncChannels();
        return;
      }

      dlog(
        "[Realtime] Socket en estado:",
        pusher.connection?.state,
        "- esperando 'connected'",
      );

      const onConnected = () => {
        dlog("[Realtime] Evento 'connected' recibido");
        syncChannels();
      };
      pusher.connection.bind("connected", onConnected);
      pusherBoundRef.current = { pusher, onConnected };

      // Fallback
      fallbackTimeout = setTimeout(() => {
        if (channelsRef.current.size === 0 && !cancelled) {
          console.warn("[Realtime] timeout — suscribiendo de todas formas");
          syncChannels();
        }
      }, 5000);
    };

    const pusher = (globalThis as any).__pusher_instance;
    if (pusher) {
      iniciarConPusher(pusher);
    } else {
      dlog("[Realtime] Esperando 'echo:ready'...");
      unsubscribeReady = onEchoReady(() => {
        if (cancelled) return;
        const p = (globalThis as any).__pusher_instance;
        if (p) iniciarConPusher(p);
      });
    }

    // Si ya estábamos suscritos y solo cambió el set, sincronizar
    if (iniciado) {
      syncChannels();
    }

    return () => {
      cancelled = true;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (unsubscribeReady) unsubscribeReady();
      // NO hacer leave en cleanup: los canales se manejan por diff en el próximo run
      //    Solo al desmontar TODO el hook (navegación fuera de Comunidad)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    return () => {
      dlog("[Realtime] Desmontando hook: abandonando todos los canales");
      Array.from(channelsRef.current.entries()).forEach(([gid, entry]) => {
        try {
          echo.leave(entry.name);
        } catch {}
      });
      channelsRef.current.clear();

      if (pusherBoundRef.current) {
        try {
          pusherBoundRef.current.pusher.connection.unbind(
            "connected",
            pusherBoundRef.current.onConnected,
          );
        } catch {}
        pusherBoundRef.current = null;
      }
    };
  }, []);
}
