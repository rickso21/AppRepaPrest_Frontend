import { Audio } from 'expo-av';

let soundObject: Audio.Sound | null = null;
let alarmTimeout: NodeJS.Timeout | null = null;

export const SoundService = {
  // 🔥 Configurar audio al inicio
  configureAudio: async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,  // 🔥 Sonar en modo silencio
        shouldDuckAndroid: false,    // 🔥 No bajar volumen de otras apps
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.warn('⚠️ Error configurando audio:', error);
    }
  },

  playAlarma: async () => {
    try {
      // 🔥 Configurar audio ANTES de cargar el sonido
      await SoundService.configureAudio();

      // Detener sonido anterior
      if (soundObject) {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
      }

      // Limpiar timeout anterior
      if (alarmTimeout) {
        clearTimeout(alarmTimeout);
        alarmTimeout = null;
      }

      // 🔥 Cargar sonido con configuración correcta
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/8footdino_on_scratch-alarm-301729.mp3'),
        { 
          shouldPlay: false,  // 🔥 No reproducir automáticamente
          volume: 1.0,
          isLooping: false,
        }
      );
      
      soundObject = sound;

      // 🔥 Intentar reproducir con manejo de errores
      try {
        await sound.playAsync();
      } catch (playError: any) {
        // 🔥 Si falla el foco de audio, reintentar
        if (playError.message?.includes('AudioFocusNotAcquiredException')) {
          console.warn('⚠️ Foco de audio no adquirido, reintentando...');
          await SoundService.configureAudio();
          await new Promise(resolve => setTimeout(resolve, 300));
          await sound.playAsync();
        } else {
          throw playError;
        }
      }

      // 🔥 Detener después de 5 segundos (más tiempo para alerta)
      alarmTimeout = setTimeout(async () => {
        if (soundObject) {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
          soundObject = null;
          alarmTimeout = null;
        }
      }, 5000);

    } catch (error) {
      console.error('❌ Error reproduciendo alarma:', error);
      // 🔥 No propagar el error para no interrumpir la vibración
    }
  },

  playConfirmacion: async () => {
    try {
      // 🔥 Configurar audio
      await SoundService.configureAudio();

      // Detener sonido anterior si existe
      if (soundObject) {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/tono_confirmacion.mp3'),
        { 
          shouldPlay: false,
          volume: 0.7 
        }
      );
      
      // 🔥 Intentar reproducir
      await sound.playAsync();
      
      // 🔥 Liberar después de reproducir
      setTimeout(async () => {
        await sound.unloadAsync();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error reproduciendo confirmación:', error);
    }
  },

  stopAll: async () => {
    try {
      if (alarmTimeout) {
        clearTimeout(alarmTimeout);
        alarmTimeout = null;
      }

      if (soundObject) {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
      }
    } catch (error) {
      console.error('❌ Error deteniendo sonido:', error);
    }
  }
};