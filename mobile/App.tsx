import { View } from "react-native";
import { Text } from "./src/components/ui/text";
import { PortalHost } from "@rn-primitives/portal";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
import { getPublicSupabaseConfig } from "./src/lib/publicEnv";
import { lightTheme } from "./src/theme/theme";

export default function App() {
  const bootstrapConfig = getPublicSupabaseConfig();
  const AppNavigator = bootstrapConfig.data
    ? require("./src/navigation/AppNavigator").default
    : null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={lightTheme}>
        {AppNavigator ? (
          <AppNavigator />
        ) : (
          <View className="flex-1 justify-center px-6 bg-background">
            <Text className="text-2xl font-bold text-foreground mb-3">
              Não foi possível iniciar o aplicativo
            </Text>
            <Text className="text-muted-foreground leading-6">
              Por favor, entre em contato com o suporte ou tente novamente mais tarde.
            </Text>
          </View>
        )}
        <PortalHost />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
