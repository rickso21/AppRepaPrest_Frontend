import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "../../config/ApiConfig";

let cachedToken: string | null = null;
let tokenLoaded = false;

async function getToken(): Promise<string | null> {
  if (tokenLoaded) return cachedToken;
  try {
    cachedToken = await SecureStore.getItemAsync("userToken");
  } catch {
    cachedToken = null;
  }
  tokenLoaded = true;
  return cachedToken;
}

export function invalidateTokenCache() {
  cachedToken = null;
  tokenLoaded = false;
}

// Axios instance
export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let handling401 = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url ?? "";

    // ✅ FIX CRÍTICO: NO disparar logout en peticiones de push-token.
    //    Si el POST /user/push-token/remove devuelve 401 (JWT expirado),
    //    el interceptor llamaría authService.logout() → que vuelve a hacer
    //    el POST → loop infinito → nunca se borra el token.
    if (url.includes("/user/push-token")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !handling401) {
      handling401 = true;
      try {
        const { authService } = await import("../auth/AuthService");

        await authService.logout().catch((e) => {
          console.log("[api 401] logout error:", e?.message);
        });

        console.log("[api 401] Sesión expirada, redirigiendo a login");

        // Import dinámico del router (evita problemas en init)
        const { router } = await import("expo-router");
        router.replace("/login");
      } catch (e: any) {
        console.log("[api 401] handler error:", e?.message);
      } finally {
        // Pequeño delay para evitar re-disparo si hay requests rezagados
        setTimeout(() => {
          handling401 = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  },
);

export const getMediaBaseUrl = (): string => {
  return (API_CONFIG.baseURL ?? "").replace(/\/api\/?$/, "");
};
