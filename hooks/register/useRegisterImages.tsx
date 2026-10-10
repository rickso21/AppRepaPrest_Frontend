import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export function useRegisterImages() {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [portadaUri, setPortadaUri] = useState<string | null>(null);

  const elegirImagen = useCallback(async (tipo: "avatar" | "portada") => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso necesario", "Activa el acceso a tus fotos.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: tipo === "avatar" ? [1, 1] : [16, 7],
      quality: 0.8,
    });

    const uri = res.assets?.[0]?.uri;
    if (res.canceled || !uri) return;

    if (tipo === "avatar") setAvatarUri(uri);
    else setPortadaUri(uri);
  }, []);

  const construirFormData = useCallback(
    (campos: Record<string, string | undefined>) => {
      //console.log("════════ construirFormData ════════");
      //console.log("avatarUri:", avatarUri);
      //console.log("portadaUri:", portadaUri);

      if (!avatarUri && !portadaUri) {
        //console.log("→ Sin imágenes, se enviará JSON");
        return null;
      }

      const formData = new FormData();

      Object.entries(campos).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (avatarUri) {
        const ext =
          avatarUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        const fileObj = {
          uri: avatarUri.split("?")[0],
          name: `avatar_${Date.now()}.${ext}`,
          type: mime,
        };
        //console.log("→ Adjuntando avatar:", fileObj);
        formData.append("avatar", fileObj as any);
      }

      if (portadaUri) {
        const ext =
          portadaUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        const fileObj = {
          uri: portadaUri.split("?")[0],
          name: `portada_${Date.now()}.${ext}`,
          type: mime,
        };
        //console.log("→ Adjuntando portada:", fileObj);
        formData.append("portada", fileObj as any);
      }

      // Log de TODOS los entries
      //console.log("→ FormData entries:");
      // @ts-ignore
      for (const pair of formData.entries()) {
        //console.log("  ", pair[0], "=", pair[1]);
      }

      return formData;
    },
    [avatarUri, portadaUri],
  );

  const reset = useCallback(() => {
    setAvatarUri(null);
    setPortadaUri(null);
  }, []);

  const resetAvatar = useCallback(() => setAvatarUri(null), []);
  const resetPortada = useCallback(() => setPortadaUri(null), []);

  return {
    avatarUri,
    portadaUri,
    elegirImagen,
    construirFormData,
    reset,
    resetAvatar,
    resetPortada,
  };
}
