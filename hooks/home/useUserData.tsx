import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

import { api } from "@/services/conector/api";

type UserParams = {
  userId?: string;
  userName?: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  avatarUrl?: string | null;
  portadaUrl?: string | null;
};

type UserData = {
  id?: number | string;
  nombre?: string;
  apellido_p?: string;
  apellido_m?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  avatar_url?: string | null;
  portada_url?: string | null;
  grupo_id?: number | string;
  grupo_nombre?: string;
};

type PrestamoBloqueante = {
  prestamo_id: number;
  folio: string;
  estado: number;
  monto_restante: number;
  pago_quincenal: number;
  numero_pagos: number;
  pagos_realizados: number;
};

async function getStorage(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function clearSession() {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem("userData");
      localStorage.removeItem("token");
    } else {
      await SecureStore.deleteItemAsync("userData");
      await SecureStore.deleteItemAsync("token");
    }
  } catch {}
}

type Args = {
  onAccountDisabled?: () => void;
};

export function useUserData(raw: UserParams, args: Args = {}) {
  const { onAccountDisabled } = args;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [inhabilitando, setInhabilitando] = useState(false);

  useEffect(() => {
    let active = true;
    getStorage("userData").then((rawData) => {
      if (!active || !rawData) return;
      try {
        setUserData(JSON.parse(rawData) as UserData);
      } catch {}
    });
    return () => {
      active = false;
    };
  }, []);

  const id = String(userData?.id ?? "") || raw.userId || "";
  const grupoNombre = userData?.grupo_nombre ?? "";
  const nombre = userData?.nombre || raw.nombre || "";

  const apellidoPaterno =
    userData?.apellido_p ||
    userData?.apellidoPaterno ||
    raw.apellidoPaterno ||
    "";

  const apellidoMaterno =
    userData?.apellido_m ||
    userData?.apellidoMaterno ||
    raw.apellidoMaterno ||
    "";

  const email = userData?.email || raw.email || "";
  const telefono = userData?.telefono || raw.telefono || "";
  const ciudad = userData?.ciudad || raw.ciudad || "";

  const userIdNum = Number(id) || 0;
  const grupoId = userData?.grupo_id ?? null;

  const nombreCompleto =
    [nombre, apellidoPaterno, apellidoMaterno]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    raw.userName ||
    nombre ||
    "Usuario";

  const avatarUrl = userData?.avatar_url ?? raw.avatarUrl ?? null;
  const portadaUrl = userData?.portada_url ?? raw.portadaUrl ?? null;

  // Inhabilitar cuenta
  const ejecutarInhabilitacion = useCallback(async () => {
    if (inhabilitando) return;
    setInhabilitando(true);

    try {
      const { data } = await api.delete("/user/delete-account");

      if (data?.res) {
        await clearSession();

        Alert.alert(
          "Cuenta Eliminada",
          "Gracias por ser de la familia Delivery Sobre Ruedas.\n\nsi tienes dudas, contacta a soporte.",
          [
            {
              text: "OK",
              onPress: () => onAccountDisabled?.(),
            },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert(
          "No se pudo eliminar tu cuenta",
          data?.msg ?? "Intenta de nuevo más tarde.",
        );
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.msg ?? e?.message ?? "Error de red";
      const prestamoData: PrestamoBloqueante | undefined =
        e?.response?.data?.data;

      if (status === 409 && prestamoData) {
        Alert.alert(
          "Préstamo activo",
          `${msg}\n\n` +
            `Folio: ${prestamoData.folio}\n` +
            `Restante: $${prestamoData.monto_restante.toLocaleString()}\n` +
            `Pagos: ${prestamoData.pagos_realizados}/${prestamoData.numero_pagos}`,
          [{ text: "Entendido" }],
        );
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setInhabilitando(false);
    }
  }, [inhabilitando, onAccountDisabled]);

  const handleInhabilitarCuenta = useCallback(() => {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro que quieres eliminar tu cuenta?\n\nEsta accion es permanente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: ejecutarInhabilitacion,
        },
      ],
    );
  }, [ejecutarInhabilitacion]);

  return {
    id,
    userIdNum,
    grupoId,
    grupoNombre,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    email,
    telefono,
    ciudad,
    nombreCompleto,
    avatarUrl,
    portadaUrl,
    inhabilitando,
    handleInhabilitarCuenta,
  };
}
