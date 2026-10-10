import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as PusherModule from "pusher-js";
import { API_CONFIG } from "../../config/ApiConfig";

// ─── Debug flags ──────────────────────────────────────────────
const DEBUG_ECHO = __DEV__;
const DEBUG_PUSHER = __DEV__;
const DEBUG_ERRORS = __DEV__;

const Pusher: any =
  (PusherModule as any).Pusher ?? (PusherModule as any).default ?? PusherModule;

// Polyfill localStorage
// @ts-ignore
global.localStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

// @ts-ignore
global.Pusher = Pusher;

if (DEBUG_PUSHER) {
  // @ts-ignore
  Pusher.logToConsole = true;
}

declare global {
  var __pusher_instance: any;
  var __echoReadyListeners: Set<() => void> | undefined;
  var __echoReady: boolean | undefined;
}

// ═══════════════════════════════════════════════════════════════
// 🔔 Mini emitter de "echo ready" (compatible con Hermes / RN / web)
// ═══════════════════════════════════════════════════════════════
// Vive en globalThis para sobrevivir a Fast Refresh de Metro: si se
// reevalúa el módulo, los listeners pendientes no se pierden.

const readyListeners: Set<() => void> =
  (globalThis as any).__echoReadyListeners ??
  ((globalThis as any).__echoReadyListeners = new Set<() => void>());

function notifyEchoReady() {
  (globalThis as any).__echoReady = true;

  const pending = Array.from(readyListeners);
  readyListeners.clear();

  pending.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      if (DEBUG_ERRORS) console.error("[echo] listener error:", e);
    }
  });
}

/**
 * Suscribirse a "echo listo".
 * Si ya está listo, el callback se ejecuta en microtask (no en el render).
 * Devuelve una función para cancelar la suscripción.
 */
export function onEchoReady(fn: () => void): () => void {
  if ((globalThis as any).__echoReady === true) {
    Promise.resolve().then(fn);
    return () => {};
  }
  readyListeners.add(fn);
  return () => {
    readyListeners.delete(fn);
  };
}

// ═══════════════════════════════════════════════════════════════
// Instancia única (persiste entre hot reloads del módulo)
// ═══════════════════════════════════════════════════════════════

let pusherInstance: any = (globalThis as any).__pusher_instance;

if (!pusherInstance) {
  if (DEBUG_ECHO) {
    console.log("[echo] 🔧 Creando instancia de Pusher (primera vez)");
  }

  pusherInstance = new Pusher(API_CONFIG.reverbKey, {
    cluster: "mt1",

    wsHost: API_CONFIG.wsHost, // api.deliverysobreruedas.com
    wsPort: 80,
    wssPort: 443,

    forceTLS: true,

    // ✅ Ambos transportes (ws se convierte en wss por forceTLS)
    enabledTransports: ["ws", "wss"],

    // ✅ Path de Reverb
    path: "/app",

    // ✅ Sin telemetría
    disableStats: true,
    enableStats: false,

    authEndpoint: API_CONFIG.broadcastingAuthUrl,

    // ✅ Authorizer con Bearer token
    authorizer: (channel: any) => ({
      authorize: async (socketId: string, callback: Function) => {
        try {
          let token: string | null = null;
          try {
            token = await SecureStore.getItemAsync("userToken");
          } catch (err) {
            if (DEBUG_ERRORS) {
              console.error("[echo] Error leyendo token:", err);
            }
          }

          if (!token) {
            if (DEBUG_ERRORS) {
              console.error("[echo] ❌ Token ausente en SecureStore");
            }
            callback(new Error("Token de autenticación ausente"), null);
            return;
          }

          const response = await fetch(API_CONFIG.broadcastingAuthUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          });

          if (!response.ok) {
            if (DEBUG_ERRORS) {
              const errorBody = await response.text().catch(() => "");
              console.error(
                `[echo] ❌ Auth falló (${response.status}):`,
                errorBody,
              );
            }
            callback(
              new Error(`Auth failed with status ${response.status}`),
              null,
            );
            return;
          }

          const data = await response.json().catch(() => null);
          if (!data?.auth) {
            callback(new Error("Respuesta de auth sin firma"), null);
            return;
          }

          callback(null, data);
        } catch (err: any) {
          if (DEBUG_ERRORS) {
            console.error("[echo] ❌ Excepción en authorize:", err);
          }
          callback(err, null);
        }
      },
    }),
  });

  // Guardar en globalThis para que useRealtimeComunidad lo encuentre
  (globalThis as any).__pusher_instance = pusherInstance;

  // ─── Listeners del socket (solo en dev) ──────────────────────
  if (DEBUG_ECHO) {
    pusherInstance.connection.bind("state_change", (states: any) => {
      console.log(`[echo] 🔄 Socket: ${states.previous} → ${states.current}`);
    });

    pusherInstance.connection.bind("connected", () => {
      console.log(
        "[echo] ✅ Socket CONECTADO. socket_id:",
        pusherInstance.connection.socket_id,
      );
    });

    pusherInstance.connection.bind("disconnected", () => {
      console.warn("[echo] ⚠️ Socket DESCONECTADO");
    });

    pusherInstance.connection.bind("error", (err: any) => {
      console.error("[echo] ❌ Socket ERROR:", err);
    });

    pusherInstance.connection.bind("unavailable", () => {
      console.warn("[echo] ⚠️ Socket UNAVAILABLE");
    });

    pusherInstance.connection.bind("failed", () => {
      console.error("[echo] ❌ Socket FAILED");
    });
  }

  // 🔔 Avisar a los hooks que la instancia ya está lista
  notifyEchoReady();
} else {
  if (DEBUG_ECHO) {
    console.log("[echo] ♻️ Reutilizando instancia existente de Pusher");
  }
  // Ya estaba lista (p. ej. Fast Refresh): desbloquear a quien esté esperando
  notifyEchoReady();
}

const pusher = pusherInstance;

const toPrivateChannelName = (channelName: string): string =>
  channelName.startsWith("private-") ? channelName : `private-${channelName}`;

type Listener = (payload: any) => void;

export const echo = {
  private(channelName: string) {
    const fullName = toPrivateChannelName(channelName);

    if (DEBUG_ECHO) {
      console.log(`[echo] 📡 Suscribiendo a: ${fullName}`);
    }

    let channel: any;
    try {
      channel = pusher.subscribe(fullName);
    } catch (err) {
      if (DEBUG_ERRORS) {
        console.error(`[echo] ❌ Error suscribiendo a ${fullName}:`, err);
      }
      return {
        listen: () => undefined,
        stopListening: () => undefined,
        raw: null,
      };
    }

    channel.bind("pusher:subscription_error", (err: any) => {
      if (DEBUG_ERRORS) {
        console.error(`[echo] ❌ subscription_error en ${fullName}:`, err);
      }
    });

    if (DEBUG_ECHO) {
      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`[echo] ✅ Suscripción CONFIRMADA: ${fullName}`);
      });
    }

    return {
      listen(eventName: string, callback: Listener) {
        try {
          channel.bind(eventName, callback);
          if (DEBUG_ECHO) {
            console.log(`[echo] 🎧 Listener: ${eventName}`);
          }
        } catch (err) {
          if (DEBUG_ERRORS) {
            console.error(`[echo] ❌ Error listener ${eventName}:`, err);
          }
        }
        return this;
      },
      stopListening(eventName: string) {
        try {
          channel.unbind(eventName);
        } catch (err) {
          if (DEBUG_ERRORS) {
            console.error(`[echo] ❌ Error unbind ${eventName}:`, err);
          }
        }
        return this;
      },
      raw: channel,
    };
  },

  leave(channelName: string) {
    const fullName = toPrivateChannelName(channelName);
    if (DEBUG_ECHO) {
      console.log(`[echo] 🔌 Abandonando canal: ${fullName}`);
    }
    try {
      pusher.unsubscribe(fullName);
    } catch (err) {
      if (DEBUG_ERRORS) {
        console.error(`[echo] ❌ Error abandonando ${fullName}:`, err);
      }
    }
  },

  disconnect() {
    try {
      pusher.disconnect();
    } catch (err) {
      if (DEBUG_ERRORS) {
        console.error("[echo] ❌ Error desconectando Pusher:", err);
      }
    }
  },

  get pusher() {
    return pusher;
  },
};
