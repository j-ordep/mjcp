import { Text, View } from "react-native";
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
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 24,
              backgroundColor: "#fff",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Configuracao necessaria
            </Text>
            <Text style={{ color: "#4b5563", lineHeight: 22, marginBottom: 10 }}>
              O app precisa das variaveis publicas do Supabase para iniciar com
              seguranca.
            </Text>
            <Text style={{ color: "#6b7280", lineHeight: 22 }}>
              Revise `EXPO_PUBLIC_SUPABASE_URL` e
              `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no `.env` e reinicie o app.
            </Text>
          </View>
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
