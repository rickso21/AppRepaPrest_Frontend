import { router } from "expo-router";

type PushData = {
  screen?: string;
  postId?: string | number;
  userId?: string | number;
  prestamoId?: string | number;
  [key: string]: any;
};

export function navegarDesdeNotificacion(data: PushData) {
  if (!data?.screen) return;

  console.log("[push] Navegando a:", data.screen, data);

  try {
    switch (data.screen) {
      case "Comunidad":
        // ✅ Vamos directo a /home (o a la ruta donde renderizas HomeTabs)
        router.push({
          pathname: "/home",
          params: {
            tab: "Comunidad",
            postId: data.postId ? String(data.postId) : "",
          },
        });
        break;

      case "Home":
        router.push({
          pathname: "/home",
          params: { tab: "Home" },
        });
        break;

      case "PrestamoActivo":
      case "PrestamoPagado":
      case "PrestamoRechazado":
        router.push({
          pathname: "/home",
          params: { tab: "Prestamos" },
        });
        break;

      // PANTALLAS FUERA DE TABS — rutas normales
      case "Perfil":
        router.push("/perfil");
        break;

      case "SolicitudPrestamo":
        router.push("/solicitud-prestamo");
        break;

      case "PanelAsesor":
        router.push("/asesor/panel");
        break;

      case "Register":
        router.push("/register");
        break;

      case "RegisterAgrupacion":
        router.push("/register-agrupacion");
        break;

      case "Login":
        router.push("/login");
        break;

      case "ForgotPassword":
        router.push("/forgot-password");
        break;

      case "RoleSelection":
        router.push("/role-selection");
        break;

      default:
        router.push("/home");
        break;
    }
  } catch (e) {
    console.log("[push] Error navegando:", e);
    try {
      router.push("/home");
    } catch {}
  }
}
