import React, { JSX, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

// Carpeta propia dentro del almacenamiento permanente de la app
const CARPETA_PERFIL = `${FileSystem.documentDirectory}perfil/`;
const CLAVE_STORAGE = 'perfil_data';

type Props = StackScreenProps<RootStackParamList, 'Perfil'>;

export default function PerfilScreen({ navigation, route }: Props): JSX.Element {
  const { userName } = route.params ?? {};

  const [portada, setPortada] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  const [nombre, setNombre] = useState<string>(userName ?? '');
  const [correo, setCorreo] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);

  // Al abrir la pantalla, recupera lo que se guardó la última vez
  useEffect(() => {
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_STORAGE);
        if (guardado) {
          const datos = JSON.parse(guardado);
          if (datos.portada) setPortada(datos.portada);
          if (datos.avatar) setAvatar(datos.avatar);
          if (datos.nombre) setNombre(datos.nombre);
          if (datos.correo) setCorreo(datos.correo);
          if (datos.telefono) setTelefono(datos.telefono);
          if (datos.ciudad) setCiudad(datos.ciudad);
        }
      } catch (e) {
        // si no hay nada guardado o falla la lectura, se queda con los valores por defecto
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const initials = (nombre || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Pide permiso a la galería, abre el selector, y COPIA la imagen elegida
  // a una carpeta permanente (la de caché del picker se puede borrar sola).
  const elegirImagen = async (tipo: 'portada' | 'avatar') => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para cambiar la imagen');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: tipo === 'portada' ? [16, 7] : [1, 1],
      quality: 0.8,
    });

    if (resultado.canceled || !resultado.assets?.[0]?.uri) return;

    try {
      // Asegura que la carpeta "perfil/" exista dentro del almacenamiento de la app
      await FileSystem.makeDirectoryAsync(CARPETA_PERFIL, { intermediates: true }).catch(() => {});

      const destino = `${CARPETA_PERFIL}${tipo}.jpg`;

      // Si ya había una foto anterior de este tipo, se borra antes de copiar la nueva
      await FileSystem.deleteAsync(destino, { idempotent: true });
      await FileSystem.copyAsync({ from: resultado.assets[0].uri, to: destino });

      // Se le agrega un "?t=" con la hora para que la imagen se refresque en pantalla
      // (si no, a veces se queda viendo la versión vieja por la caché de <Image>)
      const uriConVersion = `${destino}?t=${Date.now()}`;

      if (tipo === 'portada') setPortada(uriConVersion);
      else setAvatar(uriConVersion);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la imagen');
    }
  };

  const handleGuardar = async (): Promise<void> => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    setGuardando(true);

    try {
      // Guarda el formulario y las rutas de las imágenes en el dispositivo.
      // Quitamos el "?t=..." antes de guardar, para que la próxima vez que
      // se lea el archivo se le ponga una marca de tiempo fresca.
      await AsyncStorage.setItem(
        CLAVE_STORAGE,
        JSON.stringify({
          nombre,
          correo,
          telefono,
          ciudad,
          portada: portada ? portada.split('?')[0] : null,
          avatar: avatar ? avatar.split('?')[0] : null,
        })
      );

      // Simulación - Aquí iría además la llamada real al backend
      setTimeout(() => {
        setGuardando(false);
        Alert.alert('Listo', 'Tu información se actualizó correctamente');
      }, 800);
    } catch (e: any) {
      console.error('Error guardando perfil:', e);
      setGuardando(false);
      Alert.alert('Error', `No se pudo guardar tu información: ${e?.message ?? String(e)}`);
    }
  };

  const renderInput = (
    key: string,
    icon: string,
    placeholder: string,
    value: string,
    onChange: (t: string) => void,
    keyboardType?: 'default' | 'email-address' | 'phone-pad'
  ) => {
    const isFocused = focusedField === key;
    return (
      <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
        <Ionicons
          name={icon as any}
          size={19}
          color={isFocused ? '#FF6B35' : 'rgba(255,255,255,0.5)'}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Foto de portada, estilo Facebook */}
        <Pressable style={styles.coverWrap} onPress={() => elegirImagen('portada')}>
          {portada ? (
            <Image source={{ uri: portada }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <View style={styles.coverEditBadge}>
            <Ionicons name="camera" size={15} color="#fff" />
            <Text style={styles.coverEditText}>Cambiar portada</Text>
          </View>
        </Pressable>

        {/* Botón volver, flotando sobre la portada */}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        {/* Avatar superpuesto sobre el borde de la portada */}
        <View style={styles.avatarWrap}>
          <Pressable style={styles.avatarCircle} onPress={() => elegirImagen('avatar')}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </Pressable>
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={13} color="#fff" />
          </View>
        </View>

        <Text style={styles.screenTitle}>Mi cuenta</Text>

        {/* Formulario */}
        <View style={styles.form}>
          {renderInput('nombre', 'person-outline', 'Nombre completo', nombre, setNombre)}
          {renderInput('correo', 'mail-outline', 'Correo electrónico', correo, setCorreo, 'email-address')}
          {renderInput('telefono', 'call-outline', 'Teléfono', telefono, setTelefono, 'phone-pad')}
          {renderInput('ciudad', 'location-outline', 'Ciudad / Ubicación', ciudad, setCiudad)}

          <Pressable
            style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
            onPress={handleGuardar}
            disabled={guardando}
          >
            <Text style={styles.saveButtonText}>
              {guardando ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 92;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F17' },
  coverWrap: {
    width: '100%',
    height: 170,
    backgroundColor: '#1C1C28',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C28',
  },
  coverEditBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,15,23,0.75)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  coverEditText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15,15,23,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    marginTop: -AVATAR_SIZE / 2,
    marginLeft: 22,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#FF6B35',
    borderWidth: 4,
    borderColor: '#0F0F17',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { color: '#fff', fontSize: 28, fontWeight: '800' },
  avatarEditBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#0F0F17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    marginLeft: 22,
  },
  form: { paddingHorizontal: 22, marginTop: 22, paddingBottom: 40 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  },
  inputFocused: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.08)' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14.5, color: '#fff' },
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
});