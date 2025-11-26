import "./global.css";
import React from "react";
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme } from './src/theme/theme';

export default function App() {
  return (
    <PaperProvider theme={lightTheme}>
      <AppNavigator/>
    </PaperProvider>
  );
}
