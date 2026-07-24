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