import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// 👈 Importamos SafeAreaView y el hook useSafeAreaInsets
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Mensaje {
  id: string;
  texto: string;
  remitente: 'usuario' | 'otro';
  hora: string;
}

export default function ChatScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // 👈 Captura los espacios exactos de la pantalla (notch y botones)
  
  const [mensajeTexto, setMensajeTexto] = useState('');

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: '1', texto: '¡Hola a todos! ¿Cómo está el tráfico por el centro?', remitente: 'otro', hora: '10:30 AM' },
    { id: '2', texto: 'Todo tranquilo por acá, solo un poco fluido por la avenida principal.', remitente: 'usuario', hora: '10:31 AM' },
  ]);

  const handleEnviarMensaje = () => {
    if (!mensajeTexto.trim()) return;

    const nuevoMensaje: Mensaje = {
      id: Date.now().toString(),
      texto: mensajeTexto.trim(),
      remitente: 'usuario',
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMensajes((prev) => [...prev, nuevoMensaje]);
    setMensajeTexto('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <Pressable 
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FF6B35" />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Sala de Chat</Text>
          <Text style={styles.headerStatus}>● En línea</Text>
        </View>
      </View>

      {/* CONTENEDOR TECLADO */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={mensajes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const esUsuario = item.remitente === 'usuario';
            return (
              <View
                style={[
                  styles.messageBubble,
                  esUsuario ? styles.usuarioBubble : styles.otroBubble,
                ]}
              >
                <Text style={styles.messageText}>{item.texto}</Text>
                <Text style={styles.messageTime}>{item.hora}</Text>
              </View>
            );
          }}
        />

        {/* BARRA DE MENSAJE DINÁMICA */}
        <View style={[
          styles.inputContainer,
          { paddingBottom: Math.max(insets.bottom, 12) } 
        ]}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={mensajeTexto}
            onChangeText={setMensajeTexto}
            multiline
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              !mensajeTexto.trim() && styles.sendButtonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleEnviarMensaje}
            disabled={!mensajeTexto.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#16161F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  usuarioBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 2,
  },
  otroBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1C28',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#16161F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1C1C28',
    color: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A45',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});