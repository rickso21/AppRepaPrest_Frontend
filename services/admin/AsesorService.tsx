import { api } from "../conector/api";

// ============================================================
// TIPOS
// ============================================================

export type EstadoPrestamo = 1 | 2 | 3 | 4 | 5;
export type AlertaPago = "normal" | "precaucion" | "urgente" | "vencido";

export type PrestamoResumen = {
  id: number;
  usuario: string;
  usuario_id: number;
  folio: string;
  monto_solicitado: number;
  monto_total_pagar: number;
  numero_pagos: number;
  pagos_realizados: number;
  estado_id: number;
  estado_texto: string;
  fecha_solicitud: string;
  dias_restantes_pago: number | null;
  alerta_pago: AlertaPago;
  fecha_proximo_pago: string | null;

  telefono: string | null;
  whatsapp_valido: boolean;
  whatsapp_url: string | null;
};

export type PrestamoDetalle = {
  id: number;
  folio: string;
  usuario_id: number;
  monto_inicial: number;
  monto_total: number;
  monto_pagado: number;
  monto_restante: number;
  numero_pagos: number;
  pagos_realizados: number;
  pagos_pendientes: number;
  estado: string;
  estado_id: number;
  porcentaje_avance: number;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  fecha_desembolso: string | null;
  fecha_activacion: string | null;
  fecha_liquidacion: string | null;
  fecha_ultimo_pago: string | null;
  linea_credito_id: number;
  dias_restantes_pago: number | null;
  alerta_pago: AlertaPago;
  fecha_proximo_pago: string | null;

  telefono: string | null;
  whatsapp_valido: boolean;
  whatsapp_url: string | null;
};

export type PagoHistorial = {
  id: number;
  monto: number;
  tipo: string;
  es_adelantado: boolean;
  fecha: string;
  referencia: string | null;
  observaciones: string | null;
  saldo_restante: number;
  metodo_pago: string;
  registrado_por: number | null;
};

export type ConsultarEstadoResponse = {
  success: boolean;
  data: {
    prestamo: PrestamoDetalle;
    historial_pagos: PagoHistorial[];
  };
};

export type AprobarPrestamoResponse = {
  success: boolean;
  message: string;
  data: any;
};

export type WhatsAppResponse = {
  res: boolean;
  link: string;
  mensaje: string;
};

// ============================================================
// SERVICIO
// ============================================================

export const asesorService = {
  listarPrestamos: async (): Promise<PrestamoResumen[]> => {
    try {
      const { data } = await api.get<PrestamoResumen[]>("/prestamo/show");
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  },

  consultarEstadoCuenta: async (
    prestamoId: number,
  ): Promise<ConsultarEstadoResponse> => {
    try {
      const { data } = await api.get<ConsultarEstadoResponse>(
        "/consultar-estado-cuenta",
        { params: { prestamo_id: prestamoId } },
      );
      return data;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  },

  cambiarEstado: async (
    prestamoId: number,
    nuevoEstado: EstadoPrestamo,
    motivoRechazo?: string,
  ): Promise<AprobarPrestamoResponse> => {
    try {
      const { data } = await api.put<AprobarPrestamoResponse>(
        `/prestamo/aprobar/${prestamoId}`,
        {
          estado_prestamo_id: nuevoEstado,
          motivo_rechazo: motivoRechazo ?? null,
        },
      );
      return data;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  },

  getPdfUrl: (
    prestamoId: number,
    tipo: "aprobacion" | "liquidacion" | "rechazo",
  ): string => {
    const base = (api.defaults.baseURL ?? "").replace(/\/api\/?$/, "");
    return `${base}/api/prestamos/${prestamoId}/pdf/${tipo}`;
  },

  whatsappCliente: async (prestamoId: number): Promise<WhatsAppResponse> => {
    try {
      const { data } = await api.get<WhatsAppResponse>(
        `/asesor/whatsapp/${prestamoId}`,
      );
      return data;
    } catch (error: any) {
      if (error.response?.data) throw error.response.data;
      throw error;
    }
  },

  aprobar: (prestamoId: number) => asesorService.cambiarEstado(prestamoId, 2),
  liquidar: (prestamoId: number) => asesorService.cambiarEstado(prestamoId, 4),
  rechazar: (prestamoId: number, motivo: string) =>
    asesorService.cambiarEstado(prestamoId, 5, motivo),
};
