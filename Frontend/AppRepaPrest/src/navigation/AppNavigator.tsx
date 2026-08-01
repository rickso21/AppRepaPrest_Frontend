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

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}