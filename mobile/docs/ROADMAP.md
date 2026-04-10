# MJCP Mobile - Roadmap de Features

> Checklist de tudo que precisa ser feito para o app sair do protótipo e ir para produção.
> Marque com `[x]` conforme for concluindo.

---

## 🔴 Crítico — Infraestrutura

### Backend & API

- [ ] Backend (Supabase)
- [ ] Configurar client HTTP (axios / fetch wrapper)
- [ ] Definir modelos/tipos TypeScript para entidades (User, Event, Room, Notification)
- [ ] Implementar tratamento de erros global (interceptors, retry, timeout)

### Autenticação

- [ ] Integrar autenticação real (email/senha)
- [ ] Fluxo de login com token (JWT / session)
- [ ] Persistência de sessão (AsyncStorage / SecureStore)
- [ ] Reativar telas Login e SignUp no navigator
- [ ] Proteção de rotas (redirecionar para login se não autenticado)
- [ ] Fluxo de "Esqueci minha senha"
- [ ] Validação real de formulários (email, senha forte, campos obrigatórios)

### Estado Global

- [ ] Escolher lib de estado (Zustand / Context API / Redux Toolkit)
- [ ] Store de usuário autenticado
- [ ] Store de eventos
- [ ] Store de salas
- [ ] Store de notificações

---

## 🟡 Alto — Telas & Features Incompletas

### HomeScreen

- [ ] Buscar eventos do usuário via API
- [ ] Ação "Confirmar presença" integrada com backend
- [ ] Ação "Solicitar troca" integrada com backend
- [ ] Pull-to-refresh na lista de eventos
- [ ] Loading skeleton enquanto carrega
- [ ] Estado vazio (sem eventos)

### EventsScreen

- [x] Layout da tela com lista de todos os eventos
- [x] Filtros (Todos, Próximos, Passados)
- [x] Busca/pesquisa de eventos
- [x] Paginação / infinite scroll com FlatList
- [x] Navegação para EventDetails ao clicar
- [ ] Card simples para eventos onde usuário NÃO está escalado (título, descrição, data, local)
- [ ] Card completo para eventos onde usuário ESTÁ escalado (departamento, função, botões de ação)
- [ ] Diferenciar visualização com base nos dados da API

### EventDetailsScreen

- [ ] Buscar detalhes do evento via API
- [ ] Visualização simples para eventos sem escala (apenas info geral)
- [ ] Visualização completa para eventos com escala (equipe, status, ações)
- [ ] Lista real de membros escalados
- [ ] Ação "Confirmar presença" funcional
- [ ] Ação "Preciso trocar" funcional (enviar solicitação)
- [ ] Atualização em tempo real do status da equipe

### MusicScreen

- [x] Definir funcionalidade (setlist, catálogo de músicas com tom/BPM)
- [x] Layout da tela
- [x] Catálogo de músicas com categorias (Louvor, Adoração, Infantil)
- [x] Busca de músicas por título ou artista
- [x] Card de próximo setlist vinculado a evento
- [ ] Tela de cifra/letra individual
- [ ] Criar/editar setlists

### RoomsScreen

- [ ] Buscar salas disponíveis via API por data/horário
- [ ] Calendário de seleção de data funcional
- [ ] Ação "Reservar" integrada com backend
- [ ] Ação "Ver detalhes" integrada (navigation ou modal)
- [ ] Feedback visual ao reservar (loading, success, error)

### BlockDatesScreen

- [ ] Salvar datas bloqueadas no backend
- [ ] Carregar datas já bloqueadas ao abrir
- [ ] Botão voltar funcional (onBack)
- [ ] Feedback de sucesso/erro ao bloquear

### ProfileScreen

- [ ] Buscar dados do perfil via API
- [ ] Atividades recentes reais
- [ ] Ação "Sair" (logout real — limpar token, redirecionar)
- [ ] Ação "Compartilhar perfil" funcional
- [ ] Ação "Configurar notificações" funcional

### EditProfileScreen

- [ ] Salvar alterações no backend
- [ ] Upload de foto de perfil (câmera / galeria)
- [ ] Validação de campos (email, telefone)
- [ ] Feedback de sucesso ao salvar

---

## 🟢 Médio — UX & Polimento

### Notificações

- [ ] Notificações reais (push notifications com Expo Notifications)
- [ ] Lista de notificações via API
- [ ] Marcar notificação como lida
- [ ] Badge de contagem no ícone de notificação
- [ ] Notificação ao ser escalado
- [ ] Notificação ao receber solicitação de troca

### UX Geral

- [ ] Loading states em todas as telas (skeleton / spinner)
- [ ] Pull-to-refresh onde aplicável
- [ ] Tratamento de erro amigável (tela de erro, retry)
- [ ] Estado vazio em listas (ilustração + texto)
- [ ] Toast/Snackbar para feedback de ações
- [ ] Suporte a tema escuro (darkTheme já existe base)
- [ ] Animações de transição entre telas
- [ ] Haptic feedback em ações importantes

### Formulários

- [ ] Validação com lib (Yup / Zod + React Hook Form)
- [ ] Máscaras de input (telefone, data)
- [ ] Feedback visual de campo inválido

---

## 🔵 Baixo — Nice to Have

### Features Adicionais

- [ ] Histórico de eventos passados
- [ ] Calendário mensal com eventos marcados
- [ ] Chat/mensagens entre membros
- [ ] Configurações do app (idioma, tema, notificações)
- [ ] Onboarding/tutorial primeiro acesso
- [ ] Suporte offline (cache local)

### Integração YouTube

- [ ] Exibir vídeos do canal da igreja (YouTube Data API v3)
- [ ] Vincular vídeos a eventos (transmissões ao vivo e gravações)
- [ ] Player inline ou abrir no app do YouTube
- [ ] Seção/aba de vídeos (feed recente do canal)
- [ ] Filtro por evento / categoria
- [ ] Notificação quando uma live começa

### DevOps & Qualidade

- [ ] Configurar ESLint + Prettier
- [ ] Testes unitários (Jest + React Native Testing Library)
- [ ] Testes E2E (Detox / Maestro)
- [ ] CI/CD (EAS Build + EAS Submit)
- [ ] Monitoramento de crashes (Sentry / Bugsnag)
- [ ] Analytics (Expo Analytics / Firebase Analytics)
- [ ] Versionamento semântico

### Performance

- [ ] Lazy loading de telas (React.lazy ou dynamic imports)
- [ ] Otimização de listas (FlashList ao invés de FlatList)
- [ ] Cache de imagens (expo-image)
- [ ] Memoização de componentes pesados

---

## Próximos Passos Sugeridos (Ordem)

1. **Definir e configurar backend** (Supabase recomendado para MVP rápido)
2. **Implementar autenticação real** (login, signup, persistência de sessão)
3. **Adicionar gerenciamento de estado** (Zustand — leve e simples)
4. **Integrar HomeScreen com dados reais** (primeiro fluxo completo)
5. **Implementar EventsScreen** (tela stub)
6. **Implementar MusicScreen** (tela stub)
7. **Completar ações** (confirmar, trocar, reservar, salvar perfil)
8. **Notificações push**
9. **Polimento de UX** (loading, erros, estados vazios)
10. **Testes e CI/CD**
