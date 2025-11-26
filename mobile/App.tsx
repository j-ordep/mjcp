import "./global.css";
import React from "react";
import { PaperProvider } from 'react-native-paper';
import RootNavigation from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <RootNavigation/>
    </PaperProvider>
  );
}
