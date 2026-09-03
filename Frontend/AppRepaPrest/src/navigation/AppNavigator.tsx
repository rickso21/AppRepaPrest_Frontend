// src/navigation/AppNavigator.tsx
import React, { JSX } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Welcome from '../screens/Welcome/Welcome';
import Login from '../screens/Login/Login';
import Home from '../screens/Home/Home';
import Register from '../screens/Register/Register';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';
import ResetPassword from '../screens/ResetPassword/ResetPassword';
import SolicitudPrestamo from '../screens/Prestamos/SolicitudPrestamo/SolicitudPrestamo';
import Cargando from '../screens/Prestamos/Cargando/Cargando';
import MontoAprobado from '../screens/Prestamos/MontoAprobado/MontoAprobado';
import PrestamoActivo from '../screens/Prestamos/PrestamoActivo/PrestamoActivo';
import RegisterAgrupacion from '../screens/RegisterAgrupacion/RegisterAgrupacion';
import RegisterAgrupacionSuccess from '../screens/RegisterAgrupacionSuccess/RegisterAgrupacionSuccess';
import RegisterSuccess from '../screens/RegisterSuccess/RegisterSuccess';
import RoleSelection from '../screens/RoleSelection/RoleSelection';
import ChatScreen from '../screens/Comunidad/ChatScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: { rol?: 'asociado' | 'administrador' };
  ForgotPassword: undefined;
  RoleSelection: undefined;
  RegisterAgrupacion: undefined;
  RegisterAgrupacionSuccess: { agrupacion: string; codigo: string };
  RegisterSuccess: { nombre?: string };


  ResetPassword: { email: string };




  Home: {
    userId?: string;    
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    email?: string;
    direccion?: string;
    curp?: string;
    telefono?: string;
  } | undefined;
    montoAprobado?: number; 



  SolicitudPrestamo: {
    userId: string;
    userName: string;
    montoPreaprobado: number;
  };

  ChatScreen: undefined;


  Cargando: {
    userId: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    email: string;
    telefono: string;
    direccion: string;
    curp: string;
  };

  MontoAprobado: {
    userId: string;
    nombre: string;
    montoAprobado: number;
  };

  PrestamoActivo: {
    userId: string;
    nombre: string;
    prestamoData: {
      id: string;
      montoSolicitado: number;
      montoTotal: number;
      cuotaQuincenal: number;
      quincenas: number;
      fechaSolicitud: string;
      fechaProximoPago: string;
      quincenasRestantes: number;
      progreso: number;
    };
  };
  

};

  

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen 
          name="Login" 
          component={Login}
          options={{
            animationTypeForReplace: 'push',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={Register}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPassword}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="ResetPassword" 
          component={ResetPassword}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{
            animationTypeForReplace: 'push',
            animation: 'slide_from_right',
          }}
        />


        <Stack.Screen 
          name="SolicitudPrestamo" 
          component={SolicitudPrestamo}
          options={{
            animationTypeForReplace: 'push',
            animation: 'slide_from_right',
          }}
        />

         <Stack.Screen 
          name="Cargando" 
          component={Cargando}
          options={{
            animationTypeForReplace: 'push',
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen 
          name="MontoAprobado" 
          component={MontoAprobado}
          options={{
            animationTypeForReplace: 'push',
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen 
          name="PrestamoActivo" 
          component={PrestamoActivo}
          options={{ headerShown: false }}

        />

           <Stack.Screen 
          name="RoleSelection" 
          component={RoleSelection}
          options={{
            animation: 'slide_from_right',
          }}
        />

          <Stack.Screen 
          name="RegisterAgrupacion" 
          component={RegisterAgrupacion}
          options={{
            animation: 'slide_from_right',
          }}
        />

         <Stack.Screen 
          name="RegisterAgrupacionSuccess" 
          component={RegisterAgrupacionSuccess}
          options={{
            animation: 'slide_from_right',
          }}
        />

         <Stack.Screen 
          name="RegisterSuccess"
          component={RegisterSuccess}
          options={{
            animation: 'slide_from_right',
          }}
        />

         <Stack.Screen name="ChatScreen" 
          component={ChatScreen}
          />
      </Stack.Navigator>
    </NavigationContainer>
  );
}