import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { createBottomTabNavigator } from "expo-router/js-tabs";
import * as SecureStore from "expo-secure-store";
import { useCallback, useRef, useState } from "react";
import { Alert, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// MONITOREO
import { authService } from "@/services/auth/AuthService";
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
      avatarUrl?: string | null;
      portadaUrl?: string | null;
    };
  };
};

export type HomeTabParamList = {
  Home: {
    userId: string;
    userName: string;
    nombre?: string;
    avatarUrl?: string | null;
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
    postId?: string;
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
};

const SalirPlaceholder = () => <View />;

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function HomeScreenTabs() {
  const insets = useSafeAreaInsets();

  // ✅ 1. Leemos los parámetros que vienen de la notificación
  const localParams = useLocalSearchParams<{ tab?: string; postId?: string }>();
  const requestedTab = localParams?.tab;
  const requestedPostId = localParams?.postId;

  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [ready, setReady] = useState(false);
  const isNavigating = useRef(false);

  // Recarga userData cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Storage.getItem("userData").then((raw) => {
        if (!active) return;
        if (raw) {
          try {
            setUserData(JSON.parse(raw));
          } catch {}
        }
        setReady(true);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const userId = String(userData?.id ?? "") || "";
  const nombre = userData?.nombre || "";
  const userName = nombre || "Usuario";
  const avatarUrl = userData?.avatar_url ?? null;

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
              await authService.logout();
            } catch (error) {
            } finally {
              router.replace("/login");
              isNavigating.current = false;
            }
          },
        },
      ],
    );
  }, []);

  if (!ready) return null;

  return (
    <Tab.Navigator
      // ✅ 2. ESTO ES LA MAGIA:
      // Al cambiar el "key" (agregando el requestedTab), obligamos a React a destruir
      // el TabNavigator actual y crear uno nuevo. Al crearlo desde cero, usa el
      // initialRouteName que le indicamos (ej. "Comunidad").
      key={`tabs-${requestedTab || "Home"}`}
      initialRouteName={(requestedTab as any) || "Home"}
      screenOptions={({ route }) => {
        const isLogout = route.name === "Salir";
        return {
          headerShown: false,
          tabBarActiveTintColor: "#940000",
          tabBarInactiveTintColor: "#6B7280",
          tabBarStyle: {
            backgroundColor: "#16161F",
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.07)",
            height: Platform.OS === "ios" ? 80 : 60 + insets.bottom,
            paddingBottom: Platform.OS === "ios" ? 24 : 10 + insets.bottom,
          },
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: any = "home-outline";
            if (route.name === "Home")
              iconName = focused ? "home" : "home-outline";
            else if (route.name === "Prestamos")
              iconName = focused ? "cash" : "cash-outline";
            else if (route.name === "Comunidad")
              iconName = focused ? "people" : "people-outline";
            else if (route.name === "Salir") iconName = "log-out-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        };
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ userId, userName, nombre, avatarUrl }}
        options={{ tabBarLabel: "Home" }}
      />

      <Tab.Screen
        name="Prestamos"
        component={Prestamos}
        initialParams={{ userId, userName, nombre, avatarUrl }}
        options={{ tabBarLabel: "Préstamos" }}
      />

      <Tab.Screen
        name="Comunidad"
        component={Comunidad}
        initialParams={{
          userId,
          userName,
          nombre,
          avatarUrl,
          postId: requestedPostId, // ✅ Pasamos el postId para que abra la publicación exacta
        }}
        options={{ tabBarLabel: "Comunidad" }}
      />

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
