// src/navigation/AppNavigator.tsx
import React, { JSX } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Welcome from '../screens/Welcome/Welcome';
import Login from '../screens/Login/Login';
import Home from '../screens/Home/Home';
import RoleSelection from '../screens/RoleSelection/RoleSelection';
import Register from '../screens/Register/Register';
import RegisterAgrupacion from '../screens/RegisterAgrupacion/RegisterAgrupacion';
import RegisterAgrupacionSuccess from '../screens/RegisterAgrupacionSuccess/RegisterAgrupacionSuccess';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';
import ResetPassword from '../screens/ResetPassword/ResetPassword';
import RegisterSuccess from '../screens/RegisterSuccess/RegisterSuccess';
import { authService } from '../services/auth.service'; 


export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RoleSelection: undefined;
  Register: { rol?: 'asociado' | 'administrador' };
  RegisterAgrupacion: undefined;
  RegisterAgrupacionSuccess: { agrupacion: string; codigo: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  RegisterSuccess: { nombre?: string };
  Home: {
    userId?: number;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
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
          name="RoleSelection" 
          component={RoleSelection}
          options={{
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
          name="RegisterSuccess"
          component={RegisterSuccess}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}