import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Vibration } from "react-native";

// VARIABLES GLOBALES
let alarmaPlayer: AudioPlayer | null = null;
let confirmacionPlayer: AudioPlayer | null = null;
let alarmaTimeout: ReturnType<typeof setTimeout> | null = null;

// SERVICIO DE SONIDO
class SoundServiceClass {
  private audioConfigured = false;
  private preloadingAlarma = false;
  private preloadingConfirmacion = false;

  // CONFIGURACIÓN DE AUDIO

  /**
   * Configura el modo de audio global.
   * Solo se ejecuta una vez, salvo que se fuerce con `force = true`.
   */
  async configureAudio(force = false): Promise<void> {
    if (this.audioConfigured && !force) return;

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
      });
      this.audioConfigured = true;
    } catch (error) {
      console.warn("Error configurando audio:", error);
    }
  }

  // PRECARGA DE SONIDOS

  /**
   * Precarga el sonido de alarma en memoria.
   * Es seguro llamarlo varias veces; solo carga una vez.
   */
  async preloadAlarma(): Promise<void> {
    if (alarmaPlayer || this.preloadingAlarma) return;

    this.preloadingAlarma = true;
    try {
      await this.configureAudio();

      alarmaPlayer = createAudioPlayer(
        require("../assets/sounds/8footdino_on_scratch-alarm-301729.mp3"),
      );
      alarmaPlayer.volume = 1.0;
      alarmaPlayer.loop = false;
    } catch (error) {
      console.warn("No se pudo pre-cargar la alarma:", error);
      alarmaPlayer = null;
    } finally {
      this.preloadingAlarma = false;
    }
  }

  /**
   * Precarga el sonido de confirmación en memoria.
   * Es seguro llamarlo varias veces; solo carga una vez.
   */
  async preloadConfirmacion(): Promise<void> {
    if (confirmacionPlayer || this.preloadingConfirmacion) return;

    this.preloadingConfirmacion = true;
    try {
      await this.configureAudio();

      confirmacionPlayer = createAudioPlayer(
        require("../assets/sounds/tono_confirmacion.mp3"),
      );
      confirmacionPlayer.volume = 0.7;
      confirmacionPlayer.loop = false;
    } catch (error) {
      console.warn("No se pudo pre-cargar confirmación:", error);
      confirmacionPlayer = null;
    } finally {
      this.preloadingConfirmacion = false;
    }
  }

  // REPRODUCCIÓN

  /**
   * Reproduce la alarma de pánico.
   * Si no está precargada, la precarga en ese momento.
   * Si falla el audio, cae a vibración como fallback.
   */
  async playAlarma(): Promise<void> {
    // Si no está precargada, precargar ahora
    if (!alarmaPlayer) {
      await this.preloadAlarma();
    }

    // Si aún no hay sonido, fallback: solo vibración
    if (!alarmaPlayer) {
      Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
      return;
    }

    try {
      // Cancelar timeout previo si existe
      if (alarmaTimeout) {
        clearTimeout(alarmaTimeout);
        alarmaTimeout = null;
      }

      // expo-audio NO reinicia automáticamente la posición al terminar
      // Es necesario seekTo(0) antes de play() para reproducir de nuevo desde el inicio[citation:13]
      alarmaPlayer.seekTo(0);
      alarmaPlayer.play();

      // Detener automáticamente después de 5 segundos
      alarmaTimeout = setTimeout(() => {
        try {
          alarmaPlayer?.pause();
        } catch {
          /* ignorar */
        }
        alarmaTimeout = null;
      }, 5000);
    } catch (error: any) {
      // Reintento si perdimos foco de audio (Android)
      if (error?.message?.includes("AudioFocusNotAcquiredException")) {
        try {
          await this.configureAudio(true);
          await new Promise((resolve) => setTimeout(resolve, 200));
          alarmaPlayer.seekTo(0);
          alarmaPlayer.play();
          return;
        } catch {
          /* cae al fallback */
        }
      }

      console.error("Error reproduciendo alarma:", error);
      Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
    }
  }

  /**
   * Reproduce el tono de confirmación.
   * Si no está precargado, lo precarga en ese momento.
   * Si falla el audio, cae a vibración como fallback.
   */
  async playConfirmacion(): Promise<void> {
    if (!confirmacionPlayer) {
      await this.preloadConfirmacion();
    }

    if (!confirmacionPlayer) {
      Vibration.vibrate([100, 100, 100, 100, 100]);
      return;
    }

    try {
      // Mismo caso: seekTo(0) antes de play() para reproducir desde el inicio
      confirmacionPlayer.seekTo(0);
      confirmacionPlayer.play();
    } catch (error) {
      console.error("Error reproduciendo confirmación:", error);
      Vibration.vibrate([100, 100, 100, 100, 100]);
    }
  }

  // LIMPIEZA

  /**
   * Detiene todos los sonidos y vibraciones activos.
   * No libera los recursos de audio (para eso está `unloadAll`).
   */
  async stopAll(): Promise<void> {
    try {
      if (alarmaTimeout) {
        clearTimeout(alarmaTimeout);
        alarmaTimeout = null;
      }

      if (alarmaPlayer) {
        try {
          alarmaPlayer.pause();
        } catch {
          /* ignorar */
        }
      }

      Vibration.cancel();
    } catch (error) {
      console.error("Error deteniendo sonidos:", error);
    }
  }

  /**
   * Libera todos los recursos de audio.
   * Llamar al desmontar la app o al cerrar sesión.
   */
  async unloadAll(): Promise<void> {
    try {
      await this.stopAll();

      if (alarmaPlayer) {
        try {
          alarmaPlayer.remove();
        } catch {
          /* ignorar */
        }
        alarmaPlayer = null;
      }

      if (confirmacionPlayer) {
        try {
          confirmacionPlayer.remove();
        } catch {
          /* ignorar */
        }
        confirmacionPlayer = null;
      }
    } catch (error) {
      console.error("Error liberando sonidos:", error);
    }
  }
}

// INSTANCIA ÚNICA (Singleton)
const soundService = new SoundServiceClass();

export default soundService;
export const SoundService = soundService;
