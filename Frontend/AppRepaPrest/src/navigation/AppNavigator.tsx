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
import ChatScreen from '../screens/Comunidad/ChatScreen';

export type RootStackParamList = {
  Welcome: undefined;
  ChatScreen: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  Home: {
    userId?: string;    
    userName?: string;
    userEmail?: string;
    userPhone?: string;
  } | undefined;};

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
          <Stack.Screen name="ChatScreen" 
          component={ChatScreen}
          />
      </Stack.Navigator>
    </NavigationContainer>
  );
}