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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("userData");
      await SecureStore.deleteItemAsync("tokenExpiry");
      invalidateTokenCache();
      console.log("Sesión expirada");
    }
    return Promise.reject(error);
  },
);

export const getMediaBaseUrl = (): string => {
  return (API_CONFIG.baseURL ?? "").replace(/\/api\/?$/, "");
};
