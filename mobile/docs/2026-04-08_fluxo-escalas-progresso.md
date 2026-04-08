# Fluxo de Escalas - Progresso

Data: 2026-04-08 (America/Sao_Paulo)

## Objetivo desta rodada

Separar a criacao de escala da edicao operacional, reduzir a sobrecarga visual da tela de edicao e alinhar o hub de escalas para mostrar melhor o que importa para cada perfil.

## Alteracoes implementadas

- `CreateScheduleScreen` passou a cuidar apenas da criacao do contexto da escala.
- `EditScheduleScreen` foi criada como tela dedicada para montagem da equipe.
- `MySchedulesScreen` passou a abrir `EditSchedule` para escalas gerenciaveis.
- O store de escalas foi ajustado para trabalhar com cards por `schedule`, em vez de uma lista achatada por assignment.
- O service de escalas ganhou leituras e operacoes para:
  - listar escalas gerenciaveis
  - listar escalas do usuario
  - carregar detalhes de uma escala
  - remover assignments
- A tela de editar escala foi simplificada para focar em:
  - adicionar membro
  - remover assignment
  - abrir gestao de membros do ministerio
  - revisar status pendente/confirmado

## Decisoes de produto/UX assumidas

- `CreateScheduleScreen` nao monta equipe; apenas cria a escala.
- `EditScheduleScreen` e full-screen, nao modal.
- O topo da edicao foi reduzido ao minimo para nao competir com a montagem da equipe.
- O card de `Minhas Escalas` nao deve usar o campo `Funcao` para mostrar metricas operacionais.
- Quando existir assignment do usuario naquela escala, o card deve mostrar apenas a(s) funcao(oes) dele.
- Quando nao existir assignment do usuario no card, o campo `Funcao` deve ficar oculto.

## Pensamentos e criterio usados

- A tela de edicao estava com cara de reaproveitamento do Step 1, o que deixava a UX menos clara. A simplificacao foi pensada para deixar evidente que essa tela e operacional.
- A contagem de pessoas escaladas e util em contexto administrativo, mas nao combina com o label `Funcao`; por isso foi removida como fallback visual do card.
- A troca de `event_id` e `ministry_id` de uma escala existente nao foi liberada nesta rodada. Isso pode exigir regra adicional por causa dos assignments ja salvos e nao havia evidencia suficiente no repo para assumir um comportamento seguro.

## Estado atual confirmado

- Admin pode criar e gerenciar escalas.
- Lider pode criar e gerenciar escalas do proprio ministerio.
- A edicao operacional da equipe funciona em tela dedicada.
- O card de `Minhas Escalas` foi ajustado para priorizar a funcao do usuario.

## Pendencias e proximos pensamentos

- Confirmar em uso real se todos os cenarios de lider/admin tambem recebem `my_assignments` quando estiverem escalados.
- Avaliar se o topo de `EditScheduleScreen` pode ficar ainda mais enxuto, com resumo visual pequeno do evento e ministerio.
- Conectar confirmacao de presenca e fluxo de troca, que continuam fora deste recorte.
