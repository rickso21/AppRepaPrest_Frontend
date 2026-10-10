import { useIsFocused } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import LoadingState from "../components/prestamo/LoadingState";
import PagoPendienteView from "../components/prestamo/PagoPendienteView";
import PrestamoActivoView from "../components/prestamo/prestamoActivoView";
import PrestamoAprobadoView from "../components/prestamo/PrestamoAprobadoView";
import PrestamoRechazadoView from "../components/prestamo/PrestamoRechazadoView";
import PrestamosSolicitudView from "../components/prestamo/prestamosSolicitudView";
import SolicitudEnviadaView from "../components/prestamo/SolicitudEnviadaView";

import { authService } from "../services/auth/AuthService";
import {
  PrestamoValidator,
  ResultadoValidacion,
} from "../services/prestamos/prestamoValidator";

export type RefreshOptions = { silencioso?: boolean };

export default function PrestamosScreen() {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [usuarioId, setUsuarioId] = useState<number>(0);
  const [modalAbierto, setModalAbierto] = useState(false);

  const validandoRef = useRef(false);
  const tieneDatosRef = useRef(false);

  // USUARIO
  useEffect(() => {
    authService.getUserData().then((user: any) => {
      if (user?.id) setUsuarioId(Number(user.id));
    });
  }, []);

  useEffect(() => {
    tieneDatosRef.current = !!resultado;
  }, [resultado]);

  const revalidar = useCallback(
    async (opts?: RefreshOptions): Promise<void> => {
      const silencioso = opts?.silencioso ?? false;

      // Evita doble ejecución simultánea
      if (validandoRef.current) return;
      validandoRef.current = true;

      if (!silencioso) {
        if (tieneDatosRef.current) {
          setRefrescando(true);
        } else {
          setLoading(true);
        }
      }

      try {
        const res = await PrestamoValidator.validarEstado();
        setResultado(res);
      } catch (error) {
        // silencioso — el resultado queda como estaba
      } finally {
        setLoading(false);
        setRefrescando(false);
        validandoRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    if (!isFocused) return;
    if (modalAbierto) return;

    revalidar();
  }, [isFocused, modalAbierto, revalidar]);

  // ESTADO DE CARGA INICIAL
  if (loading && !resultado) {
    return <LoadingState mensaje="Cargando información..." />;
  }

  // ERROR DE RED
  if (!resultado || resultado.estado === "error") {
    return (
      <LoadingState
        mensaje={resultado?.mensaje || "No se pudo verificar tu préstamo"}
      />
    );
  }

  const contenido = (() => {
    // PAGO PENDIENTE
    if (resultado.pagoPendiente && resultado.prestamo) {
      return (
        <PagoPendienteView
          pagoPendiente={{
            id: resultado.pagoPendiente.id,
            monto: resultado.pagoPendiente.monto,
            fechaPago: resultado.pagoPendiente.fechaPago,
            referencia: resultado.pagoPendiente.referencia,
            initPoint: resultado.pagoPendiente.initPoint,
          }}
          prestamoFolio={resultado.prestamo.folio}
          montoRestante={resultado.prestamo.montoRestante}
          usuarioId={usuarioId}
          onRefresh={() => revalidar({ silencioso: true })}
          onPagoConfirmado={() => revalidar({ silencioso: false })}
        />
      );
    }

    // SOLICITADO
    if (resultado.estado === "solicitado") {
      return (
        <SolicitudEnviadaView
          folio={resultado.prestamo?.folio ?? "PRE-XXXX"}
          montoSolicitado={resultado.prestamo?.montoSolicitado ?? 0}
          pagoQuincenal={resultado.prestamo?.cuotaQuincenal ?? 0}
          numeroPagos={resultado.prestamo?.quincenas ?? 0}
          onRefresh={revalidar}
        />
      );
    }

    // APROBADO
    if (resultado.estado === "aprobado" && resultado.prestamo) {
      return (
        <PrestamoAprobadoView
          prestamo={resultado.prestamo}
          usuarioId={usuarioId}
          onRefresh={revalidar}
          onModalChange={setModalAbierto}
        />
      );
    }

    // ACTIVO
    if (resultado.estado === "activo" && resultado.prestamo) {
      return (
        <PrestamoActivoView
          prestamo={resultado.prestamo}
          usuarioId={usuarioId}
          onRefresh={revalidar}
          onModalChange={setModalAbierto}
        />
      );
    }

    // RECHAZADO
    if (resultado.estado === "rechazado") {
      return (
        <PrestamoRechazadoView
          mensaje={resultado.mensaje}
          onReintentar={revalidar}
        />
      );
    }

    // PAGADO
    if (resultado.estado === "pagado") {
      if (!resultado.lineaCredito) {
        setTimeout(() => revalidar({ silencioso: true }), 500);
        return <LoadingState mensaje="Actualizando tu línea de crédito..." />;
      }
      return <PrestamosSolicitudView lineaCredito={resultado.lineaCredito} />;
    }

    // LÍNEA DISPONIBLE
    if (resultado.estado === "linea_disponible" && resultado.lineaCredito) {
      return <PrestamosSolicitudView lineaCredito={resultado.lineaCredito} />;
    }

    return <LoadingState mensaje="Cargando información..." />;
  })();

  return (
    <View style={styles.root}>
      {contenido}

      {refrescando && (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.overlayCard}>
            <ActivityIndicator color="#FF6B35" size="large" />
            <Text style={styles.overlayText}>Actualizando...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A12",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  overlayCard: {
    backgroundColor: "#1A1A26",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  overlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
