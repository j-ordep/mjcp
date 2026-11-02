import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getPublicSupabaseConfigOrThrow } from "./publicEnv";

const isWeb = Platform.OS === "web";

const nativeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    console.log('[SecureStore] getItem chamado para:', key);
    try {
      const value = await SecureStore.getItemAsync(key);
      console.log('[SecureStore] getItem sucesso:', key, value ? 'existe' : 'null');
      return value ?? null;
    } catch (error) {
      console.warn('[SecureStore] getItemAsync error:', key, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    console.log('[SecureStore] setItem chamado para:', key);
    try {
      await SecureStore.setItemAsync(key, value);
      console.log('[SecureStore] setItem sucesso:', key);
    } catch (error) {
      console.warn('[SecureStore] setItemAsync error:', key, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    console.log('[SecureStore] removeItem chamado para:', key);
    try {
      await SecureStore.deleteItemAsync(key);
      console.log('[SecureStore] removeItem sucesso:', key);
    } catch (error) {
      console.warn('[SecureStore] deleteItemAsync error:', key, error);
    }
  },
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
