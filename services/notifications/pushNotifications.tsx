import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "../conector/api";

// ============================================================
// Configurar cómo se muestra la notificación con la app abierta
// ============================================================
export function configurarHandlerNotificaciones() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ============================================================
// Crear canal de Android (importancia MÁXIMA)
// ============================================================
async function crearCanalAndroid() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#940000",
    //sound: "default",
  });
}

// ============================================================
// Pedir permisos al usuario
// ============================================================
async function pedirPermisos(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ============================================================
// Obtener ExpoPushToken
// ============================================================
export async function obtenerExpoPushToken(): Promise<string | null> {
  // 1. Verificar dispositivo físico
  if (!Device.isDevice) {
    console.log("[push] No es dispositivo físico, omitiendo registro");
    return null;
  }

  // 2. Crear canal de Android
  await crearCanalAndroid();

  // 3. Pedir permisos
  const concedido = await pedirPermisos();
  if (!concedido) {
    console.log("[push] Permiso denegado");
    return null;
  }

  // 4. Obtener token
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    console.log("[push] ExpoPushToken:", token);
    return token;
  } catch (e) {
    console.log("[push] Error obteniendo token:", e);
    return null;
  }
}

// ============================================================
// Registrar token y enviarlo al backend
// ============================================================
export async function registrarYEnviarToken(): Promise<void> {
  const token = await obtenerExpoPushToken();
  if (!token) return;

  try {
    await api.post("/user/push-token", { expo_push_token: token });
    console.log("[push] Token enviado al backend");
  } catch (e: any) {
    console.log("[push] Error enviando token:", e?.message);
  }
}

// ============================================================
// Listener: notificación recibida en foreground
// ============================================================
export function escucharNotificacionesForeground(
  onReceived?: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener((notification) => {
    console.log(
      "[push] Notificación recibida (foreground):",
      notification.request.content,
    );
    onReceived?.(notification);
  });
}

// ============================================================
// Listener: usuario toca la notificación
// ============================================================
export function escucharTapNotificacion(
  onTap: (data: Record<string, any>) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data ?? {};
    console.log("[push] Usuario tocó notificación:", data);
    onTap(data);
  });
}
