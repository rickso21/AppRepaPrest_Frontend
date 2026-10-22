// services/auth/roleRouting.ts
import type { Href } from "expo-router";
import type { LoginResponse } from "./AuthService";

export type UserLike = LoginResponse["user"];

export function getRouteByRole(user: UserLike | null | undefined): Href {
  const rol = Number(user?.rol_id);

  const commonParams = {
    userId: String(user?.id ?? ""),
    nombre: user?.nombre ?? "",
    apellidoPaterno: user?.apellido_p ?? "",
    apellidoMaterno: user?.apellido_m ?? "",
    email: user?.email ?? "",
    telefono: user?.telefono ?? "",
    avatarUrl: user?.avatar_url ?? "",
    grupoNombre: user?.grupo_nombre ?? "",
  };

  if (rol === 3 || rol === 5) {
    return { pathname: "/asesor/panel", params: commonParams } as Href;
  }

  if (rol === 4) {
    return { pathname: "/panel", params: commonParams } as Href;
  }

  return { pathname: "/home", params: commonParams } as Href;
}
