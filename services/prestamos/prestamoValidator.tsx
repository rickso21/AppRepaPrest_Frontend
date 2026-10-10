import { authService } from "../auth/AuthService";
import { api } from "../conector/api";

//TIPOS
export type MontoSugerido = {
  monto: number;
  plazos_disponibles: number[];
  puede_1_quincena: boolean;
  puede_2_quincenas: boolean;
};

export type EstadoPrestamo =
  | "linea_disponible"
  | "solicitado"
  | "aprobado"
  | "activo"
  | "pagado"
  | "rechazado"
  | "error";

export type PagoPendiente = {
  id: number;
  monto: number;
  fechaPago: string;
  referencia: string;
  preferenceId: string;
  initPoint?: string | null;
};

export type ResultadoValidacion = {
  estado: EstadoPrestamo;
  mensaje?: string;
  lineaCredito?: {
    id: number;
    montoAprobado: number;
    montoDisponible: number;
    montosSugeridos: MontoSugerido[];
    plazosDisponibles: number[];
    tienePrestamosPagados: boolean;
    incrementoPendiente: boolean;
    esNuevoUsuario: boolean;
  };
  prestamo?: {
    id: number;
    folio: string;
    montoSolicitado: number;
    montoTotal: number;
    montoPagado: number;
    montoRestante: number;
    cuotaQuincenal: number;
    quincenas: number;
    fechaSolicitud: string;
    fechaProximoPago: string;
    quincenasRestantes: number;
    progreso: number;
  };
  pagoPendiente?: PagoPendiente | null;
};

// MAPEO DE ESTADOS

const ESTADO_MAP: Record<number, EstadoPrestamo> = {
  1: "solicitado",
  2: "aprobado",
  3: "activo",
  4: "pagado",
  5: "rechazado",
};

// VALIDADOR

export const PrestamoValidator = {
  async validarEstado(): Promise<ResultadoValidacion> {
    try {
      const token = await authService.getToken();

      if (!token) {
        return { estado: "error", mensaje: "Sin sesión activa" };
      }

      const response = await api.get("/solicita-user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = response.data;

      if (response.status === 200 && json.success) {
        return {
          estado: "linea_disponible",
          mensaje: json.message,
          lineaCredito: {
            id: json.data.linea_credito_id,
            montoAprobado: json.data.monto_aprobado,
            montoDisponible: json.data.monto_disponible,
            montosSugeridos: json.data.montos_sugeridos ?? [],
            plazosDisponibles: json.data.plazos_disponibles ?? [],
            tienePrestamosPagados: json.data.tiene_prestamos_pagados ?? false,
            incrementoPendiente: json.data.incremento_pendiente ?? false,
            esNuevoUsuario: json.data.es_nuevo_usuario ?? false,
          },
        };
      }

      return {
        estado: "error",
        mensaje: json.msg || "Respuesta inesperada del servidor",
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        const json = error.response.data;

        const estadoNumero = Number(json.estado_actual);
        const estadoMapeado = ESTADO_MAP[estadoNumero];

        if (estadoMapeado) {
          const prestamoData = json.data?.prestamo;
          const pagoPendienteData = json.data?.pago_pendiente;

          return {
            estado: estadoMapeado,
            mensaje: json.msg,
            prestamo: prestamoData
              ? {
                  id: prestamoData.id,
                  folio: prestamoData.folio,
                  montoSolicitado: prestamoData.montoSolicitado ?? 0,
                  montoTotal: prestamoData.montoTotal ?? 0,
                  montoPagado: prestamoData.montoPagado ?? 0,
                  montoRestante: prestamoData.montoRestante ?? 0,
                  cuotaQuincenal: prestamoData.cuotaQuincenal ?? 0,
                  quincenas: prestamoData.quincenas ?? 0,
                  fechaSolicitud: prestamoData.fechaSolicitud ?? "",
                  fechaProximoPago:
                    prestamoData.fechaProximoPago ?? "Por definir",
                  quincenasRestantes: prestamoData.quincenasRestantes ?? 0,
                  progreso: prestamoData.progreso ?? 0,
                }
              : undefined,
            pagoPendiente: pagoPendienteData
              ? {
                  id: pagoPendienteData.id,
                  monto: pagoPendienteData.monto,
                  fechaPago: pagoPendienteData.fecha_pago,
                  referencia: pagoPendienteData.referencia ?? "",
                  preferenceId: pagoPendienteData.preference_id ?? "",
                  initPoint: pagoPendienteData.init_point ?? null,
                }
              : null,
          };
        }
      }

      return {
        estado: "error",
        mensaje:
          error.response?.data?.msg || "No se pudo conectar con el servidor",
      };
    }
  },
};
