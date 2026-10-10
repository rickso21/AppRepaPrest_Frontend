import { api } from "@/services/conector/api";

export type PerfilPublico = {
  id: number;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  ciudad?: string | null;
  avatar_url?: string | null;
  portada_url?: string | null;
  rol?: number | null;
  grupo?: string | null;
};

export const userService = {
  getUserById: async (id: number | string): Promise<PerfilPublico | null> => {
    try {
      const { data } = await api.get(`/user/${id}`);
      if (data?.res && data.user) return data.user;
      return null;
    } catch (e) {
      // console.warn("[userService] error:", e);
      return null;
    }
  },
};
