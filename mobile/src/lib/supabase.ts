import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getPublicSupabaseConfigOrThrow } from "./publicEnv";

const isWeb = Platform.OS === "web";

const nativeStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const {
  supabaseUrl,
  supabasePublishableKey: supabasePubKey,
} = getPublicSupabaseConfigOrThrow();

export const supabase = createClient(supabaseUrl, supabasePubKey, {
  auth: {
    storage: isWeb ? undefined : nativeStorageAdapter,
    autoRefreshToken: !isWeb,
    persistSession: !isWeb,
    detectSessionInUrl: false,
  },
});
