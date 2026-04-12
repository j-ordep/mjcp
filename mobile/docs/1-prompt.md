Problema Identificado
A estrutura de navegação anterior tinha redundância e causava confusão:

A Home exibia "Escalas" com uma lista completa de eventos do usuário
Havia um botão "Ver Eventos" que levava para uma tela de "Eventos da Igreja"
Não ficava clara a diferença entre "minhas escalas" e "eventos gerais da igreja"
A Home tinha dupla função: dashboard + lista completa
Solução Implementada
Reorganizamos a arquitetura de navegação seguindo o padrão dashboard-hub:

Nova Estrutura de Telas:
1. HomeScreen (Dashboard):

Funciona como hub central de navegação
Exibe resumo das próximas 2 escalas do usuário
Exibe resumo dos próximos 2 eventos da igreja
4 cards de ação rápida em grid 2x2:
"Escalas" (preto/destaque)
"Eventos da Igreja" (branco/borda)
"Bloquear Datas" (branco/borda)
"Trocas" (branco/borda)
Header com saudação "Bem-vindo de volta" + título "Dashboard"
Botão de notificações e foto de perfil
2. ScheduleScreen (Nova tela):

Lista completa de eventos onde o usuário está escalado
Campo de busca para filtrar escalas
Cards de eventos com ações de confirmar/trocar
Acessível via tab bar ou card do dashboard
3. EventsScreen:

Mantém calendário mensal integrado
Mostra todos os eventos da igreja (escalado ou não)
Acessível apenas pelo card do dashboard (não está na tab bar)
Tab Bar (5 abas):
Início (Home icon) - Dashboard
Escalas (Calendar icon) - lista completa das escalas do usuario
Salas (DoorOpen icon) - Locação de salas
Músicas (Music icon) - Biblioteca de músicas
Perfil (User icon) - Perfil do usuário
Arquivos Criados/Modificados:
Criado:
/components/ScheduleScreen.tsx - Tela dedicada para lista completa das escalas do usuario
Modificados:
/components/HomeScreen.tsx - Transformada em dashboard com resumos e cards de navegação
/components/TabBar.tsx - Adicionada nova aba "Escalas" entre "Início" e "Salas"
/App.tsx - Atualizada lógica de navegação com novo screen type 'schedules' e handlers
Fluxo de Navegação:
A partir do Dashboard (Home):
Clicar em "Escalas" → ScheduleScreen (tambem ativa a tab "Escalas")
Clicar em "Eventos da Igreja" → EventsScreen (modal/overlay)
Clicar em "Bloquear Datas" → BlockDatesScreen (modal/overlay)
Clicar em "Trocas" → card inativo; acesso principal migra para `ScheduleScreen`
Clicar em evento do resumo → EventDetailsScreen
Clicar em "Ver todas" (escalas) → ScheduleScreen
Clicar em "Ver todos" (eventos) → EventsScreen
A partir da Tab Bar:
Tab "Escalas" → Vai direto para ScheduleScreen
Benefícios da Nova Arquitetura:
✅ Elimina redundância (Home não é mais lista completa) ✅ Propósito claro para cada tela ✅ Dashboard como hub central (padrão Pinterest/YouVersion) ✅ Distinção clara entre "minhas escalas" vs "eventos da igreja" ✅ Navegação intuitiva com múltiplos pontos de acesso
