import { Audio } from 'expo-av';

let soundObject: Audio.Sound | null = null;

export const SoundService = {
  playAlarma: async () => {
    try {
      if (soundObject) {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/tono.mp3'), 
        { 
          shouldPlay: true,
          volume: 1.0,
          isLooping: false,
        }
      );
      
      soundObject = sound;
      await sound.playAsync();

      // Detener después de 3 segundos
      setTimeout(async () => {
        if (soundObject) {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
          soundObject = null;
        }
      }, 3000);

    } catch (error) {
      console.error('Error reproduciendo alarma:', error);
    }
  },

  playConfirmacion: async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/tono_confirmacion.mp3'), // ← Cambia a .wav
        { shouldPlay: true, volume: 0.5 }
      );
      
      await sound.playAsync();
      
      setTimeout(async () => {
        await sound.unloadAsync();
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
    }
  },

  stopAll: async () => {
    if (soundObject) {
      try {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
};