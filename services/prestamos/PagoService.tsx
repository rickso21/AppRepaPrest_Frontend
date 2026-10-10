import { authService } from "../auth/AuthService";
import { api } from "../conector/api";

//Tipo: instrucciones que devuelve el backend
export type InstruccionesPago = {
  pasos: string[];
  tiempo_estimado: string;
};

//Tipo: respuesta de registrarPago
export type RegistrarPagoResponse = {
  success: boolean;
  message: string;
  data: {
    pago_id: number;
    preference_id: string;
    init_point: string;
    sandbox_init_point?: string;
    prestamo_folio: string;
    es_actualizado?: boolean;
    monto?: number;
    datos: {
      instrucciones: InstruccionesPago;
    };
  };
};

//Tipo: parámetros de entrada
export type RegistrarPagoParams = {
  usuario_id: number;
  monto_pago: number;
  referencia?: string;
  observaciones?: string;
  es_pago_adelantado?: boolean;
  metodo_pago?: string;
};

export const PagoService = {
  async registrarPago(
    params: RegistrarPagoParams,
  ): Promise<RegistrarPagoResponse> {
    const token = await authService.getToken();

    if (!token) {
      throw new Error("No hay sesión activa");
    }

    const response = await api.post<RegistrarPagoResponse>(
      "/registrar-pago",
      {
        usuario_id: params.usuario_id,
        monto_pago: params.monto_pago,
        referencia: params.referencia ?? `PAGO-${Date.now()}`,
        observaciones: params.observaciones ?? "Pago quincenal",
        es_pago_adelantado: params.es_pago_adelantado ?? false,
        metodo_pago: params.metodo_pago ?? "Mercado Pago",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  },
};
