export const API_CONFIG = {
  // ⚠️ NO TOCAR: lo usan todos los componentes existentes
  baseURL: "http://192.168.1.11:8000",

  // 🔑 Reverb
  reverbKey: "r4rwgflbhgo294yupife",
  reverbPort: 8080,
  reverbUseTLS: false,

  // Endpoint de broadcasting/auth (SIN /api, va directo en la raíz)
  // Se usa SOLO en echo.tsx para autorizar canales privados.
  // OJO: se arma a partir de baseURL para no duplicar la IP.
  get broadcastingAuthUrl() {
    return `${this.baseURL}/broadcasting/auth`;
  },

  timeout: 120000,
};
