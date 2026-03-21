import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import "./global.css";
import { supabase } from "./src/lib/supabase";
import AppNavigator from "./src/navigation/AppNavigator";
import { getProfile } from "./src/services/profileService";
import { useAuthStore } from "./src/stores/useAuthStore";
import { lightTheme } from "./src/theme/theme";

export default function App() {
  const { setSession, setProfile, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const { profile } = await getProfile(session.user.id);
        setProfile(profile);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { profile } = await getProfile(session.user.id);
        setProfile(profile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={lightTheme}>
      <AppNavigator />
    </PaperProvider>
  );
}
