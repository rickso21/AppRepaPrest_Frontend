import { useEffect, useRef } from "react";
import { echo } from "../../services/conector/echo";

type Args = {
  groupIds?: number[]; // ✅ opcional para evitar errores si no se pasa
  onPostCreated?: (payload: any) => void;
  onPostDeleted?: (payload: any) => void;
  onCommentCreated?: (payload: any) => void;
  onPostReacted?: (payload: any) => void;
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

  // ✅ Asignación directa en cada render (siempre actualizados, sin re-render)
  cbPostCreated.current = onPostCreated;
  cbPostDeleted.current = onPostDeleted;
  cbCommentCreated.current = onCommentCreated;
  cbPostReacted.current = onPostReacted;

  // ✅ Guard: si groupIds es undefined/null, usar array vacío
  const safeGroupIds = Array.isArray(groupIds)
    ? groupIds.filter((id): id is number => typeof id === "number" && id > 0)
    : [];

  // ✅ Clave estable para la dependencia (evita re-suscripción por array nuevo)
  const idsKey = safeGroupIds.slice().sort().join(",");

  useEffect(() => {
    if (!safeGroupIds.length) {
      console.log("[Realtime] ⏸️ Sin canales para suscribir (groupIds vacío)");
      return;
    }

    const pusher = (globalThis as any).__pusher_instance;
    if (!pusher) {
      console.error("[Realtime] ❌ No existe __pusher_instance");
      return;
    }

    console.log(
      "[Realtime] 🔌 Suscribiendo a",
      safeGroupIds.length,
      "canales:",
      safeGroupIds,
    );

    let cancelled = false;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    const channels: Array<{ name: string; channel: any }> = [];

    const subscribeTo = (groupId: number) => {
      const channelName = `group.${groupId}`;
      console.log("[Realtime] 🎯 Suscribiendo AHORA a", channelName);

      const channel = echo.private(channelName);

      channel.listen("post.created", (payload: any) => {
        console.log(
          `[Realtime] post.created RAW (group.${groupId}):`,
          JSON.stringify(payload),
        );
        cbPostCreated.current?.(payload);
      });
      channel.listen("post.deleted", (payload: any) => {
        console.log(
          `[Realtime] post.deleted RAW (group.${groupId}):`,
          JSON.stringify(payload),
        );
        cbPostDeleted.current?.(payload);
      });
      channel.listen("comment.created", (payload: any) => {
        console.log(
          `[Realtime] comment.created RAW (group.${groupId}):`,
          JSON.stringify(payload),
        );
        cbCommentCreated.current?.(payload);
      });
      channel.listen("post.reacted", (payload: any) => {
        console.log(
          `[Realtime] post.reacted RAW (group.${groupId}):`,
          JSON.stringify(payload),
        );
        cbPostReacted.current?.(payload);
      });

      channels.push({ name: channelName, channel });
    };

    const doAll = () => {
      if (cancelled || channels.length > 0) return;
      safeGroupIds.forEach(subscribeTo);
    };

    // ✅ Si el socket ya está conectado, suscribir inmediatamente
    if (pusher.connection?.state === "connected") {
      doAll();
    } else {
      console.log(
        "[Realtime] ⏳ Socket en estado:",
        pusher.connection?.state,
        "- esperando 'connected'",
      );

      const onConnected = () => {
        console.log("[Realtime] 🎉 Evento 'connected' recibido");
        doAll();
      };

      pusher.connection.bind("connected", onConnected);

      // ⏱️ Fallback: si en 5s no conectó, suscribir de todas formas
      fallbackTimeout = setTimeout(() => {
        if (channels.length === 0 && !cancelled) {
          console.warn("[Realtime] ⚠️ Timeout — suscribiendo de todas formas");
          doAll();
        }
      }, 5000);

      // Cleanup
      return () => {
        cancelled = true;
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
        pusher.connection.unbind("connected", onConnected);

        channels.forEach(({ name }) => {
          console.log("[Realtime] 🔌 Abandonando canal:", name);
          try {
            echo.leave(name);
          } catch {}
        });
      };
    }

    // Cleanup del caso "ya conectado"
    return () => {
      cancelled = true;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);

      channels.forEach(({ name }) => {
        console.log("[Realtime] 🔌 Abandonando canal:", name);
        try {
          echo.leave(name);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);
}
