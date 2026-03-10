# MJCP Mobile - Contexto do Projeto

## O que é

Aplicativo mobile para **gestão de escalas e eventos de uma igreja/ministério**. Permite que membros visualizem seus próximos eventos, confirmem presença, solicitem trocas, bloqueiem datas de indisponibilidade, reservem salas e gerenciem seus perfis.

O nome do projeto é **MJCP** (sigla do ministério/igreja).

---

## Stack Tecnológica

| Tecnologia                         | Versão   | Uso                                                                  |
| ---------------------------------- | -------- | -------------------------------------------------------------------- |
| **React Native**                   | 0.81.5   | Framework mobile                                                     |
| **Expo**                           | ~54.0.30 | Toolchain e build (SDK 54, New Architecture habilitada)              |
| **TypeScript**                     | ~5.9.2   | Tipagem estática                                                     |
| **React Navigation**               | 7.x      | Navegação (Native Stack + Bottom Tabs)                               |
| **NativeWind**                     | 4.2.1    | TailwindCSS para React Native                                        |
| **TailwindCSS**                    | 3.4.x    | Classes utilitárias de estilo                                        |
| **React Native Paper**             | 5.14.5   | Componentes Material Design 3 (tema, Avatar, Portal, Modal, Divider) |
| **Lucide React Native**            | 0.554.0  | Ícones vetoriais                                                     |
| **React Native Calendars**         | 1.1313.0 | Calendário interativo (seleção de datas, intervalos)                 |
| **React Native Reanimated**        | ~4.1.1   | Animações nativas                                                    |
| **React Native Screens**           | ~4.16.0  | Navegação nativa otimizada                                           |
| **React Native Safe Area Context** | ~5.6.0   | Margens seguras de tela                                              |

---

## Arquitetura do Projeto

```
mobile/
├── App.tsx                    # Entry point: PaperProvider + AppNavigator
├── index.ts                   # Registro do app Expo
├── global.css                 # Tailwind base/components/utilities
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Stack Navigator principal
│   ├── screens/
│   │   ├── app/               # Telas autenticadas
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── EventsScreen.tsx
│   │   │   ├── EventDetailsScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── EditProfileScreen.tsx
│   │   │   ├── BlockDatesScreen.tsx
│   │   │   ├── MusicScreen.tsx
│   │   │   └── RoomsScreen.tsx
│   │   └── auth/              # Telas de autenticação
│   │       ├── LoginScreen.tsx
│   │       └── SignUpScreen.tsx
│   ├── components/
│   │   ├── TabNavigator.tsx   # Bottom tabs (Home, Rooms, Music, Profile)
│   │   ├── ProfileAvatar.tsx  # Avatar + nome reutilizável
│   │   ├── button/
│   │   │   └── DefaultButton.tsx   # Botão primary/outline
│   │   ├── card/
│   │   │   ├── ActivityCard.tsx    # Card de atividade recente
│   │   │   ├── EventCard.tsx       # Card de evento com ações
│   │   │   ├── EventInfoCard.tsx   # Card detalhado de evento
│   │   │   ├── MemberCard.tsx      # Card de membro da equipe
│   │   │   ├── MiniCard.tsx        # Card quadrado com ícone
│   │   │   ├── RoomCard.tsx        # Card de sala (status, reserva)
│   │   │   └── TeamStatusCard.tsx  # Card de confirmados/pendentes
│   │   ├── Header/
│   │   │   ├── HeaderPrimary.tsx   # Header com notificação e avatar
│   │   │   ├── HeaderSecondary.tsx # Header com voltar e título
│   │   │   └── ProfileHeader.tsx   # Header do perfil (voltar + menu)
│   │   ├── input/
│   │   │   └── Input.tsx           # Input com label e forwardRef
│   │   └── utils/
│   │       ├── BottomSheet.tsx         # Sheet deslizante (PanResponder + Animated)
│   │       ├── BottomSheetMenu.tsx     # Menu de opções do perfil
│   │       ├── CalendarModal.tsx       # Modal de calendário (single/range)
│   │       └── NotificationsModal.tsx  # Modal de notificações
│   └── theme/
│       └── theme.ts           # Temas light/dark (Material Design 3)
└── ai/                        # Documentação AI e contexto
```

---

## Navegação

### Stack Principal (AppNavigator)

- `Main` → TabNavigator (4 abas)
- `EventDetails` → Detalhes de um evento
- `EventsScreen` → Todos os eventos
- `BlockDatesScreen` → Bloquear datas
- `Profile` → Perfil do usuário
- `EditProfile` → Editar perfil

> Login e SignUp estão comentados no navigator (não estão no fluxo atual).

### Tab Navigator

| Aba     | Tela          | Ícone    |
| ------- | ------------- | -------- |
| Home    | HomeScreen    | Home     |
| Salas   | RoomsScreen   | DoorOpen |
| Músicas | MusicScreen   | Music    |
| Perfil  | ProfileScreen | User     |

---

## Tema e Design

- **Design System**: Material Design 3 via React Native Paper
- **Cores principais**:
  - Primary: `#000000` (preto)
  - Secondary: `#ffae00` (amarelo destaque)
  - Tertiary: `#10b981` (verde)
  - Error: `#ef4444` (vermelho)
  - Background: `#ffffff`
  - Texto principal: `#111827` (gray-900)
  - Texto secundário: `#6b7280` (gray-500)
- **Estilização**: Mistura de NativeWind (classes Tailwind) e StyleSheet inline
- **Ícones**: Lucide React Native

---

## Estado Atual do Desenvolvimento

O app está na fase de **protótipo/UI**. Todas as telas usam dados mockados (hardcoded) e nenhuma ação real é executada — os handlers apenas exibem `Alert.alert()`.

### O que funciona (UI)

- Tela Home com lista de eventos e navegação
- Tela de Detalhes do Evento com membros da equipe
- Tela de Bloqueio de Datas com calendário interativo
- Tela de Salas com filtro de horário e cards de status
- Tela de Perfil com menu bottom-sheet
- Tela de Editar Perfil com campos
- Login e Cadastro (com validação básica mock)
- Modal de notificações e calendário
- Bottom sheet com gestos

### O que NÃO funciona / não existe

- Nenhuma integração com backend/API
- Nenhuma autenticação real
- Nenhuma persistência de dados
- Telas `EventsScreen` e `MusicScreen` são stubs vazios
- Ações (confirmar, trocar, reservar, salvar) são apenas alerts
- Sem gerenciamento de estado global (Context/Redux/Zustand)
- Sem tratamento de erros
- Sem loading states
- Sem pull-to-refresh
- Sem testes
