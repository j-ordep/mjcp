import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#000000',           // preto para botões principais
    secondary: '#ffae00',         // azul para destaques
    tertiary: '#10b981',          // verde (opcional)
    error: '#ef4444',             // vermelho para erros
    background: '#ffffff',        // cinza muito claro (gray-50)
    surface: '#ffffff',           // branco para cards
    surfaceVariant: '#f3f4f6',    // cinza claro (gray-100)
    surfaceDisabled: '#e5e7eb',   // cinza médio (gray-200)
    onPrimary: '#ffffff',         // texto em cima do primary
    onSecondary: '#ffffff',       // texto em cima do secondary
    onSurface: '#111827',         // texto principal (gray-900)
    onSurfaceVariant: '#6b7280',  // texto secundário (gray-500)
    outline: '#d1d5db',           // bordas (gray-300)
    outlineVariant: '#e5e7eb',    // bordas secundárias (gray-200)
    elevation: {
      level0: 'transparent',
      level1: '#ffffff',          // cards elevados
      level2: '#ffffff',
      level3: '#ffffff',
      level4: '#ffffff',
      level5: '#ffffff',
    },
  },
};

// export const lightTheme = {
//   ...MD3LightTheme,
//   colors: {
//     ...MD3LightTheme.colors,
//     primary: "#000",
//     outline: "#000",
//   },
// };

// export const darkTheme = {
//   ...MD3DarkTheme,
//   colors: {
//     ...MD3DarkTheme.colors,
//     primary: "#fff",
//     outline: "#fff",
//   },
// };

