import * as SecureStore from "expo-secure-store";
import * as PusherModule from "pusher-js";
import { API_CONFIG } from "../../config/ApiConfig";

const DEBUG_ECHO = false;
const DEBUG_PUSHER = false;

const Pusher: any =
  (PusherModule as any).Pusher ?? (PusherModule as any).default ?? PusherModule;

// @ts-ignore
global.Pusher = Pusher;

if (DEBUG_PUSHER) {
  Pusher.logToConsole = false;
}

declare global {
  var __pusher_instance: any;
}

if (!globalThis.__pusher_instance) {
  globalThis.__pusher_instance = new Pusher(API_CONFIG.reverbKey, {
    cluster: "mt1",
    wsHost: API_CONFIG.wsHost,
    wsPort: API_CONFIG.wsPort,
    wssPort: API_CONFIG.wssPort,

    // Solo mantén forceTLS, elimina useTLS
    forceTLS: true, // Forzar conexión TLS
    enabledTransports: ["ws", "wss"], // Debe incluir ws y wss

    disableStats: true,
    activityTimeout: 30000,
    pongTimeout: 10000,

    authorizer: (channel: any) => ({
      authorize: async (socketId: string, callback: Function) => {
        const t0 = Date.now();
        try {
          let token: string | null = null;
          try {
            token = await SecureStore.getItemAsync("userToken");
          } catch (err) {
            //  console.warn("[echo] SecureStore falló:", err);
          }

          if (!token) {
            // console.warn("[echo] Sin token para autorizar", channel.name);
            callback(new Error("Token ausente"), null);
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

          const ms = Date.now() - t0;

          if (!response.ok) {
            const body = await response.text().catch(() => "");

            callback(new Error(`Auth failed ${response.status}`), null);
            return;
          }

          const data = await response.json();

          callback(null, data);
        } catch (err) {
          callback(err, null);
        }
      },
    }),
  });

  const p = globalThis.__pusher_instance;

  p.connection.bind("state_change", (states: any) => {
    // console.log(`[pusher] state: ${states.previous} -> ${states.current}`);
  });

  p.connection.bind("failed", () => console.error("[pusher] ❌ failed"));
  p.connection.bind("error", (e: any) => console.error("[pusher] ❌ error", e));
}

const pusher = globalThis.__pusher_instance;

const toPrivateChannelName = (channelName: string) =>
  channelName.startsWith("private-") ? channelName : `private-${channelName}`;

type Listener = (payload: any) => void;

export const echo = {
  private(channelName: string) {
    const fullName = toPrivateChannelName(channelName);
    //console.log(`[echo] subscribe → ${fullName}`);

    const channel = pusher.subscribe(fullName);

    //channel.bind("pusher:subscription_succeeded", () =>
    //  console.log(`[echo] ✅ sub OK ${fullName}`),
    //);
    //channel.bind("pusher:subscription_error", (err: any) =>
    // console.error(`[echo] ❌ sub error ${fullName}`, err),
    //);

    return {
      listen(eventName: string, callback: Listener) {
        const clean = eventName.replace(/^\./, "");
        channel.bind(clean, (data: any) => {
          //   console.log(`[echo] 📩 ${fullName} :: ${clean}`, data);
          callback(data);
        });
        return this;
      },
      stopListening(eventName: string) {
        const clean = eventName.replace(/^\./, "");
        channel.unbind(clean);
        return this;
      },
      raw: channel,
    };
  },
  leave(channelName: string) {
    pusher.unsubscribe(toPrivateChannelName(channelName));
  },
  disconnect() {
    pusher.disconnect();
    globalThis.__pusher_instance = null;
  },
  pusher,
};
