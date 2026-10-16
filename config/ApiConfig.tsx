// config/ApiConfig.ts
export const API_CONFIG = {
  // API HTTP (producción)
  baseURL: "https://api.deliverysobreruedas.com",

  // Reverb / WebSocket
  reverbKey: "r4rwgflbhgo294yupife",

  // Host público del WS (SOLO hostname, sin https://)
  wsHost: "api.deliverysobreruedas.com",

  wsPort: 443,
  wssPort: 443,
  reverbUseTLS: true,

  get broadcastingAuthUrl() {
    return `${this.baseURL}/broadcasting/auth`;
  },

  timeout: 120000,
};
