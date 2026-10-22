import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "../../config/ApiConfig";
import { api, invalidateTokenCache } from "../conector/api";
import {
  limpiarMarcaRegistro,
  procesarEliminacionPendiente,
  registrarYEnviarToken,
} from "../notifications/pushNotifications";

const TOKEN_KEY = "userToken";
const USER_KEY = "userData";
const EXP_KEY = "tokenExpiry";

const KEY_PENDING_REMOVAL = "@push_pending_removal";
const KEY_LAST_TOKEN = "@push_last_token";

const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token);
const getTokenRaw = () => SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
const delToken = () => SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  res: boolean;
  token: string;
  created_at: string;
  expired_at: string;
  msg: string;
  user: {
    id: number;
    nombre: string;
    nombre_completo?: string;
    nombre_raw?: string;
    email: string;
    telefono?: string;
    apellido_p?: string;
    apellido_m?: string;
    direccion?: string;
    curp?: string;
    grupo_id?: number;
    ciudad?: string;
    rol_id?: number;
    avatar_url?: string | null;
    portada_url?: string | null;
    grupo_nombre?: string;
  };
}

export interface RegisterAgrupacionData {
  name: string;
  apellido_p: string;
  apellido_m: string;
  email: string;
  telefono: string;
  password: string;
  password_confirmation: string;
  name_group: string;
  ciudad?: string;
  avatar?: any;
  portada?: any;
}

export interface RegisterAgrupacionResponse {
  res: boolean;
  msg: string;
  code?: string;
  user?: any;
}

export interface RegisterAsociadoData {
  name: string;
  apellido_p: string;
  apellido_m: string;
  email: string;
  telefono: string;
  password: string;
  password_confirmation: string;
  code: string;
  ciudad?: string;
  avatar?: any;
  portada?: any;
}

export interface RegisterAsociadoResponse {
  res?: boolean;
  success?: boolean;
  msg?: string;
  user?: any;
}

export interface ForgotPasswordResponse {
  res: boolean;
  msg: string;
}

export interface ChangePasswordResponse {
  res: boolean;
  msg: string;
}

const esFormData = (data: any): boolean =>
  typeof FormData !== "undefined" && data instanceof FormData;

function subirConXHR<T>(
  url: string,
  formData: FormData,
  token?: string | null,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 120000;

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.setRequestHeader("Accept", "application/json");

    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        reject(
          new Error(
            `Respuesta no JSON (${xhr.status}): ${xhr.responseText?.substring(0, 100)}`,
          ),
        );
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(json);
      } else {
        reject({
          ...json,
          response: { status: xhr.status, data: json },
        });
      }
    };

    xhr.onerror = () => {
      console.log("XHR onerror:", xhr);
      reject(new Error("Network request failed"));
    };

    xhr.ontimeout = () => reject(new Error("Timeout al subir archivos"));

    xhr.send(formData);
  });
}

export const authService = {
  // LOGIN
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/login", credentials);

    if (response.data.res === true && response.data.token) {
      await saveToken(response.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      await AsyncStorage.setItem(EXP_KEY, response.data.expired_at);

      invalidateTokenCache();

      await procesarEliminacionPendiente().catch((e: any) => {
        console.log("[authService.login] pending removal error:", e?.message);
      });

      await limpiarMarcaRegistro();
      registrarYEnviarToken().catch((e: any) => {
        console.log("[authService.login] push token error:", e?.message);
      });
    }

    return response.data;
  },

  // REGISTRO ADMIN
  registerAgrupacion: async (
    data: RegisterAgrupacionData | FormData,
  ): Promise<RegisterAgrupacionResponse> => {
    if (esFormData(data)) {
      const baseURL = api.defaults.baseURL ?? "";
      const url = `${baseURL}/register_admin`;

      try {
        return await subirConXHR<RegisterAgrupacionResponse>(
          url,
          data as FormData,
        );
      } catch (error: any) {
        if (error?.response?.data) throw error.response.data;
        if (error?.msg) throw error;
        throw error;
      }
    }

    try {
      const response = await api.post<RegisterAgrupacionResponse>(
        "/register_admin",
        data,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  },

  // REGISTRO ASOCIADO
  registerAsociado: async (
    data: RegisterAsociadoData | FormData,
  ): Promise<RegisterAsociadoResponse> => {
    if (esFormData(data)) {
      const baseURL = api.defaults.baseURL ?? "";
      const url = `${baseURL}/register`;
      try {
        return await subirConXHR<RegisterAsociadoResponse>(
          url,
          data as FormData,
        );
      } catch (error: any) {
        if (error?.response?.data) throw error.response.data;
        if (error?.msg) throw error;
        throw error;
      }
    }

    try {
      const response = await api.post<RegisterAsociadoResponse>(
        "/register",
        data,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  },

  // RECUPERAR CONTRASEÑA (público, sin token)
  forgotPassword: async (
    identifier: string,
  ): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ForgotPasswordResponse>(
        "/forgot-password",
        { email: identifier.trim() },
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  },

  // CAMBIAR CONTRASEÑA (autenticado)
  changePassword: async (
    passwordActual: string,
    passwordNueva: string,
    passwordNuevaConfirm: string,
  ): Promise<ChangePasswordResponse> => {
    try {
      const response = await api.post<ChangePasswordResponse>(
        "/change-password",
        {
          password_actual: passwordActual,
          password_nueva: passwordNueva,
          password_nueva_confirmation: passwordNuevaConfirm,
        },
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  },

  // LOGOUT
  // LOGOUT
  logout: async (): Promise<void> => {
    console.log("[DEBUG LOGOUT] ========== INICIO LOGOUT ==========");

    // 1. Leer AMBOS tokens INMEDIATAMENTE (antes de que algo los borre)
    let tokenExpo: string | null = null;
    let tokenJWT: string | null = null;

    try {
      tokenExpo = await AsyncStorage.getItem(KEY_LAST_TOKEN);
      tokenJWT = await SecureStore.getItemAsync(TOKEN_KEY);

      console.log(
        "[DEBUG LOGOUT] tokenExpo:",
        tokenExpo ? "✅ Encontrado" : "❌ NULL",
      );
      console.log(
        "[DEBUG LOGOUT] tokenJWT:",
        tokenJWT ? "✅ Encontrado" : "❌ NULL",
      );
    } catch (e) {
      console.log("[DEBUG LOGOUT] Error leyendo tokens:", e);
    }

    // 2. Enviar al backend ANTES de borrar nada localmente
    if (tokenExpo && tokenJWT) {
      try {
        console.log(
          "[DEBUG LOGOUT] Enviando orden al backend para borrar token...",
        );

        const response = await fetch(
          `${API_CONFIG.baseURL}/user/push-token/remove`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${tokenJWT}`,
            },
            body: JSON.stringify({ expo_push_token: tokenExpo }),
          },
        );

        const data = await response.json();
        console.log(
          "[DEBUG LOGOUT] ✅ Backend confirmó:",
          response.status,
          data,
        );
      } catch (e: any) {
        console.log(
          "[DEBUG LOGOUT] ❌ Error de red al borrar token:",
          e?.message,
        );
      }
    } else {
      console.log(
        "[DEBUG LOGOUT] ⚠️ No se pudo avisar al backend porque faltó un token.",
      );
    }

    // 3. Cancelar notificaciones locales pendientes en el teléfono
    try {
      const Notifications = await import("expo-notifications");
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
    } catch (e) {}

    // 4. Limpiar toda la sesión del teléfono (esto se hace AL FINAL)
    await limpiarMarcaRegistro();
    await delToken();
    await AsyncStorage.multiRemove([
      USER_KEY,
      EXP_KEY,
      "perfil_data",
      KEY_PENDING_REMOVAL,
    ]).catch(() => {});
    invalidateTokenCache();

    console.log("[DEBUG LOGOUT] ========== FIN LOGOUT ==========");
  },

  // HELPERS
  getToken: async (): Promise<string | null> => {
    return await getTokenRaw();
  },

  getUserData: async (): Promise<LoginResponse["user"] | null> => {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getTokenExpiry: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(EXP_KEY);
    } catch {
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await getTokenRaw();
      return !!token;
    } catch {
      return false;
    }
  },
};

export type UserData = LoginResponse["user"];
