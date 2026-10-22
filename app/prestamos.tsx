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
type EstadoSolicitud = "solicitado" | "aprobado" | "rechazado";

const DURACION_TRANSICION_MS = 4500; // ⏱️ duración de la celebración

export default function PrestamosScreen() {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [usuarioId, setUsuarioId] = useState<number>(0);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [estadoTransicion, setEstadoTransicion] =
    useState<EstadoSolicitud | null>(null);

  const validandoRef = useRef(false);
  const tieneDatosRef = useRef(false);
  const estadoAnteriorRef = useRef<string | null>(null);
  const timeoutTransicionRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const estadoTransicionRef = useRef<EstadoSolicitud | null>(null);
  useEffect(() => {
    estadoTransicionRef.current = estadoTransicion;
  }, [estadoTransicion]);

  // USUARIO
  useEffect(() => {
    authService.getUserData().then((user: any) => {
      if (user?.id) setUsuarioId(Number(user.id));
    });
  }, []);

  useEffect(() => {
    tieneDatosRef.current = !!resultado;
  }, [resultado]);

  // 🎬 DETECTAR TRANSICIÓN DE ESTADO
  useEffect(() => {
    if (!resultado) return;

    const estadoActual = resultado.estado;
    const anterior = estadoAnteriorRef.current;

    /*
    console.log("[PrestamosScreen] 🔔 resultado cambió:", {
      anterior,
      actual: estadoActual,
      folio: resultado.prestamo?.folio,
      tienePrestamo: !!resultado.prestamo,
    });*/

    if (
      anterior === "solicitado" &&
      (estadoActual === "aprobado" || estadoActual === "rechazado")
    ) {
      console.log("[PrestamosScreen] 🎬 INICIANDO TRANSICIÓN:", estadoActual);
      setEstadoTransicion(estadoActual);

      if (timeoutTransicionRef.current) {
        clearTimeout(timeoutTransicionRef.current);
      }

      timeoutTransicionRef.current = setTimeout(() => {
        //.log("[PrestamosScreen] ⏹️ Fin transición");
        setEstadoTransicion(null);
        timeoutTransicionRef.current = null;
      }, DURACION_TRANSICION_MS);
    }

    estadoAnteriorRef.current = estadoActual;
  }, [resultado]);

  // 🧹 Cleanup
  useEffect(() => {
    return () => {
      if (timeoutTransicionRef.current) {
        clearTimeout(timeoutTransicionRef.current);
      }
    };
  }, []);

  const revalidar = useCallback(
    async (opts?: RefreshOptions): Promise<void> => {
      const silencioso = opts?.silencioso ?? false;

      if (estadoTransicionRef.current !== null) {
        /*
        console.log(
          "[PrestamosScreen] ⏸️ transición activa, se ignora revalidar",
        );*/
        return;
      }

      /*
      console.log(
        "[PrestamosScreen] 🔄 revalidar llamado, silencioso:",
        silencioso,
      );*/

      if (validandoRef.current) {
        /*
        console.log(
          "[PrestamosScreen] ⚠️ ya hay una validación en curso, se ignora",
        );*/
        return;
      }
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
        /*
        console.log("[PrestamosScreen] ✅ respuesta backend:", {
          estado: res?.estado,
          folio: res?.prestamo?.folio,
          mensaje: res?.mensaje,
        });*/
        setResultado(res);
      } catch (error) {
        //.log("[PrestamosScreen] ❌ error validando:", error);
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

    //.log("[PrestamosScreen] 👁️ focus activo, revalidando...");
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

    // 🎬 SOLICITADO o TRANSICIÓN
    if (resultado.estado === "solicitado" || estadoTransicion !== null) {
      const estadoParaHijo: EstadoSolicitud = estadoTransicion ?? "solicitado";
      const enTransicion = estadoTransicion !== null;

      /*
      console.log(
        "[PrestamosScreen] 🎨 render SolicitudEnviadaView con estado:",
        estadoParaHijo,
        "enTransicion:",
        enTransicion,
      );
*/
      return (
        <SolicitudEnviadaView
          key="solicitud-enviada-view"
          folio={resultado.prestamo?.folio ?? "PRE-XXXX"}
          montoSolicitado={resultado.prestamo?.montoSolicitado ?? 0}
          pagoQuincenal={resultado.prestamo?.cuotaQuincenal ?? 0}
          numeroPagos={resultado.prestamo?.quincenas ?? 0}
          estadoActual={estadoParaHijo}
          onRefresh={revalidar}
        />
      );
    }

    // APROBADO
    if (resultado.estado === "aprobado" && resultado.prestamo) {
      //.log("[PrestamosScreen] 🎨 render PrestamoAprobadoView");
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
      //.log("[PrestamosScreen] 🎨 render PrestamoActivoView");
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
      //.log("[PrestamosScreen] 🎨 render PrestamoRechazadoView");
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
      return (
        <PrestamosSolicitudView
          lineaCredito={resultado.lineaCredito}
          onRefresh={revalidar}
        />
      );
    }

    // LÍNEA DISPONIBLE
    if (resultado.estado === "linea_disponible" && resultado.lineaCredito) {
      return (
        <PrestamosSolicitudView
          lineaCredito={resultado.lineaCredito}
          onRefresh={revalidar}
        />
      );
    }

    return <LoadingState mensaje="Cargando información..." />;
  })();

  return (
    <View style={styles.root}>
      {contenido}

      {refrescando && (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.overlayCard}>
            <ActivityIndicator color="#940000" size="large" />
            <Text style={styles.overlayText}>Actualizando...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A12" },
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
  },
  overlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
