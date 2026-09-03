import { 
    RTCPeerConnection, 
    RTCSessionDescription, 
    RTCIceCandidate,
    mediaDevices,
    RTCView,
    MediaStream
} from 'react-native-webrtc';
import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform, PermissionsAndroid } from 'react-native';

// Configuración ICE para producción usar tu propio servidor TURN
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Servidores TURN gratis para desarrollo
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 10
};

export interface VoiceSignal {
    id: number;
    from_user_id: number;
    type: 'offer' | 'answer' | 'ice-candidate' | 'incoming_call' | 'call_ended';
    payload: any;
}

export class VoiceService {
    private static instance: VoiceService;
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private userId: number | null = null;
    private isInitiator: boolean = false;
    private remoteUserId: number | null = null;
    private isCallActive: boolean = false;
    private pollingInterval: NodeJS.Timeout | null = null;
    private token: string | null = null;
    
    // Callbacks
    private onIncomingCallCallback: ((fromUserId: number, userName: string) => void) | null = null;
    private onCallConnectedCallback: (() => void) | null = null;
    private onCallEndedCallback: (() => void) | null = null;
    private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;

    private constructor() {}

    static getInstance(): VoiceService {
        if (!VoiceService.instance) {
            VoiceService.instance = new VoiceService();
        }
        return VoiceService.instance;
    }

    // ========== INICIALIZACIÓN ==========
    
    async initialize(userId: number, token: string) {
        this.userId = userId;
        this.token = token;
        await this.requestPermissions();
        this.startPolling();
    }

    private async requestPermissions() {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                ]);
                
                if (granted['android.permission.RECORD_AUDIO'] !== 'granted') {
                    this.onErrorCallback?.('Permiso de micrófono denegado');
                }
            } catch (err) {
                console.warn(err);
            }
        }
    }

    // ========== POLLING DE SEÑALES ==========

    private startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // Polling cada 3 segundos (igual que tus repartidores)
        this.pollingInterval = setInterval(async () => {
            await this.fetchSignals();
        }, 3000);

        // Fetch inicial
        this.fetchSignals();
    }

    private async fetchSignals() {
        try {
            if (!this.token) return;

            const response = await api.get('/voice/signals', {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response.data.res && response.data.data) {
                const signals: VoiceSignal[] = response.data.data;
                signals.forEach(signal => {
                    this.handleSignal(signal);
                });
            }
        } catch (error) {
            // Silenciar errores para no saturar
            // console.error('Error fetching signals:', error);
        }
    }

    // ========== MANEJO DE SEÑALES ==========

    private handleSignal(signal: VoiceSignal) {
        console.log(`📨 Signal recibida: ${signal.type} desde ${signal.from_user_id}`);

        switch (signal.type) {
            case 'incoming_call':
                this.handleIncomingCall(signal);
                break;
            case 'offer':
                this.handleOffer(signal);
                break;
            case 'answer':
                this.handleAnswer(signal);
                break;
            case 'ice-candidate':
                this.handleIceCandidate(signal);
                break;
            case 'call_ended':
                this.handleCallEnded(signal);
                break;
        }
    }

    // ========== GESTIÓN DE LLAMADAS ==========

    // Iniciar llamada a otro usuario
    async startCall(targetUserId: number): Promise<boolean> {
        try {
            if (this.isCallActive) {
                this.onErrorCallback?.('Ya hay una llamada en curso');
                return false;
            }

            // Verificar que el usuario está disponible
            const usersResponse = await api.get('/voice/users', {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            const available = usersResponse.data.data?.find((u: any) => u.id === targetUserId);
            if (!available) {
                this.onErrorCallback?.('Usuario no disponible');
                return false;
            }

            this.isInitiator = true;
            this.remoteUserId = targetUserId;
            this.isCallActive = true;

            // Crear conexión y enviar oferta
            await this.createPeerConnection();
            await this.setupLocalStream();
            
            const offer = await this.peerConnection!.createOffer();
            await this.peerConnection!.setLocalDescription(offer);

            // Enviar oferta a través del backend
            await this.sendSignal(targetUserId, 'offer', offer);

            // Enviar señal de llamada entrante
            await this.sendSignal(targetUserId, 'incoming_call', {
                from: this.userId,
                timestamp: Date.now()
            });

            return true;
        } catch (error) {
            console.error('Error iniciando llamada:', error);
            this.cleanup();
            this.onErrorCallback?.('Error al iniciar llamada');
            return false;
        }
    }

    // Aceptar llamada entrante
    async acceptCall(fromUserId: number): Promise<boolean> {
        try {
            this.remoteUserId = fromUserId;
            this.isInitiator = false;
            this.isCallActive = true;

            await this.createPeerConnection();
            await this.setupLocalStream();

            return true;
        } catch (error) {
            console.error('Error aceptando llamada:', error);
            this.onErrorCallback?.('Error al aceptar llamada');
            return false;
        }
    }

    // Rechazar llamada
    async rejectCall(fromUserId: number): Promise<boolean> {
        try {
            await this.sendSignal(fromUserId, 'call_ended', {
                reason: 'rejected'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // Finalizar llamada
    async endCall(): Promise<boolean> {
        try {
            if (this.remoteUserId) {
                await this.sendSignal(this.remoteUserId, 'call_ended', {
                    reason: 'ended'
                });

                await api.post('/voice/end-call', {
                    to_user_id: this.remoteUserId
                }, {
                    headers: { Authorization: `Bearer ${this.token}` }
                });
            }

            this.cleanup();
            this.onCallEndedCallback?.();
            return true;
        } catch (error) {
            console.error('Error finalizando llamada:', error);
            this.cleanup();
            return false;
        }
    }

    // ========== WEBRTC ==========

    private async createPeerConnection() {
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

        // Escuchar candidatos ICE
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.remoteUserId) {
                this.sendSignal(this.remoteUserId, 'ice-candidate', event.candidate);
            }
        };

        // Escuchar pistas remotas (audio)
        this.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams.length > 0) {
                this.remoteStream = event.streams[0];
                this.onRemoteStreamCallback?.(this.remoteStream);
                this.onCallConnectedCallback?.();
            }
        };

        // Escuchar cambios en el estado de conexión
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            if (state === 'connected') {
                console.log('🔊 Conexión WebRTC establecida');
                this.onCallConnectedCallback?.();
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                console.log('🔊 Conexión WebRTC perdida');
                this.endCall();
            }
        };

        return this.peerConnection;
    }

    private async setupLocalStream() {
        try {
            this.localStream = await mediaDevices.getUserMedia({
                audio: true,
                video: false, // Solo audio
            });

            if (this.peerConnection && this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection!.addTrack(track, this.localStream!);
                });
            }
        } catch (error) {
            console.error('Error obteniendo audio:', error);
            throw error;
        }
    }

    // ========== ENVÍO DE SEÑALES ==========

    private async sendSignal(toUserId: number, type: string, payload: any) {
        try {
            await api.post('/voice/signal', {
                to_user_id: toUserId,
                type: type,
                payload: payload
            }, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
        } catch (error) {
            console.error(`Error enviando señal ${type}:`, error);
        }
    }

    // ========== MANEJO DE SEÑALES RECIBIDAS ==========

    private async handleIncomingCall(signal: VoiceSignal) {
        if (this.isCallActive) {
            // Si ya estamos en llamada, rechazar automáticamente
            await this.sendSignal(signal.from_user_id, 'call_ended', {
                reason: 'busy'
            });
            return;
        }

        // Obtener nombre del usuario (deberías tenerlo en el payload o cache)
        const userName = signal.payload?.name || 'Usuario';
        this.onIncomingCallCallback?.(signal.from_user_id, userName);
    }

    private async handleOffer(signal: VoiceSignal) {
        if (!this.peerConnection) {
            await this.createPeerConnection();
            await this.setupLocalStream();
        }

        try {
            const offer = new RTCSessionDescription(signal.payload);
            await this.peerConnection!.setRemoteDescription(offer);
            
            const answer = await this.peerConnection!.createAnswer();
            await this.peerConnection!.setLocalDescription(answer);
            
            await this.sendSignal(signal.from_user_id, 'answer', answer);
        } catch (error) {
            console.error('Error manejando offer:', error);
        }
    }

    private async handleAnswer(signal: VoiceSignal) {
        try {
            const answer = new RTCSessionDescription(signal.payload);
            await this.peerConnection!.setRemoteDescription(answer);
        } catch (error) {
            console.error('Error manejando answer:', error);
        }
    }

    private async handleIceCandidate(signal: VoiceSignal) {
        try {
            if (this.peerConnection) {
                const candidate = new RTCIceCandidate(signal.payload);
                await this.peerConnection.addIceCandidate(candidate);
            }
        } catch (error) {
            console.error('Error manejando ICE candidate:', error);
        }
    }

    private handleCallEnded(signal: VoiceSignal) {
        this.cleanup();
        this.onCallEndedCallback?.();
    }

    // ========== LIMPIEZA ==========

    private cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.remoteStream = null;
        this.isCallActive = false;
        this.isInitiator = false;
        this.remoteUserId = null;
    }

    // ========== CALLBACKS ==========

    setOnIncomingCall(callback: (fromUserId: number, userName: string) => void) {
        this.onIncomingCallCallback = callback;
    }

    setOnCallConnected(callback: () => void) {
        this.onCallConnectedCallback = callback;
    }

    setOnCallEnded(callback: () => void) {
        this.onCallEndedCallback = callback;
    }

    setOnRemoteStream(callback: (stream: MediaStream) => void) {
        this.onRemoteStreamCallback = callback;
    }

    setOnError(callback: (error: string) => void) {
        this.onErrorCallback = callback;
    }

    // ========== GETTERS ==========

    isCallActiveCheck(): boolean {
        return this.isCallActive;
    }

    getRemoteUserId(): number | null {
        return this.remoteUserId;
    }

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    // ========== DESTRUCCIÓN ==========

    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.cleanup();
    }
}