import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as PusherModule from "pusher-js";
import { API_CONFIG } from "../../config/ApiConfig";

const DEBUG_ECHO = __DEV__ && false;
const DEBUG_PUSHER = __DEV__ && false;
const DEBUG_ERRORS = true;

// Constructor Pusher
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
  Pusher.logToConsole = false;
}

// Host limpio
const getWsHost = (): string => {
  let host = API_CONFIG.baseURL.replace(/^https?:\/\//, "");
  host = host.split("/")[0];
  host = host.split(":")[0];
  return host;
};

declare global {
  var __pusher_instance: any;
}

if (!globalThis.__pusher_instance) {
  if (DEBUG_ECHO) {
    //console.log("[echo] Creando nueva instancia de Pusher");
  }

  globalThis.__pusher_instance = new Pusher(API_CONFIG.reverbKey, {
    cluster: "mt1",
    wsHost: getWsHost(),
    wsPort: API_CONFIG.reverbPort,
    wssPort: API_CONFIG.reverbPort,
    forceTLS: API_CONFIG.reverbUseTLS,
    enabledTransports: ["ws", "wss"],
    enableStats: false,
    authorizer: (channel: any) => ({
      authorize: async (socketId: string, callback: Function) => {
        try {
          let token: string | null = null;
          try {
            token = await SecureStore.getItemAsync("userToken");
          } catch (err) {
            if (DEBUG_ERRORS) {
              //console.error("[echo] No se pudo leer el token:", err);
            }
          }

          if (!token) {
            if (DEBUG_ERRORS) {
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
                `[echo] Auth falló (${response.status}): ${errorBody}`,
              );
            }
            callback(
              new Error(`Auth failed with status ${response.status}`),
              null,
            );
            return;
          }

          let data: any;
          try {
            data = await response.json();
          } catch (err) {
            if (DEBUG_ERRORS) {
              //console.error("[echo] Respuesta no es JSON válido:", err);
            }
            callback(new Error("Respuesta de auth inválida"), null);
            return;
          }

          if (!data?.auth) {
            if (DEBUG_ERRORS) {
              //console.error("[echo] Respuesta sin campo 'auth':", data);
            }
            callback(new Error("Respuesta de auth sin firma"), null);
            return;
          }

          if (DEBUG_ECHO) {
            //console.log(`[echo] Canal autorizado: ${channel.name}`);
          }
          callback(null, data);
        } catch (err: any) {
          if (DEBUG_ERRORS) {
            //console.error("[echo]  Excepción en authorize:", err);
          }
          callback(err, null);
        }
      },
    }),
  });
} else {
  if (DEBUG_ECHO) {
    //console.log("[echo] Reutilizando instancia existente de Pusher");
  }
}

const pusher = globalThis.__pusher_instance;

const toPrivateChannelName = (channelName: string): string =>
  channelName.startsWith("private-") ? channelName : `private-${channelName}`;

type Listener = (payload: any) => void;

export const echo = {
  private(channelName: string) {
    const fullName = toPrivateChannelName(channelName);

    if (DEBUG_ECHO) {
      //console.log(`[echo] 📡 Suscribiendo a: ${fullName}`);
    }

    let channel: any;
    try {
      channel = pusher.subscribe(fullName);
    } catch (err) {
      if (DEBUG_ERRORS) {
        //console.error(`[echo] Error suscribiendo a ${fullName}:`, err);
      }
      return {
        listen: () => undefined,
        stopListening: () => undefined,
        raw: null,
      };
    }

    channel.bind("pusher:subscription_error", (err: any) => {
      if (DEBUG_ERRORS) {
        //console.error(`[echo] Error de suscripción en ${fullName}:`, err);
      }
    });

    if (DEBUG_ECHO) {
      channel.bind("pusher:subscription_succeeded", () => {
        //console.log(`[echo] Suscripción confirmada: ${fullName}`);
      });
    }

    return {
      listen(eventName: string, callback: Listener) {
        const cleanName = eventName.startsWith(".")
          ? eventName.slice(1)
          : eventName;
        try {
          channel.bind(cleanName, callback);
        } catch (err) {
          if (DEBUG_ERRORS) {
            //console.error(`[echo] Error listener ${cleanName}:`, err);
          }
        }
        return this;
      },
      stopListening(eventName: string) {
        const cleanName = eventName.startsWith(".")
          ? eventName.slice(1)
          : eventName;
        try {
          channel.unbind(cleanName);
        } catch (err) {
          if (DEBUG_ERRORS) {
            //console.error(`[echo] Error unbind ${cleanName}:`, err);
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
      //console.log(`[echo] Abandonando canal: ${fullName}`);
    }
    try {
      pusher.unsubscribe(fullName);
    } catch (err) {
      if (DEBUG_ERRORS) {
        //console.error(`[echo] Error abandonando ${fullName}:`, err);
      }
    }
  },

  disconnect() {
    try {
      pusher.disconnect();
    } catch (err) {
      if (DEBUG_ERRORS) {
        //console.error("[echo] Error desconectando Pusher:", err);
      }
    }
  },

  pusher,
};
