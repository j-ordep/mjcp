import "./global.css";
import { StatusBar } from 'expo-status-bar';
import React from "react";
import { PaperProvider } from 'react-native-paper';
import { Text, View } from 'react-native';
import RootNavigation from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider>
      <RootNavigation/>
    </PaperProvider>
  );
}
