import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
import AppNavigator from "./src/navigation/AppNavigator";
import { lightTheme } from "./src/theme/theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={lightTheme}>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
