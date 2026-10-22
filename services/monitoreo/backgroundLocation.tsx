// services/monitoreo/backgroundLocation.tsx
import { api } from "@/services/conector/api";
import * as Location from "expo-location";

export const BG_LOCATION_TASK = "monitoreo-bg-location";

// Carga protegida: si el build instalado no trae el módulo nativo, la app NO se rompe
// (solo queda sin GPS en segundo plano).
let TaskManager: typeof import("expo-task-manager") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  TaskManager = require("expo-task-manager");
} catch {
  console.warn("[BG] expo-task-manager no está en este build");
}

if (TaskManager) {
  TaskManager.defineTask(BG_LOCATION_TASK, async ({ data, error }: any) => {
    if (error || !data?.locations?.length) return;
    const { latitude, longitude } =
      data.locations[data.locations.length - 1].coords;
    try {
      await api.post("/mapa/ubicacion", {
        latitud: latitude,
        longitud: longitude,
      });
    } catch {
      /* sin red: el siguiente tick reintenta */
    }
  });
}

// El permiso de "todo el tiempo" se pide como máximo UNA vez por ejecución de la app
let bgYaPedido = false;

/**
 * pedirPermiso = true  → solo al pulsar "Conectar".
 * pedirPermiso = false → al volver de segundo plano / reanudar: nunca muestra diálogos.
 */
export async function startBgLocation(pedirPermiso = false): Promise<boolean> {
  if (!TaskManager) return false;
  try {
    // El permiso normal lo pide useLocationTracking; aquí solo se consulta
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== "granted") return false;

    let bg = await Location.getBackgroundPermissionsAsync();
    if (bg.status !== "granted") {
      if (!pedirPermiso || bgYaPedido) return false;
      bgYaPedido = true;
      bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status !== "granted") return false;
    }

    if (!(await Location.hasServicesEnabledAsync())) return false;
    if (await Location.hasStartedLocationUpdatesAsync(BG_LOCATION_TASK))
      return true;

    await Location.startLocationUpdatesAsync(BG_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 10,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Monitoreo activo",
        notificationBody: "Compartiendo tu ubicación con tu grupo",
        notificationColor: "#940000",
      },
    });
    return true;
  } catch (e: any) {
    console.warn("[BG] no se pudo iniciar:", e?.message);
    return false;
  }
}

export async function stopBgLocation(): Promise<void> {
  if (!TaskManager) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(BG_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(BG_LOCATION_TASK);
    }
  } catch {}
}
