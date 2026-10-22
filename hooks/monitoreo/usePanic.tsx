import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert, Vibration } from "react-native";
import { api } from "../../services/conector/api";
import { SoundService } from "../../services/home/SoundService";

type Args = {
  tokenRef: React.MutableRefObject<string | null>;
  userIdNum: number;
  conectado: boolean;
  suprimirAlertasRef: React.MutableRefObject<boolean>;
  alertasPanicoMostradasRef: React.MutableRefObject<Set<number>>;
  cooldownPanicoRef: React.MutableRefObject<Map<number, number>>;
};

export function usePanic({
  tokenRef,
  userIdNum,
  conectado,
  suprimirAlertasRef,
  alertasPanicoMostradasRef,
  cooldownPanicoRef,
}: Args) {
  const [panicoActivo, setPanicoActivo] = useState(false);
  const [cargandoPanico, setCargandoPanico] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const togglePanicoAPI = useCallback(
    async (accion: "activar" | "desactivar", extra?: Record<string, any>) => {
      if (!tokenRef.current) return null;
      const { data } = await api.post("/mapa/panico", { accion, ...extra });
      return data;
    },
    [tokenRef],
  );

  const desactivarPanicoDirecto = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    setCargandoPanico(true);
    suprimirAlertasRef.current = true;

    try {
      const response = await togglePanicoAPI("desactivar", {
        accion: "desactivar",
      });

      if (response?.res) {
        await SoundService.stopAll();
        Vibration.cancel();
        setPanicoActivo(false);
        alertasPanicoMostradasRef.current.clear();
        cooldownPanicoRef.current.clear();
        await SoundService.playConfirmacion();

        Alert.alert(
          "ALERTA DESACTIVADA",
          "La alerta de pánico ha sido desactivada correctamente.",
        );
      } else {
        await SoundService.playAlarma();
        Alert.alert(
          "Error",
          response?.msg || "No se pudo desactivar la alerta",
        );
      }
    } catch {
      await SoundService.playAlarma();
      Alert.alert("Error", "Ocurrió un error al desactivar la alerta");
    } finally {
      setEnviando(false);
      setCargandoPanico(false);
      setTimeout(() => {
        suprimirAlertasRef.current = false;
      }, 3000);
    }
  }, [
    enviando,
    togglePanicoAPI,
    suprimirAlertasRef,
    alertasPanicoMostradasRef,
    cooldownPanicoRef,
  ]);

  const togglePanico = useCallback(async () => {
    if (cargandoPanico || !conectado) return;
    if (enviando) {
      Alert.alert("Espera", "Hay una operación en curso");
      return;
    }

    if (panicoActivo) {
      await desactivarPanicoDirecto();
      return;
    }

    setEnviando(true);
    setCargandoPanico(true);

    try {
      const obtenerPosicionRapida = async () => {
        const last = await Location.getLastKnownPositionAsync({
          maxAge: 60_000,
        });
        if (last) return last.coords;
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("GPS_TIMEOUT")), 3000),
          ),
        ]);
        return loc.coords;
      };

      const coords = await obtenerPosicionRapida();
      const response = await togglePanicoAPI("activar", {
        latitud: coords.latitude,
        longitud: coords.longitude,
        tipo_emergencia: "otro",
      });

      if (response?.res) {
        setPanicoActivo(true);
        alertasPanicoMostradasRef.current.add(userIdNum);
        Vibration.vibrate([100, 100, 100]);

        Alert.alert(
          "ALERTA DE PELIGRO ACTIVO",
          "Se ha notificado a todos los repartidores cercanos.",
          [
            {
              text: "DESACTIVAR ALERTA",
              onPress: desactivarPanicoDirecto,
              style: "destructive",
            },
            { text: "OK", style: "cancel" },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert("Error", response?.msg || "No se pudo activar la alerta");
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error al activar el pánico");
    } finally {
      setEnviando(false);
      setCargandoPanico(false);
    }
  }, [
    cargandoPanico,
    conectado,
    panicoActivo,
    enviando,
    desactivarPanicoDirecto,
    togglePanicoAPI,
    alertasPanicoMostradasRef,
    userIdNum,
  ]);

  return { panicoActivo, cargandoPanico, togglePanico };
}
