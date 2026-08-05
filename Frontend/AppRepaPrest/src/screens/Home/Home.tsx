import React, { JSX } from "react";
import { Platform, Alert } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";

import Home from "./HomeScreen";
import Prestamos from "../Prestamos/Prestamos";
import Comunidad from "../Comunidad/Comunidad";
import { authService } from "../../services/auth/AuthService";

type Props = StackScreenProps<RootStackParamList, "Home">;

export type HomeTabParamList = {
  Home: { userId: string; userName: string };
  Prestamos: { userId: string; userName: string };
  Comunidad: { userId: string; userName: string };
  Salir: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

const DISABLED_TABS = ["Prestamos"];

export default function HomeTabs({ route }: Props): JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const params = route?.params;
  const userId = params?.userId || "";
  const userName = params?.userName || "";

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
            } finally {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                }),
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route: tabRoute }) => {
        const isDisabled = DISABLED_TABS.includes(tabRoute.name);
        const isLogout = tabRoute.name === "Salir";

        return {
          headerShown: false,
          tabBarActiveTintColor: isLogout ? "#EF4444" : "#FF6B35",
          tabBarInactiveTintColor: isLogout
            ? "#EF4444"
            : isDisabled
              ? "#3A3A45"
              : "#6B7280",
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
      <Tab.Screen
        name="Home"
        component={Home}
        initialParams={{ userId, userName }}
        options={{ tabBarLabel: "Home" }}
      />

      <Tab.Screen
        name="Prestamos"
        component={Prestamos}
        initialParams={{ userId, userName }}
        options={{ tabBarLabel: "Préstamos" }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />

      <Tab.Screen
        name="Comunidad"
        component={Comunidad}
        initialParams={{ userId, userName }}
        options={{ tabBarLabel: "Comunidad" }}
      />

      <Tab.Screen
        name={"Salir" as any}
        component={Comunidad}
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
