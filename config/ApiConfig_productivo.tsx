// config/ApiConfig.ts
export const API_CONFIG = {
  // API HTTP (producción)
  baseURL: "https://api.deliverysobreruedas.com",

  // Reverb / WebSocket
  reverbKey: "r4rwgflbhgo294yupife",

  // Host público del WS (mismo dominio que la API, path /app/ vía nginx)
  wsHost: "api.deliverysobreruedas.com",
  wsPort: 443, // nginx hace el upgrade por 443 (WSS)
  wssPort: 443,
  reverbUseTLS: true, // fuerza wss://

  get broadcastingAuthUrl() {
    return `${this.baseURL}/broadcasting/auth`;
  },

  timeout: 120000,
};
