import { api } from '../api';
import * as SecureStore from 'expo-secure-store';

const Storage = {
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error al guardar en SecureStore:', error);
    }
  },
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error al obtener de SecureStore:', error);
      return null;
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error al eliminar de SecureStore:', error);
    }
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
    email: string;
    telefono: string;
  };
}


export interface RegisterAgrupacionData {
  name: string;
  apellido_p: string;
  apellido_m: string;
  email: string;
  telefono: string; // ← Campo adicional
  password: string;
  password_confirmation: string;
  name_group: string;
  // NOTA: El backend genera el código automáticamente, no lo enviamos
}

export interface RegisterAgrupacionResponse {
  res: boolean;
  msg: string;
  code?: string; 
}

// ========== REGISTRO DE ASOCIADO ==========
export interface RegisterAsociadoData {
  name: string;
  apellido_p: string;
  apellido_m: string;
  email: string;
  telefono: string;
  password: string;
  password_confirmation: string;
  code: string;
}

export interface RegisterAsociadoResponse {
  res?: boolean;
  success?: boolean;
  msg?: string;
  user?: any;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/login', credentials);
      if (response.data.res === true && response.data.token) {        
        await Storage.setItem('userToken', response.data.token);
        await Storage.setItem('userData', JSON.stringify(response.data.user));
        await Storage.setItem('tokenExpiry', response.data.expired_at);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ========== MÉTODO DE REGISTRO ADMIN AGRUPACION ==========
registerAgrupacion: async (data: RegisterAgrupacionData): Promise<RegisterAgrupacionResponse> => {
  try {
    const response = await api.post<RegisterAgrupacionResponse>('/register_admin', data);
    return response.data;
  } catch (error: any) {
    console.error('Error en registro de agrupación:', error);
    // Si el backend devuelve una respuesta con error
    if (error.response?.data) {
      throw error.response.data;
    }
    throw error;
  }
},


  // ========== MÉTODO DE REGISTRO USUARIO ASOCIADO ==========
registerAsociado: async (data: RegisterAsociadoData): Promise<RegisterAsociadoResponse> => {
  try {
    const response = await api.post<RegisterAsociadoResponse>('/register', data);
    console.log('Respuesta del servidor - Status:', response.status);
    console.log('Respuesta del servidor - Data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error en registro de asociado:', error);
    // Si el servidor devuelve una respuesta de error, la lanzamos
    if (error.response?.data) {
      throw error.response.data;
    }
    throw error;
  }
},


  logout: async (): Promise<void> => {
    try {
      // ========== SOLO LIMPIAR EL ESTADO LOCAL ==========
      // No llamamos a /logout porque no existe en el backend
      // Solo eliminamos los datos almacenados localmente
      await Storage.removeItem('userToken');
      await Storage.removeItem('userData');
      await Storage.removeItem('tokenExpiry');
      console.log('Sesión cerrada localmente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Intentar limpiar de todas formas
      try {
        await Storage.removeItem('userToken');
        await Storage.removeItem('userData');
        await Storage.removeItem('tokenExpiry');
      } catch (cleanupError) {
        console.error('Error al limpiar almacenamiento:', cleanupError);
      }
    }
  },

  // ========== OTRAS FUNCIONES ==========
  getToken: async (): Promise<string | null> => {
    return await Storage.getItem('userToken');
  },

  getUserData: async (): Promise<LoginResponse['user'] | null> => {
    try {
      const userData = await Storage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await Storage.getItem('userToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },
};