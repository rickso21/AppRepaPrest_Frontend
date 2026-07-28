// services/WebRTCService.tsx
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { Audio } from 'expo-av';
import api from './api';

// Interfaces para los callbacks
export interface WebRTCCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: string) => void;
  onError?: (error: string) => void;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isConnected: boolean = false;
  private roomId: string | null = null;
  private userId: number | null = null;
  private isMuted: boolean = false;

  // Callbacks
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateCallback: ((state: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.configureAudio();
  }

  // ============================================
  // CONFIGURACIÓN DE AUDIO
  // ============================================
  private async configureAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('✅ Audio configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando audio:', error);
    }
  }

  // ============================================
  // CONFIGURACIÓN ICE (STUN/TURN)
  // ============================================
  private getConfiguration(): RTCConfiguration {
    return {
      iceServers: [
        {
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
          ],
        },
        {
          urls: [
            'turn:turn.anyfirewall.com:443?transport=tcp',
            'turn:turn.anyfirewall.com:443?transport=udp',
          ],
          username: 'webrtc',
          credential: 'webrtc',
        },
      ],
      iceCandidatePoolSize: 10,
    };
  }

  // ============================================
  // INICIALIZAR WebRTC
  // ============================================
  async initialize(userId: number): Promise<boolean> {
    this.userId = userId;

    try {
      // Solicitar permisos de micrófono
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('❌ Permiso de micrófono denegado');
        if (this.onErrorCallback) {
          this.onErrorCallback('Permiso de micrófono denegado');
        }
        return false;
      }

      // Obtener stream de audio
      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      this.localStream = stream;

      // Notificar stream local
      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(stream);
      }

      console.log('✅ WebRTC inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando WebRTC:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Error al inicializar WebRTC');
      }
      return false;
    }
  }

  // ============================================
  // UNIRSE A UNA SALA
  // ============================================
  async joinRoom(roomId: string): Promise<boolean> {
    this.roomId = roomId;

    try {
      // Crear peer connection
      this.peerConnection = new RTCPeerConnection(this.getConfiguration());

      // Agregar tracks locales
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.peerConnection) {
            this.peerConnection.addTrack(track, this.localStream!);
          }
        });
        console.log('🎤 Tracks de audio agregados');
      }

      // Manejar streams remotos
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
        console.log('📡 Stream remoto recibido');
      };

      // Manejar cambios de estado de conexión
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState || 'disconnected';
        console.log('🔄 Estado ICE:', state);

        if (this.onConnectionStateCallback) {
          this.onConnectionStateCallback(state);
        }

        if (state === 'connected') {
          this.isConnected = true;
          console.log(`✅ Conectado a sala: ${roomId}`);
        } else if (state === 'disconnected' || state === 'failed') {
          this.isConnected = false;
          console.log('🔴 Desconectado de sala');
        }
      };

      // Manejar candidatos ICE
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate && this.userId) {
          await this.sendCandidate(event.candidate);
        }
      };

      // Crear oferta
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      await this.sendOffer(offer);

      console.log(`📤 Oferta enviada a sala: ${roomId}`);
      return true;
    } catch (error) {
      console.error('❌ Error uniéndose a sala:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Error al unirse a la sala');
      }
      return false;
    }
  }

  // ============================================
  // ENVIAR OFERTA
  // ============================================
  private async sendOffer(offer: RTCSessionDescription): Promise<void> {
    try {
      await api.post('/webrtc/offer', {
        roomId: this.roomId,
        userId: this.userId,
        sdp: offer.sdp,
        type: offer.type,
      });
      console.log('📤 Oferta enviada al servidor');
    } catch (error) {
      console.error('Error enviando oferta:', error);
    }
  }

  // ============================================
  // ENVIAR RESPUESTA (ANSWER)
  // ============================================
  private async sendAnswer(answer: RTCSessionDescription): Promise<void> {
    try {
      await api.post('/webrtc/answer', {
        roomId: this.roomId,
        userId: this.userId,
        sdp: answer.sdp,
        type: answer.type,
      });
      console.log('📥 Respuesta enviada al servidor');
    } catch (error) {
      console.error('Error enviando respuesta:', error);
    }
  }

  // ============================================
  // ENVIAR CANDIDATO ICE
  // ============================================
  private async sendCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      await api.post('/webrtc/candidate', {
        roomId: this.roomId,
        userId: this.userId,
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid,
      });
    } catch (error) {
      console.error('Error enviando candidato:', error);
    }
  }

  // ============================================
  // MANEJAR OFERTA RECIBIDA
  // ============================================
  async handleOffer(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const offer = new RTCSessionDescription({
        type: 'offer',
        sdp: data.sdp,
      });

      await this.peerConnection.setRemoteDescription(offer);

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await this.sendAnswer(answer);

      console.log('📥 Oferta procesada y respuesta enviada');
    } catch (error) {
      console.error('Error manejando oferta:', error);
    }
  }

  // ============================================
  // MANEJAR RESPUESTA RECIBIDA
  // ============================================
  async handleAnswer(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: data.sdp,
      });

      await this.peerConnection.setRemoteDescription(answer);
      console.log('📥 Respuesta procesada');
    } catch (error) {
      console.error('Error manejando respuesta:', error);
    }
  }

  // ============================================
  // MANEJAR CANDIDATO ICE RECIBIDO
  // ============================================
  async handleCandidate(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const candidate = new RTCIceCandidate({
        candidate: data.candidate,
        sdpMLineIndex: data.sdpMLineIndex,
        sdpMid: data.sdpMid,
      });

      await this.peerConnection.addIceCandidate(candidate);
      console.log('🧊 Candidato ICE agregado');
    } catch (error) {
      console.error('Error agregando candidato:', error);
    }
  }

  // ============================================
  // TOGGLE MUTE (ACTIVAR/DESACTIVAR MICRÓFONO)
  // ============================================
  toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      this.isMuted = !this.isMuted;
      audioTrack.enabled = !this.isMuted;
      console.log(`🎤 Micrófono ${this.isMuted ? 'desactivado' : 'activado'}`);
      return !this.isMuted;
    }
    return false;
  }

  // ============================================
  // SALIR DE LA SALA
  // ============================================
  async leaveRoom(): Promise<void> {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.isConnected = false;
    this.roomId = null;

    console.log('🚪 Saliendo de sala');
  }

  // ============================================
  // SETTERS PARA CALLBACKS
  // ============================================
  setOnRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  setOnLocalStream(callback: (stream: MediaStream) => void): void {
    this.onLocalStreamCallback = callback;
  }

  setOnConnectionState(callback: (state: string) => void): void {
    this.onConnectionStateCallback = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // ============================================
  // GETTERS
  // ============================================
  isMutedState(): boolean {
    return this.isMuted;
  }

  isConnectedState(): boolean {
    return this.isConnected;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // ============================================
  // DESTRUIR
  // ============================================
  destroy(): void {
    this.leaveRoom();
    this.onRemoteStreamCallback = null;
    this.onLocalStreamCallback = null;
    this.onConnectionStateCallback = null;
    this.onErrorCallback = null;
  }
}

// Exportar instancia única (Singleton)
export default new WebRTCService();