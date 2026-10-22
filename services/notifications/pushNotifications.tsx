import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "../conector/api";

const KEY_LAST_REGISTRATION = "@push_last_registration";
const KEY_LAST_TOKEN = "@push_last_token";
const KEY_PENDING_REMOVAL = "@push_pending_removal";
const RENEW_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function configurarHandlerNotificaciones() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function crearCanalAndroid() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#940000",
    sound: "notificacion",
  });
}

async function pedirPermisos(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function obtenerExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  await crearCanalAndroid();
  const concedido = await pedirPermisos();
  if (!concedido) return null;

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;
    if (!projectId) return null;
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    return null;
  }
}

let registroEnCurso: Promise<boolean> | null = null;

export async function registrarYEnviarToken(): Promise<boolean> {
  if (registroEnCurso) return registroEnCurso;

  registroEnCurso = (async () => {
    try {
      const token = await obtenerExpoPushToken();
      if (!token) return false;

      await api.post("/user/push-token", { expo_push_token: token });

      await AsyncStorage.multiSet([
        [KEY_LAST_REGISTRATION, String(Date.now())],
        [KEY_LAST_TOKEN, token],
      ]);

      const pendiente = await AsyncStorage.getItem(KEY_PENDING_REMOVAL);
      if (pendiente && pendiente === token) {
        await AsyncStorage.removeItem(KEY_PENDING_REMOVAL);
      }
      return true;
    } catch (e) {
      return false;
    } finally {
      registroEnCurso = null;
    }
  })();

  return registroEnCurso;
}

export async function renovarTokenSiEsNecesario(): Promise<void> {
  try {
    const last = await AsyncStorage.getItem(KEY_LAST_REGISTRATION);
    const now = Date.now();
    if (last && now - parseInt(last, 10) < RENEW_INTERVAL_MS) return;
    await registrarYEnviarToken();
  } catch (e) {}
}

export async function limpiarMarcaRegistro(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEY_LAST_REGISTRATION, KEY_LAST_TOKEN]);
  } catch (e) {}
}

// ⚠️ Esta función ya no se usa desde AuthService, pero la dejamos por compatibilidad.
export async function cerrarSesionPush(): Promise<void> {
  await limpiarMarcaRegistro();
}

export async function procesarEliminacionPendiente(): Promise<void> {
  try {
    const pendiente = await AsyncStorage.getItem(KEY_PENDING_REMOVAL);
    if (!pendiente) return;

    const tokenActual = await AsyncStorage.getItem(KEY_LAST_TOKEN);
    if (tokenActual && tokenActual === pendiente) {
      await AsyncStorage.removeItem(KEY_PENDING_REMOVAL);
      return;
    }

    await api.post("/user/push-token/remove", { expo_push_token: pendiente });
    await AsyncStorage.removeItem(KEY_PENDING_REMOVAL);
  } catch (e) {}
}

export function escucharNotificacionesForeground(
  onReceived?: (n: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener((notification) =>
    onReceived?.(notification),
  );
}

export function escucharTapNotificacion(
  onTap: (data: Record<string, any>) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) =>
    onTap(response.notification.request.content.data ?? {}),
  );
}

export async function obtenerNotificacionQueAbrioLaApp(): Promise<Record<
  string,
  any
> | null> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return null;
    return response.notification.request.content.data ?? {};
  } catch (e) {
    return null;
  }
}
