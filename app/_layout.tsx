import "../services/home/livekit-bootstrap";

import type * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect, useRef } from "react";

import { authService } from "../services/auth/AuthService";
import { navegarDesdeNotificacion } from "../services/notifications/pushNavigation";
import {
  configurarHandlerNotificaciones,
  escucharNotificacionesForeground,
  escucharTapNotificacion,
  obtenerNotificacionQueAbrioLaApp,
  renovarTokenSiEsNecesario,
} from "../services/notifications/pushNotifications";

configurarHandlerNotificaciones();

export default function RootLayout() {
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let active = true;

    // 0. Cold start
    (async () => {
      const data = await obtenerNotificacionQueAbrioLaApp();
      if (!active || !data) return;
      setTimeout(() => {
        if (active) navegarDesdeNotificacion(data);
      }, 300);
    })();

    // 1. Renovación (o registro inicial) si ya hay sesión
    (async () => {
      const isAuth = await authService.isAuthenticated();
      if (!active || !isAuth) return;
      await renovarTokenSiEsNecesario();
    })();

    // 2. Foreground
    notifListener.current = escucharNotificacionesForeground();

    // 3. Tap
    responseListener.current = escucharTapNotificacion(
      navegarDesdeNotificacion,
    );

    // 4. Chequeo periódico (cada 1h decide si renueva)
    const interval = setInterval(
      async () => {
        const isAuth = await authService.isAuthenticated();
        if (isAuth) await renovarTokenSiEsNecesario();
      },
      60 * 60 * 1000,
    );

    return () => {
      active = false;
      notifListener.current?.remove();
      responseListener.current?.remove();
      clearInterval(interval);
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
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
    </Stack>
  );
}
