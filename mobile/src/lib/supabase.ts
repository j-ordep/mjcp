import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const isWeb = Platform.OS === 'web'

const nativeStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

function readRequiredPublicEnv(
  name: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
) {
  const value = process.env[name]?.trim()

  if (
    !value ||
    value.includes('******') ||
    /your_|change[_-]?me|placeholder|example/i.test(value)
  ) {
    throw new Error(
      `${name} não está configurada. Atualize as variáveis públicas do Supabase antes de iniciar o app.`,
    )
  }

  return value
}

const supabaseUrl = readRequiredPublicEnv('EXPO_PUBLIC_SUPABASE_URL')
const supabasePubKey = readRequiredPublicEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

export const supabase = createClient(supabaseUrl, supabasePubKey, {
  auth: {
    storage: isWeb ? undefined : nativeStorageAdapter,
    autoRefreshToken: !isWeb,
    persistSession: !isWeb,
    detectSessionInUrl: false,
  },
})
