import { authService } from "../auth/AuthService";
import { api } from "../conector/api";

export type DesglosePago = {
  quincena: number;
  capital: number;
  interes: number;
  iva: number;
  total_interes: number;
  pago_total: number;
};

export type SimulacionResponse = {
  success: boolean;
  message: string;
  data: {
    monto_solicitado: number;
    numero_pagos: number;
    plazo: string;
    pago_por_quincena: number;
    monto_total_pagar: number;
    interes_total: number;
    fecha_primer_pago: string;
    fecha_ultimo_pago: string;
    desglose_pagos: DesglosePago[];
  };
};

export type CrearPrestamoResponse = {
  success: boolean;
  message: string;
  data: {
    prestamo: {
      id: number;
      folio: string;
      monto_solicitado: number;
      monto_total_pagar: number;
      numero_pagos: number;
      pago_quincenal: number;
      estado: string;
    };
    desglose_pagos: DesglosePago[];
  };
};

export const PrestamoService = {
  async simular(
    montoSolicitado: number,
    numeroPagos: 1 | 2,
  ): Promise<SimulacionResponse> {
    const token = await authService.getToken();
    const response = await api.post(
      "/genera-opciones",
      {
        monto_solicitado: montoSolicitado,
        numero_pagos: numeroPagos,
        solo_simulacion: true,
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

  async crear(
    montoSolicitado: number,
    numeroPagos: 1 | 2,
  ): Promise<CrearPrestamoResponse> {
    const token = await authService.getToken();
    const response = await api.post(
      "/genera-opciones",
      {
        monto_solicitado: montoSolicitado,
        numero_pagos: numeroPagos,
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
