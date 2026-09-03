import React, { JSX } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../Home/Home';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
type NavigationProp = StackNavigationProp<RootStackParamList>;

type Props = BottomTabScreenProps<HomeTabParamList, 'Comunidad'>;

export default function ComunidadScreen(_props: Props): JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  
  // Estas funciones manejarán lo que pasa cuando el usuario toca un botón.
  // Por ahora, como no hemos creado las pantallas de destino, mostramos un Alert.
  const handlePressRedSocial = () => {
    Alert.alert("Navegación", "Próximamente abriremos la pantalla de Red Social");
  };

  const handlePressChat = () => {
    navigation.navigate('ChatScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Encabezado superior */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comunidad</Text>
        <Text style={styles.headerSubtitle}>Conecta con otros compañeros de ruta</Text>
      </View>

      <View style={styles.content}>
        
        {/* BOTÓN 1: RED SOCIAL */}
        {/* Usamos Pressable. El style recibe un callback 'pressed' para saber si el usuario lo está tocando */}
        <Pressable 
          style={({ pressed }) => [
            styles.cardButton,
            pressed && styles.cardButtonPressed // Si está presionado, aplica el estilo extra
          ]}
          onPress={handlePressRedSocial}
        >
          {/* Contenedor del ícono */}
          <View style={styles.iconContainer}>
            <Ionicons name="earth-outline" size={32} color="#FF6B35" />
          </View>
          
          {/* Contenedor de Textos */}
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Red Social</Text>
            <Text style={styles.cardSubtitle}>Publicaciones, noticias y actualizaciones</Text>
          </View>
          
          {/* Flecha indicadora */}
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.3)" />
        </Pressable>

        {/* BOTÓN 2: CHAT */}
        <Pressable 
          style={({ pressed }) => [
            styles.cardButton,
            pressed && styles.cardButtonPressed
          ]}
          onPress={handlePressChat}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubbles-outline" size={32} color="#FF6B35" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Salas de Chat</Text>
            <Text style={styles.cardSubtitle}>Conversa en tiempo real con otros usuarios</Text>
          </View>
          
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.3)" />
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

// ========== ESTILOS ==========
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F0F17' 
  },
  // Estilos del encabezado
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#fff', 
    marginBottom: 8 
  },
  headerSubtitle: { 
    fontSize: 15, 
    color: 'rgba(255,255,255,0.6)', 
  },
  // Contenedor principal de los botones
  content: { 
    flex: 1, 
    paddingHorizontal: 20,
    gap: 16, // Separa los botones entre sí por 16px (requiere React Native moderno)
  },
  
  // === ESTILOS DE LA TARJETA (BOTÓN) ===
  cardButton: {
    flexDirection: 'row',       // Alinea los elementos en fila (Izquierda a Derecha)
    alignItems: 'center',       // Centra verticalmente
    backgroundColor: '#1C1C28', // Un tono más claro que el fondo para que resalte
    padding: 20,
    borderRadius: 16,           // Esquinas redondeadas
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', // Borde sutil
  },
  // Efecto cuando el usuario toca el botón
  cardButtonPressed: {
    backgroundColor: '#252533', 
    transform: [{ scale: 0.98 }], // Se hace un 2% más pequeño al presionarlo (da sensación táctil)
  },
  
  // === INTERIOR DE LA TARJETA ===
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.1)', // Fondo naranjita semitransparente
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16, // Espacio entre el ícono y los textos
  },
  textContainer: {
    flex: 1, // Toma todo el espacio disponible empujando la flecha a la derecha
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
});