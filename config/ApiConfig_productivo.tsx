// config/ApiConfig.ts
export const API_CONFIG = {
  // API HTTP (producción)
  //baseURL: "https://api.deliverysobreruedas.com",
  baseURL: "http://192.168.1.29:8000",

  // Reverb / WebSocket
  reverbKey: "r4rwgflbhgo294yupife",

  // Host público del WS (mismo dominio que la API, path /app/ vía nginx)
  //wsHost: "api.deliverysobreruedas.com",
  wsHost: "http://192.168.1.29:8000",
  //wsHost: "api.deliverysobreruedas.com",

  //wsPort: 443, // nginx hace el upgrade por 443 (WSS)
  //wssPort: 443,
  //reverbUseTLS: true,
  //reverbUseTLS: true, // fuerza wss://
  wsPort: 8080, // puerto real de Reverb (por defecto 8080)
  wssPort: 8080,
  reverbUseTLS: false, // HTTP local → ws://

  enabledTransports: ["ws", "wss"], // 👈 permite ambos
  disableStats: true, // 👈 evita peticiones a pusher.com

  get broadcastingAuthUrl() {
    return `${this.baseURL}/broadcasting/auth`;
  },

  timeout: 120000,
};
