import "../services/home/livekit-bootstrap";

import type * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { useEffect, useRef } from "react";

import { authService } from "../services/auth/AuthService";
import {
  configurarHandlerNotificaciones,
  escucharNotificacionesForeground,
  escucharTapNotificacion,
  registrarYEnviarToken,
} from "../services/notifications/pushNotifications";

// ============================================================
// Configurar handler global (una sola vez, al importar el módulo)
// ============================================================
configurarHandlerNotificaciones();

// ============================================================
// Root Layout
// ============================================================
export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let active = true;

    // ────────────────────────────────────────────────────────
    // 1. Registrar token al iniciar (si ya está autenticado)
    // ────────────────────────────────────────────────────────
    (async () => {
      const isAuth = await authService.isAuthenticated();
      if (!active || !isAuth) return;
      await registrarYEnviarToken();
    })();

    // ────────────────────────────────────────────────────────
    // 2. Listener: notificación recibida (foreground)
    // ────────────────────────────────────────────────────────
    notificationListener.current = escucharNotificacionesForeground();

    // ────────────────────────────────────────────────────────
    // 3. Listener: usuario toca la notificación → navegar
    // Solo navega a rutas que existen en el Stack
    // ────────────────────────────────────────────────────────
    responseListener.current = escucharTapNotificacion((data) => {
      if (!data?.screen) return;

      switch (data.screen) {
        case "Comunidad":
          router.push({
            pathname: "/comunidad",
            params: data.postId ? { postId: String(data.postId) } : {},
          });
          break;

        case "Home":
          router.push("/home");
          break;

        case "Perfil":
          router.push("/perfil");
          break;

        case "SolicitudPrestamo":
          router.push("/solicitud-prestamo");
          break;

        // Cuando descomentes las pantallas de préstamo, agrega aquí sus casos:
        // case "PrestamoActivo":
        //   router.push("/prestamo-activo");
        //   break;

        default:
          console.log("[push] Screen desconocido:", data.screen);
          break;
      }
    });

    return () => {
      active = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-agrupacion" />
      <Stack.Screen name="RegisterSuccess" />
      <Stack.Screen name="RegisterAgrupacionSuccess" />
      <Stack.Screen name="solicitud-prestamo" />
      <Stack.Screen name="comunidad" />
      <Stack.Screen name="perfil" />

      {/*
      <Stack.Screen name="prestamo" />
      <Stack.Screen name="cargando" />
      <Stack.Screen name="monto-aprobado" />
      <Stack.Screen name="prestamo-activo" /> */}
    </Stack>
  );
}
