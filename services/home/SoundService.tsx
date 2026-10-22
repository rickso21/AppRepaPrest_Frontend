import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Vibration } from "react-native";

// VARIABLES GLOBALES
let alarmaPlayer: AudioPlayer | null = null;
let confirmacionPlayer: AudioPlayer | null = null;
let bienvenidaPlayer: AudioPlayer | null = null;
let alarmaTimeout: ReturnType<typeof setTimeout> | null = null;

// SERVICIO DE SONIDO
class SoundServiceClass {
  private audioConfigured = false;
  private preloadingAlarma = false;
  private preloadingConfirmacion = false;
  private preloadingBienvenida = false;

  // CONFIGURACIÓN DE AUDIO

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

  async preloadAlarma(): Promise<void> {
    if (alarmaPlayer || this.preloadingAlarma) return;

    this.preloadingAlarma = true;
    try {
      await this.configureAudio();

      alarmaPlayer = createAudioPlayer(
        require("../../assets/sounds/8footdino_on_scratch-alarm-301729.mp3"),
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

  async preloadConfirmacion(): Promise<void> {
    if (confirmacionPlayer || this.preloadingConfirmacion) return;

    this.preloadingConfirmacion = true;
    try {
      await this.configureAudio();

      confirmacionPlayer = createAudioPlayer(
        require("../../assets/sounds/tono_confirmacion.mp3"),
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

  // ✅ NUEVO: precarga del sonido de bienvenida
  async preloadBienvenida(): Promise<void> {
    if (bienvenidaPlayer || this.preloadingBienvenida) return;

    this.preloadingBienvenida = true;
    try {
      await this.configureAudio();

      bienvenidaPlayer = createAudioPlayer(
        require("../../assets/sounds/universfield-new-notification-037-485898.mp3"),
      );
      bienvenidaPlayer.volume = 0.6;
      bienvenidaPlayer.loop = false;
    } catch (error) {
      console.warn("No se pudo pre-cargar bienvenida:", error);
      bienvenidaPlayer = null;
    } finally {
      this.preloadingBienvenida = false;
    }
  }

  // REPRODUCCIÓN

  async playAlarma(): Promise<void> {
    if (!alarmaPlayer) {
      await this.preloadAlarma();
    }

    if (!alarmaPlayer) {
      Vibration.vibrate([500, 200, 500, 200, 500, 200, 1000]);
      return;
    }

    try {
      if (alarmaTimeout) {
        clearTimeout(alarmaTimeout);
        alarmaTimeout = null;
      }

      alarmaPlayer.seekTo(0);
      alarmaPlayer.play();

      alarmaTimeout = setTimeout(() => {
        try {
          alarmaPlayer?.pause();
        } catch {
          /* ignorar */
        }
        alarmaTimeout = null;
      }, 5000);
    } catch (error: any) {
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

  async playConfirmacion(): Promise<void> {
    if (!confirmacionPlayer) {
      await this.preloadConfirmacion();
    }

    if (!confirmacionPlayer) {
      Vibration.vibrate([100, 100, 100, 100, 100]);
      return;
    }

    try {
      confirmacionPlayer.seekTo(0);
      confirmacionPlayer.play();
    } catch (error) {
      console.error("Error reproduciendo confirmación:", error);
      Vibration.vibrate([100, 100, 100, 100, 100]);
    }
  }

  // ✅ NUEVO: reproducir sonido de bienvenida
  async playBienvenida(): Promise<void> {
    if (!bienvenidaPlayer) {
      await this.preloadBienvenida();
    }

    if (!bienvenidaPlayer) {
      // Fallback: no molestar con vibración al iniciar sesión
      // (sería raro vibrar al hacer login, así que solo log)
      console.log("[SoundService] Bienvenida no disponible (sin audio)");
      return;
    }

    try {
      bienvenidaPlayer.seekTo(0);
      bienvenidaPlayer.play();
    } catch (error) {
      console.error("Error reproduciendo bienvenida:", error);
    }
  }

  // LIMPIEZA

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

      // ✅ NUEVO: liberar también bienvenida
      if (bienvenidaPlayer) {
        try {
          bienvenidaPlayer.remove();
        } catch {
          /* ignorar */
        }
        bienvenidaPlayer = null;
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
