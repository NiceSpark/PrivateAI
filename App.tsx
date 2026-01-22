import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import TextScreen from './screens/TextScreen';
import AudioScreen from './screens/AudioScreen';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Text: undefined;
  Audio: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Text" component={TextScreen} />
        <Stack.Screen name="Audio" component={AudioScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
