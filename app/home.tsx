// app/(tabs)/index.tsx  (o donde tengas HomeTabs)
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { createBottomTabNavigator } from "expo-router/js-tabs";
import * as SecureStore from "expo-secure-store";
import { useCallback, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// MONITOREO
import Comunidad from "./comunidad";
import HomeScreen from "./homeScreen";
import Prestamos from "./prestamos";

// ============================================================
// TIPOS
// ============================================================
type Props = {
  route?: {
    params?: {
      userId?: string;
      userName?: string;
      nombre?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string;
      email?: string;
      telefono?: string;
      avatarUrl?: string | null; // ← nuevo
      portadaUrl?: string | null; // ← nuevo
    };
  };
};

export type HomeTabParamList = {
  Home: {
    userId: string;
    userName: string;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    email?: string;
    telefono?: string;
    avatarUrl?: string | null; // ← nuevo
    portadaUrl?: string | null; // ← nuevo
  };
  Prestamos: {
    userId: string;
    userName: string;
    nombre?: string;
    avatarUrl?: string | null;
  };
  Comunidad: {
    userId: string;
    userName: string;
    nombre?: string;
    avatarUrl?: string | null;
  };
  Salir: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

// ============================================================
// STORAGE
// ============================================================
const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web") return localStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  deleteItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignorar */
    }
  },
};

const SalirPlaceholder = () => <View />;

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function HomeTabs({ route }: Props) {
  const insets = useSafeAreaInsets();
  const params = route?.params ?? {};

  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [ready, setReady] = useState(false);
  const isNavigating = useRef(false);

  // Recarga userData cada vez que HomeTabs gana foco
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Storage.getItem("userData").then((raw) => {
        if (!active) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            console.log("[HomeTabs] userData desde SecureStore:", parsed);
            setUserData(parsed);
          } catch {
            /* ignorar */
          }
        }
        setReady(true);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // ============================================================
  // DATOS DERIVADOS
  // ============================================================
  const userId = String(userData?.id ?? "") || params?.userId || "";
  const nombre = userData?.nombre || params?.nombre || "";

  const apellidoPaterno =
    userData?.apellido_p ||
    userData?.apellidoPaterno ||
    params?.apellidoPaterno ||
    "";

  const apellidoMaterno =
    userData?.apellido_m ||
    userData?.apellidoMaterno ||
    params?.apellidoMaterno ||
    "";

  const email = userData?.email || params?.email || "";
  const telefono = userData?.telefono || params?.telefono || "";

  const userName = params?.userName || nombre || "Usuario";

  const avatarUrl = userData?.avatar_url ?? params?.avatarUrl ?? null;

  const portadaUrl = userData?.portada_url ?? params?.portadaUrl ?? null;

  // ============================================================
  // CERRAR SESIÓN
  // ============================================================
  const handleLogout = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => {
            isNavigating.current = false;
          },
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            try {
              // Limpiar todo el estado de sesión
              await Storage.deleteItem("userToken");
              await Storage.deleteItem("userData");
              await Storage.deleteItem("tokenExpiry");
              await AsyncStorage.removeItem("perfil_data");
            } catch (error) {
              console.error("[HomeTabs] Error cerrando sesión:", error);
            } finally {
              router.replace("/login");
              isNavigating.current = false;
            }
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          isNavigating.current = false;
        },
      },
    );
  }, []);

  if (!ready) return null;

  return (
    <Tab.Navigator
      key={userId || "anon"}
      initialRouteName="Home"
      screenOptions={({ route: tabRoute }) => {
        const isLogout = tabRoute.name === "Salir";

        return {
          headerShown: false,
          tabBarActiveTintColor: isLogout ? "#940000" : "#940000",
          tabBarInactiveTintColor: isLogout ? "#940000" : "#6B7280",
          tabBarStyle: {
            backgroundColor: "#16161F",
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.07)",
            height: Platform.OS === "ios" ? 80 : 60,
            paddingTop: Platform.OS === "ios" ? 8 : 6,
            paddingBottom: Platform.OS === "ios" ? 24 : 10,
            elevation: 16,
            ...(Platform.OS === "android" && {
              paddingBottom: 10 + insets.bottom,
              height: 69 + insets.bottom,
            }),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.2,
            marginBottom: Platform.OS === "ios" ? 0 : 2,
          },
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: string;

            if (tabRoute.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (tabRoute.name === "Prestamos") {
              iconName = focused ? "cash" : "cash-outline";
            } else if (tabRoute.name === "Comunidad") {
              iconName = focused ? "people" : "people-outline";
            } else if (tabRoute.name === "Salir") {
              iconName = "log-out-outline";
            } else {
              iconName = "home-outline";
            }

            return (
              <Ionicons name={iconName as any} size={size} color={color} />
            );
          },
        };
      }}
    >
      {/* MONITOREO */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{
          userId,
          userName,
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          email,
          telefono,
          avatarUrl,
          portadaUrl,
        }}
        options={{ tabBarLabel: "Home" }}
      />

      {/* PRÉSTAMOS */}
      <Tab.Screen
        name="Prestamos"
        component={Prestamos}
        initialParams={{ userId, userName, nombre, avatarUrl }}
        options={{ tabBarLabel: "Préstamos" }}
      />

      {/* COMUNIDAD */}
      <Tab.Screen
        name="Comunidad"
        component={Comunidad}
        initialParams={{ userId, userName, nombre, avatarUrl }}
        options={{ tabBarLabel: "Comunidad" }}
      />

      {/* SALIR */}
      <Tab.Screen
        name="Salir"
        component={SalirPlaceholder}
        options={{
          tabBarLabel: "Salir",
          tabBarIcon: ({ size }: any) => (
            <Ionicons name="log-out-outline" size={size} color="#EF4444" />
          ),
        }}
        listeners={{
          tabPress: (e: any) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================================
// ESTILOS
// ============================================================
const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: "#0F0F17",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  placeholderText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
});
