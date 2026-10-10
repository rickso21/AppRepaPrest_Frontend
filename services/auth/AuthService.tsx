import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { api, invalidateTokenCache } from "../conector/api";
import { registrarYEnviarToken } from "../notifications/pushNotifications";

const Storage = {
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {}
  },
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      return null;
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {}
  },
};

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
  // ============================================================
  // LOGIN
  // ============================================================
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>("/login", credentials);

      if (response.data.res === true && response.data.token) {
        await Storage.setItem("userToken", response.data.token);
        // ✅ Invalidar cache del token para que el próximo request lo lea fresco
        invalidateTokenCache();
        await Storage.setItem("userData", JSON.stringify(response.data.user));
        await Storage.setItem("tokenExpiry", response.data.expired_at);

        // Registrar push token DESPUÉS de guardar credenciales
        registrarYEnviarToken().catch((e) => {
          console.log("[authService.login] push token error:", e?.message);
        });
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================
  // REGISTRO ADMIN
  // ============================================================
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

  // ============================================================
  // REGISTRO ASOCIADO
  // ============================================================
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

  // ============================================================
  // RECUPERAR CONTRASEÑA (público, sin token)
  // ============================================================
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

  // ============================================================
  // CAMBIAR CONTRASEÑA (autenticado)
  // ============================================================
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

  // ============================================================
  // LOGOUT
  // ============================================================
  logout: async (): Promise<void> => {
    try {
      await Storage.removeItem("userToken");
      await Storage.removeItem("userData");
      await Storage.removeItem("tokenExpiry");
      await AsyncStorage.removeItem("perfil_data");
      // ✅ Limpiar cache del token en memoria
      invalidateTokenCache();
    } catch (error) {
      try {
        await Storage.removeItem("userToken");
        await Storage.removeItem("userData");
        await Storage.removeItem("tokenExpiry");
        invalidateTokenCache();
      } catch (cleanupError) {}
    }
  },

  // ============================================================
  // HELPERS
  // ============================================================
  getToken: async (): Promise<string | null> => {
    return await Storage.getItem("userToken");
  },

  getUserData: async (): Promise<LoginResponse["user"] | null> => {
    try {
      const userData = await Storage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await Storage.getItem("userToken");
      return !!token;
    } catch (error) {
      return false;
    }
  },
};

export type UserData = LoginResponse["user"];
