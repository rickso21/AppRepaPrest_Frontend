import React, { JSX, useEffect, useState, useRef } from "react";
import { Platform, Alert } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import HomeScreen from "./HomeScreen";
import Prestamos from "../Prestamos/Prestamos";
import Comunidad from "../Comunidad/Comunidad";
import { authService } from "../../services/auth/AuthService";
import PrestamosPopup from "../Prestamos/PrestamosPopup";

type Props = StackScreenProps<RootStackParamList, "Home">;

export type HomeTabParamList = {
  Home: { userId: string; userName: string };
  Prestamos: { userId: string; userName: string };
  Comunidad: { userId: string; userName: string };
  Salir: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

export default function HomeTabs({ route }: Props): JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const params = route?.params;
  const userId = params?.userId || "";
  const userName = params?.nombre || "Usuario";
  const [hasActiveLoan, setHasActiveLoan] = useState<boolean>(false);
  const [activeLoanData, setActiveLoanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isNavigating = useRef(false);

  // Estados para el popup
  const [showPopup, setShowPopup] = useState(false);
  const [lastPopupTime, setLastPopupTime] = useState(0);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  
  const POPUP_INTERVAL = 1 * 60 * 1000;

  //Verificar si tiene préstamo activo
  const checkActiveLoan = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Verificando préstamo activo para:', userId);
      await new Promise(resolve => setTimeout(resolve, 800));
      const simulatedResponse = {
        hasActiveLoan: true, //probar redirección
        loanData: {
          id: 'PR-2026-001',
          montoSolicitado: 2000,
          montoTotal: 2160,
          cuotaQuincenal: 1080,
          quincenas: 2,
          fechaSolicitud: '01 de agosto, 2026',
          fechaProximoPago: '15 de agosto, 2026',
          quincenasRestantes: 2,
          progreso: 0,
        }
      };
      
      
      setHasActiveLoan(simulatedResponse.hasActiveLoan);
      if (simulatedResponse.hasActiveLoan) {
        setActiveLoanData(simulatedResponse.loanData);
      }
      
    } catch (error) {
      setHasActiveLoan(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkActiveLoan();
  }, [userId]);

  const handlePrestamosPress = () => {
    if (isLoading || isNavigating.current) {
      return;
    }
    
    if (hasActiveLoan === true && activeLoanData) {
      console.log('🔄 Redirigiendo a PrestamoActivo');
      isNavigating.current = true;
      
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('PrestamoActivo', {
          userId: userId,
          nombre: userName,
          prestamoData: activeLoanData
        });
      } else {
        navigation.navigate('PrestamoActivo' as never);
      }
      
      setTimeout(() => {
        isNavigating.current = false;
      }, 1000);
      
      return;
    }
    
    console.log('No tiene préstamo activo → Mostrando Prestamos');
    
    // Navegar al tab Prestamos
    navigation.dispatch({
      ...CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'Prestamos',
          params: {
            userId: userId,
            userName: userName
          }
        }
      })
    });
    
    // Mostrar popup después de navegar
    setTimeout(() => {
      showPrestamosPopup();
    }, 500);
  };

  const showPrestamosPopup = () => {
    const currentTime = Date.now();
    const timeSinceLastPopup = currentTime - lastPopupTime;
    
    if (isFirstOpen || timeSinceLastPopup >= POPUP_INTERVAL) {
      setShowPopup(true);
      setLastPopupTime(Date.now());
      setIsFirstOpen(false);
    } else {
    }
  };

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
              setShowPopup(false);
              setLastPopupTime(0);
              setIsFirstOpen(true);
              setHasActiveLoan(false);
              setActiveLoanData(null);
              setIsLoading(true);
              isNavigating.current = false;
            } catch (error) {
              console.error("Error:", error);
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
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route: tabRoute }) => {
          const isLogout = tabRoute.name === "Salir";

          return {
            headerShown: false,
            tabBarActiveTintColor: isLogout ? "#EF4444" : "#FF6B35",
            tabBarInactiveTintColor: isLogout ? "#EF4444" : "#6B7280",
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
          component={HomeScreen}
          initialParams={{ userId, userName }}
          options={{ tabBarLabel: "Home" }}
        />

        <Tab.Screen
          name="Prestamos"
          component={Prestamos}
          initialParams={{ userId, userName }}
          options={{ tabBarLabel: "Préstamos" }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handlePrestamosPress();
            },
          }}
        />

        <Tab.Screen
          name="Comunidad"
          component={Comunidad}
          initialParams={{ userId, userName }}
          options={{ tabBarLabel: "Comunidad" }}
        />

        <Tab.Screen
          name="Salir"
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

      {/* POPUP DE PRÉSTAMOS */}
      <PrestamosPopup 
        visible={showPopup}
        onClose={() => setShowPopup(false)}
        autoClose={true}
        duration={7000}
      />
    </>
  );
}