# AGENTS.md - Guia Operacional de Agentes (MJCP Mobile)

## 1) Objetivo do agente
- Atuar como engenheiro de software para evoluir o app `MJCP Mobile` com foco em valor de produto, seguranca e consistencia tecnica.
- Trabalhar com base em evidencias do repositorio, sem inventar regras de negocio.
- Priorizar o fluxo principal do produto: eventos, escalas, atribuicoes, confirmacao e trocas.

## 2) Fonte de dados (ordem de confianca)
- Fonte primaria:
  - `supabase/migrations/*.sql` (modelo de dados, constraints e RLS realmente aplicadas)
  - `src/` (comportamento implementado de fato)
- Fonte secundaria (documentacao e planejamento):
  - `docs/CONTEXT.md`
  - `docs/system_design.md`
  - `docs/scheduling_model.md`
  - `docs/ROADMAP.md`
  - `docs/TASKS.md`
- Se houver conflito entre docs e codigo/migration:
  - considerar codigo + migrations como verdade atual
  - registrar divergencia no PR/entrega

## 3) Processo de analise
- Passo 1: Ler as migrations relevantes da feature antes de alterar servicos/telas.
- Passo 2: Confirmar no `src/services` e `src/screens` se o fluxo esta implementado ou apenas planejado.
- Passo 3: Identificar lacunas usando tags reais (`TODO`, `em breve`, placeholders).
- Passo 4: Consolidar decisoes em mudancas pequenas, testaveis e reversiveis.
- Passo 5: Validar impacto de permissao (RLS) antes de concluir.

## 4) Organizacao da informacao
- Separar sempre:
  - `Confirmado no codigo`
  - `PENDENTE DE DEFINICAO`
  - `INFORMACAO INSUFICIENTE`
- Evitar duplicacao:
  - nao repetir backlog em multiplos arquivos sem motivo
  - atualizar `docs/TASKS.md` quando mudar prioridade relevante
- Registrar decisoes de arquitetura apenas quando houver evidencias no repo.

## 5) Regras de negocio identificadas (confirmadas)
- Dominio principal:
  - gestao de igreja/ministerio com eventos, escalas e membros.
- Perfis:
  - `admin`, `leader`, `member` em `profiles.role`.
- Modelo de escalas:
  - `capability` em `ministry_member_roles` (o que o membro sabe fazer)
  - `assignment` em `schedule_assignments` (o que o membro fara no evento)
- Permissoes em alto nivel:
  - admin gerencia tudo
  - lider gerencia escalas/assignments do proprio ministerio (policy adicionada em `20260312000103_add_leader_policies.sql`)
  - membro atualiza apenas seu assignment (confirmacao/estado)
- Evento em dois modos de visualizacao:
  - card simples quando usuario nao esta escalado
  - card detalhado quando usuario esta escalado

## 6) Diretrizes tecnicas identificadas (confirmadas)
- Stack:
  - React Native + Expo + TypeScript + Supabase + Zustand.
- Arquitetura:
  - regra de negocio deve viver no service layer (`src/services`)
  - banco usado para armazenamento, integridade e RLS
- Estado atual do codigo:
  - autenticacao Supabase ja existe de forma parcial (`authService`, `AppNavigator`, `useAuthStore`)
  - `CreateScheduleScreen` ainda placeholder
  - confirmacao/troca ainda com `TODO` nas telas
- Tipagem:
  - `src/types/database.types.ts` esta vazio no estado atual (lacuna tecnica).

## 7) Seguranca e dados sensiveis (obrigatorio)
- Nunca commitar:
  - senhas, tokens, chaves, PII, URLs privadas de infra.
- Se precisar documentar exemplos, usar placeholders:
  - `EXPO_PUBLIC_YOUTUBE_API_KEY=******`
  - `EXPO_PUBLIC_SUPABASE_URL=https://******.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=******`
- Ao encontrar segredo no repo:
  - nao replicar em docs
  - mascarar imediatamente na comunicacao
  - recomendar rotacao da credencial exposta
- Seeds devem conter apenas dados ficticios e anonimizados.

## 8) Boas praticas de engenharia
- DRY:
  - extrair logica compartilhada para services/stores, evitando duplicacao entre telas.
- KISS:
  - preferir mudancas pequenas e diretas antes de abstrair.
- SOLID:
  - manter responsabilidade unica por modulo (tela renderiza, service aplica regra, migration define estrutura).
- Separacao de responsabilidades:
  - UI nao deve conter regra de permissao critica; backend (RLS/RPC) deve ser fonte de verdade.
- Clareza de dominio:
  - manter nomenclatura consistente entre ministerio, role, capability e assignment.

## 9) Regras de decisao
- Antes de implementar feature de escala:
  - validar RLS e constraints relacionados em migrations.
- Antes de liberar acao para lider no frontend:
  - confirmar se backend ja bloqueia acesso fora do ministerio do lider.
- Quando docs e codigo divergirem:
  - priorizar comportamento implementado
  - abrir item em `docs/TASKS.md` para ajuste documental/tecnico.
- Evitar "feature pronta" apenas por UI:
  - considerar pronta somente com persistencia, permissao e tratamento de erro.

## 10) Tratamento de incerteza (explicito)
- Sempre marcar como `PENDENTE DE DEFINICAO` quando houver decisao de produto sem regra fechada.
- Sempre marcar como `INFORMACAO INSUFICIENTE` quando faltar evidencia no repo.
- Nao inferir por conta propria:
  - se nao existir migration, service ou fluxo implementado/documentado com clareza, declarar desconhecido.
- Itens atualmente com incerteza:
  - `PENDENTE DE DEFINICAO`: fluxo final de aprovacao de `swap_requests` (quem aprova e em qual ordem).
  - `PENDENTE DE DEFINICAO`: politica final de conflitos de horario (somente warning vs bloqueio em casos especificos).
  - `INFORMACAO INSUFICIENTE`: estrategia oficial de testes automatizados (unitario/integracao/E2E) em execucao no CI.

## 11) Atualizacao continua
- Sempre que alterar regra de permissao, atualizar:
  - migrations relevantes
  - service afetado
  - backlog em `docs/TASKS.md` (se houver impacto de planejamento)
- Sempre que concluir uma lacuna importante, remover o marcador de pendencia correspondente.
- Revisar este arquivo em toda entrega que envolva:
  - autenticacao/autorizacao
  - dados sensiveis
  - mudancas de dominio (eventos, escalas, ministerios, membros).
