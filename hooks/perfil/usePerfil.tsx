// hooks/perfil/usePerfil.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

import { API_CONFIG } from "@/config/ApiConfig";
import { authService, type UserData } from "@/services/auth/AuthService";

const API_URL = API_CONFIG.baseURL;
const CARPETA_PERFIL = `${FileSystem.documentDirectory}perfil/`;
const CLAVE_STORAGE = "perfil_data";

type PerfilData = {
  nombre: string;
  correo: string;
  telefono: string;
  ciudad: string;
  portada: string | null;
  avatar: string | null;
};

type Params = { userNameInicial?: string };

type UpdateResponse = {
  res: boolean;
  msg?: string;
  user?: Partial<UserData>;
};

// ─────────────────────────────────────────────────────────────
// Helpers de storage local
// ─────────────────────────────────────────────────────────────

async function leerPerfilLocal(): Promise<Partial<PerfilData> | null> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_STORAGE);
    return raw ? (JSON.parse(raw) as Partial<PerfilData>) : null;
  } catch {
    return null;
  }
}

async function escribirPerfil(data: PerfilData): Promise<void> {
  const limpio: PerfilData = {
    ...data,
    portada: data.portada ? data.portada.split("?")[0] : null,
    avatar: data.avatar ? data.avatar.split("?")[0] : null,
  };
  await AsyncStorage.setItem(CLAVE_STORAGE, JSON.stringify(limpio));
}

async function copiarImagenPermanente(
  origenUri: string,
  tipo: "portada" | "avatar",
): Promise<string> {
  await FileSystem.makeDirectoryAsync(CARPETA_PERFIL, {
    intermediates: true,
  }).catch(() => {});
  const destino = `${CARPETA_PERFIL}${tipo}.jpg`;
  await FileSystem.deleteAsync(destino, { idempotent: true });
  await FileSystem.copyAsync({ from: origenUri, to: destino });
  // ?t= solo para forzar refresh visual en <Image>, se limpia antes del FormData
  return `${destino}?t=${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────
// Helpers de FormData
// ─────────────────────────────────────────────────────────────

function esArchivoLocal(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://") ||
    uri.startsWith("assets-library://")
  );
}

function archivoParaFormData(uri: string, nombre: string) {
  const uriSinQuery = uri.split("?")[0];
  const extension = uriSinQuery.split(".").pop()?.toLowerCase() ?? "jpg";

  const mime =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : extension === "heic"
          ? "image/heic"
          : extension === "gif"
            ? "image/gif"
            : "image/jpeg";

  return {
    uri: uriSinQuery,
    name: `${nombre}_${Date.now()}.${extension}`,
    type: mime,
  } as any;
}

async function adjuntarArchivo(
  formData: FormData,
  campo: "avatar" | "portada",
  uri: string,
) {
  const uriLimpia = uri.split("?")[0];

  if (Platform.OS === "web") {
    const blob = await (await fetch(uriLimpia)).blob();
    const ext = uriLimpia.split(".").pop()?.toLowerCase() ?? "jpg";
    formData.append(campo, blob, `${campo}_${Date.now()}.${ext}`);
  } else {
    formData.append(campo, archivoParaFormData(uriLimpia, campo));
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: subir FormData con XMLHttpRequest
// (evita el bug "Unsupported FormDataPart implementation" de expo/fetch)
// ─────────────────────────────────────────────────────────────

function subirFormData(
  url: string,
  formData: FormData,
  token: string,
): Promise<UpdateResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.onload = () => {
      //console.log("═════════ XHR RESPUESTA ═════════");
      //console.log("Status:", xhr.status);
      //console.log("Body:", xhr.responseText?.substring(0, 500));

      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        reject(
          new Error(
            `Respuesta no JSON (${xhr.status}): ${xhr.responseText?.substring(0, 100)}`,
          ),
        );
      }
    };

    xhr.onerror = () => {
      //console.log("XHR onerror:", xhr);
      reject(new Error("Network request failed"));
    };

    xhr.ontimeout = () => reject(new Error("Timeout al subir"));

    xhr.send(formData);
  });
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function usePerfil({ userNameInicial = "" }: Params = {}) {
  const [portada, setPortada] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nombre, setNombre] = useState(userNameInicial);
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // ── Cargar datos al montar ──
  useEffect(() => {
    (async () => {
      const local = await leerPerfilLocal();
      const secureUser = await authService.getUserData();

      const nombreFinal =
        local?.nombre ||
        [secureUser?.nombre, secureUser?.apellido_p, secureUser?.apellido_m]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        secureUser?.nombre ||
        userNameInicial ||
        "";

      const correoFinal = local?.correo || secureUser?.email || "";
      const telefonoFinal = local?.telefono || secureUser?.telefono || "";
      const ciudadFinal = local?.ciudad || secureUser?.ciudad || "";

      setPortada(local?.portada ?? secureUser?.portada_url ?? null);
      setAvatar(local?.avatar ?? secureUser?.avatar_url ?? null);

      setNombre(nombreFinal);
      setCorreo(correoFinal);
      setTelefono(telefonoFinal);
      setCiudad(ciudadFinal);
      setCargando(false);
    })();
  }, [userNameInicial]);

  // ── Elegir imagen ──
  const elegirImagen = async (tipo: "portada" | "avatar") => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        "Permiso necesario",
        "Activa el acceso a tus fotos para cambiar la imagen",
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: tipo === "portada" ? [16, 7] : [1, 1],
      quality: 0.8,
    });

    const uri = resultado.assets?.[0]?.uri;
    if (resultado.canceled || !uri) return;

    try {
      const uriFinal = await copiarImagenPermanente(uri, tipo);
      if (tipo === "portada") setPortada(uriFinal);
      else setAvatar(uriFinal);
    } catch {
      Alert.alert("Error", "No se pudo guardar la imagen");
    }
  };

  // ── Guardar (local + backend) ──
  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }

    setGuardando(true);
    try {
      // 1) Guardar local primero (fallback si falla la red)
      await escribirPerfil({
        nombre,
        correo,
        telefono,
        ciudad,
        portada,
        avatar,
      });

      // 2) Token
      const token = await authService.getToken();
      if (!token) {
        Alert.alert(
          "Sesión expirada",
          "Vuelve a iniciar sesión para sincronizar tus cambios",
        );
        return;
      }

      // 3) Construir FormData
      const formData = new FormData();
      formData.append("_method", "PUT"); // Laravel lo interpreta como PUT
      formData.append("nombre", nombre.trim() ?? "");
      formData.append("email", correo.trim() ?? "");
      formData.append("telefono", telefono.trim() ?? "");
      formData.append("ciudad", ciudad.trim() ?? "");

      if (esArchivoLocal(avatar)) {
        await adjuntarArchivo(formData, "avatar", avatar!);
      }
      if (esArchivoLocal(portada)) {
        await adjuntarArchivo(formData, "portada", portada!);
      }

      // Debug: ver qué se envía
      if (__DEV__) {
        //console.log("═════════ FORM DATA ═════════");
        // @ts-ignore
        for (const pair of formData.entries()) {
          //console.log(" ", pair[0], "=", pair[1]);
        }
      }

      // 4) Subir con XHR
      const url = `${API_URL}/update`;
      //console.log("═════════ XHR UPLOAD ═════════");
      //console.log("URL:", url);

      const json = await subirFormData(url, formData, token);

      // 5) Validar respuesta
      if (!json?.res) {
        throw new Error(json?.msg ?? "Error al guardar");
      }

      // 6) Actualizar SecureStore
      const prevRaw = await authService.getUserData();
      const prev: Partial<UserData> = prevRaw ?? {};

      const actualizado: Partial<UserData> = {
        ...prev,
        nombre: json?.user?.nombre ?? prev.nombre,
        apellido_p: json?.user?.apellido_p ?? prev.apellido_p,
        apellido_m: json?.user?.apellido_m ?? prev.apellido_m,
        email: json?.user?.email ?? prev.email,
        telefono: json?.user?.telefono ?? prev.telefono,
        ciudad: json?.user?.ciudad ?? prev.ciudad,
        avatar_url: json?.user?.avatar_url ?? prev.avatar_url ?? null,
        portada_url: json?.user?.portada_url ?? prev.portada_url ?? null,
      };

      await SecureStore.setItemAsync("userData", JSON.stringify(actualizado));

      // 7) Refrescar UI con URLs del backend
      if (json?.user?.avatar_url) setAvatar(json.user.avatar_url);
      if (json?.user?.portada_url) setPortada(json.user.portada_url);

      // 8) Limpiar caché local (ya no necesitamos los file://)
      await escribirPerfil({
        nombre: actualizado.nombre ?? nombre,
        correo: actualizado.email ?? correo,
        telefono: actualizado.telefono ?? telefono,
        ciudad: actualizado.ciudad ?? ciudad,
        portada: json?.user?.portada_url ?? portada,
        avatar: json?.user?.avatar_url ?? avatar,
      });

      Alert.alert("Listo", "Tu información se actualizó correctamente");
    } catch (e: any) {
      //console.log("═════════ ERROR ═════════");
      //console.log("Name:", e?.name);
      //console.log("Message:", e?.message);
      //console.log("Stack:", e?.stack);

      Alert.alert(
        "Error",
        `No se pudo guardar tu información: ${e?.message ?? String(e)}`,
      );
    } finally {
      setGuardando(false);
    }
  };

  // ── Iniciales para avatar por defecto ──
  const initials = (nombre || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return {
    portada,
    avatar,
    nombre,
    correo,
    telefono,
    ciudad,
    cargando,
    guardando,
    initials,
    setNombre,
    setCorreo,
    setTelefono,
    setCiudad,
    elegirImagen,
    handleGuardar,
  };
}
