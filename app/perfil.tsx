import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { JSX, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AvatarPicker from "../components/perfil/AvatarPicker";
import ChangePasswordModal from "../components/perfil/ChangePasswordModal";
import CoverPhoto from "../components/perfil/CoverPhoto";
import ProfileField from "../components/perfil/ProfileField";
import SaveButton from "../components/perfil/SaveButton";
import { usePerfil } from "../hooks/perfil/usePerfil";

const BRAND = "#FF6B35";

export default function PerfilScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ userName?: string }>();
  const userName = typeof params.userName === "string" ? params.userName : "";

  const perfil = usePerfil({ userNameInicial: userName });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false); // 👈 NUEVO

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync("userData");
    })();
  }, []);

  const focusProps = (key: string) => ({
    focused: focusedField === key,
    onFocus: () => setFocusedField(key),
    onBlur: () => setFocusedField(null),
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <CoverPhoto
          uri={perfil.portada}
          onPress={() => perfil.elegirImagen("portada")}
        />

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <AvatarPicker
          uri={perfil.avatar}
          initials={perfil.initials}
          onPress={() => perfil.elegirImagen("avatar")}
        />

        <Text style={styles.title}>Mi cuenta</Text>

        <View style={styles.form}>
          <ProfileField
            icon="person-outline"
            placeholder="Nombre completo"
            value={perfil.nombre}
            editable={false}
          />

          <ProfileField
            icon="mail-outline"
            placeholder="Correo electrónico"
            value={perfil.correo}
            onChangeText={perfil.setCorreo}
            keyboardType="email-address"
            {...focusProps("correo")}
          />

          <ProfileField
            icon="call-outline"
            placeholder="Teléfono"
            value={perfil.telefono}
            onChangeText={perfil.setTelefono}
            keyboardType="phone-pad"
            {...focusProps("telefono")}
          />

          <ProfileField
            icon="location-outline"
            placeholder="Ciudad / Ubicación"
            value={perfil.ciudad}
            editable={false}
          />

          {/*Botón cambiar contraseña */}
          <Pressable
            style={({ pressed }) => [
              styles.changePassButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.changePassIconWrap}>
              <Ionicons name="key-outline" size={18} color={BRAND} />
            </View>
            <Text style={styles.changePassText}>Cambiar contraseña</Text>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </Pressable>

          <SaveButton
            onPress={perfil.handleGuardar}
            saving={perfil.guardando}
          />
        </View>
      </ScrollView>

      {/* Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          // opcional: hacer algo al cambiar la contraseña
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F17" },
  backButton: {
    position: "absolute",
    top: 14,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15,15,23,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
    marginLeft: 22,
  },
  form: { paddingHorizontal: 22, marginTop: 22, paddingBottom: 40 },

  changePassButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,107,53,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.3)",
  },
  changePassIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.35)",
  },
  changePassText: {
    color: "#F3F4F6",
    fontSize: 14.5,
    fontWeight: "600",
    flex: 1,
  },
});
