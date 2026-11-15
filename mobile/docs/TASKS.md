# Próximos passos

Revisado em 2026-11-11. Este é o backlog do mobile.
Comportamento atual em [CONTEXT](CONTEXT.md); execução e banco atual no [README](../README.md).

## Ajustes de navegação e filtros

- [ ] Usar barra inferior de abas nativa do iOS em `src/components/TabNavigator.tsx`.
  Conferir a opção compatível com as versões atuais de Expo/React Navigation antes de escolher
  a implementação; manter Android/web funcionando. Preservar Escalas como entrada, Salas,
  Músicas, Equipe somente no escopo autorizado, Perfil/notificações e destinos do stack.
  **Concluir:** conferir em iOS a barra nativa, troca de abas, área segura, teclado e
  retorno às telas; validar tipos, rotas de notificações e ausência de regressão no Android.
- [ ] Trocar a apresentação do filtro da tela inicial de Escalas por um modal centralizado,
  sem painel inferior nem animação de baixo para cima. Em
  `src/components/schedule/ScheduleMinistryFilter.tsx`, substituir `animationType="slide"`
  e alinhamento inferior por apresentação central com fade. Manter seleção atual,
  “Todos os ministérios”, indicador de filtro ativo, rolagem e fechamento ao selecionar,
  pelo X, toque fora e Voltar do Android. Preservar a combinação com busca e Próximas/Anteriores
  em `src/screens/app/ScheduleScreen.tsx`. **Concluir:** adaptar `tests/scheduleControls.test.ts`
  e `tests/scheduleScreens.test.ts`; conferir nomes longos, fonte ampliada e modal no celular.

## Validação pendente do mobile atual

Os componentes compartilhados, a identidade verde, o layout B de Escalas e o recorte de
simplificação já estão no código. As pendências abaixo são verificações; não implicam
refazer essas implementações. Comandos e alternativa para saída de testes bloqueada
estão no [README](../README.md).

- [ ] Conferir no Expo Go e no navegador a abertura direta em Escalas sem sessão em desenvolvimento,
  incluindo navegação entre abas e retorno após logout. Tipos e testes de navegação/autenticação
  passaram localmente; falta validar a interação no dispositivo.
- [ ] Validar em Android/iOS, com contas fictícias: login/troca de conta, Minhas/Gerenciadas,
  criação/montagem/confirmação, trocas/histórico/notificações, indisponibilidade, repertório,
  reservas, Equipe e Perfil/logout. Repetir rede lenta, erros e retorno à tela; conferir
  isolamento da sessão e releitura após falha parcial de edição de integrante/capabilities.
- [ ] Conferir foco/teclado, senha e máscaras, erros, campos de leitura e alinhamento vertical;
  nomes longos, listas extensas, fonte ampliada, toque e coerência da identidade visual.
  Em Escalas, conferir destaque da próxima escala e dos atalhos, filtro e criação para gestores.
- [ ] Conferir calendário, selects com muitas opções e rolagem, inclusive dentro de modais.
  Testar fechamento por X, toque fora e Voltar do Android; na reserva, Voltar deve fechar
  primeiro o select e depois o modal. Bundles e testes Node não validam interação nativa.
- [ ] Executar autorização SQL, aceites concorrentes e reservas simultâneas em ambiente
  de testes preparado, com dados fictícios. Conferir liderança fora do próprio ministério,
  confirmação, limite exato do início, histórico, audiência privada, edição de sala/repertório
  e notificações/logout. Mocks e inspeção textual não comprovam garantias do banco remoto.

## Refatorações do mobile — prontas para outro agente

Somente planejamento nesta rodada. Executar uma tarefa por vez, na ordem abaixo, sem alterar
produto, services, schema ou autenticação. Ler os arquivos indicados e as orientações do AGENTS.
As dependências de eventos/Supabase continuam até a migração; não antecipar contratos HTTP.

**Confirmado no codigo:** os fluxos já foram componentizados, mas `AssignmentPickerModal`
ainda mistura busca/listas com gravação; `MyScheduleParticipationCard` mantém o rascunho do
modal de troca; `MemberEditor` reconcilia quatro estados de edição separadamente;
`EventSetlistScreen` coordena persistência e busca/seleção do catálogo.

Preservar mensagens, estados vazios/erros, confirmações, escopo por ministério, capabilities,
bloqueio no instante de início, atualizações parciais e descarte por sessão/foco/requisição.
Refs de revisão, locks e atualização após escrita confirmada não são sobras. Não criar hooks,
repositories, interfaces ou um componente por linha de JSX para apenas mudar o código de lugar.

### R1 — separar seleção de integrantes e funções da gravação da escala

- [ ] Em `src/components/schedule/AssignmentPickerModal.tsx`, extrair
  `src/components/schedule/AssignmentMemberPicker.tsx` (busca local, lista, seleção e indicação
  de já escalado) e `src/components/schedule/AssignmentRolePicker.tsx` (lista de funções,
  seleção única e indicação de capability incompatível).
  O primeiro recebe `members`, `assignedMemberIds`, `selectedMemberId` e `onSelectMember`;
  o segundo recebe `roles`, `selectedRoleId`, `selectedMemberCapabilityRoleIds`, indicação
  de membro selecionado e `onSelectRole`. Manter `memberSearch` e seu filtro no primeiro.
  O modal mantém carregamento das opções, IDs selecionados, resumo e gravação com avisos.
  Reutilizar `getProfileInitials` de `src/utils/profileAvatar.ts`; remover aliases de setters
  sem comportamento próprio. Não mover permissão, validação de capability ou escrita para os pickers.
  **Concluir:** buscar não perde a seleção, pessoa já escalada não é selecionável, função
  incompatível não dispara seleção e erro de escrita mantém pessoa/função. Preservar o reset
  da busca quando a seleção volta a `null` após sucesso, mesmo se o modal continuar montado;
  fechar manualmente ou falhar não deve introduzir nova limpeza da busca/seleção.
  **Testes:** adaptar `tests/scheduleComponents.test.ts`; criar
  `tests/assignmentPickers.test.ts` para busca, seleção e bloqueios; manter
  `tests/profileAvatar.test.ts`. Cobrir aviso confirmado depois do início e opções atrasadas
  de outra visita/sessão. Sem dependência de outra refatoração.

### R2 — fazer o formulário de troca cuidar do próprio rascunho

- [ ] Em `src/components/schedule/RequestSwapModal.tsx`, colocar o rascunho
  `{ assignmentId, reason }`, candidatos e sua consulta/revisão. Receber atribuições e contexto
  de abertura; enviar os valores ao callback de submissão, sem repassar setters ao pai.
  Em `src/components/schedule/MyScheduleParticipationCard.tsx`, manter confirmação,
  consulta do pedido pendente, criação/cancelamento persistidos, estado de gravação e `onChanged`.
  Abrir inicia pela primeira atribuição e motivo vazio; trocar função invalida a consulta
  anterior imediatamente; erro de escrita mantém o formulário; apenas sucesso fecha e atualiza
  o pedido pendente. Invalidar candidatos ao fechar, perder foco ou trocar sessão.
  **Concluir:** pai apresenta participação e coordena operações persistidas; modal possui o
  formulário, sem uma nova camada de hook/service. Preservar aviso de troca pendente,
  histórico somente leitura, bloqueio no início e releitura de escrita concluída após refoco
  na mesma sessão; resposta de outra sessão não atualiza o pai.
  **Testes:** adaptar `tests/scheduleComponents.test.ts` e
  `tests/scheduleScreens.test.ts`; criar `tests/requestSwapModal.test.ts` para rascunho,
  reabertura, candidatos fora de ordem e invalidação. Manter `tests/scheduleParticipation.test.ts`
  e `tests/notificationPayload.test.ts`. Independente de R1; executar depois para limitar o diff.

### R3 — reunir o rascunho e a reconciliação do editor de integrante

- [ ] Em `src/components/ministry/MemberEditor.tsx`, reunir `selectedMember`, `selectedUser`,
  `selectedRoleIds` e `isLeader` em um único estado de rascunho. Inicialização, inclusão
  persistida e `reconcileEditor` substituem esse objeto juntos; edição de liderança/funções
  usa atualização funcional sem apagar os outros campos. Loading/erro e refs de lock/foco
  continuam separados. Não criar componente ou reducer genérico só para encapsular setters.
  **Concluir:** falha parcial relê e mostra exatamente o integrante persistido, sem manter
  simultaneamente modo de inclusão e edição; capability vazia continua sendo `[]`.
  Manter revalidação de liderança, remoção por RPC, confirmação expirada, histórico e lock
  compartilhado com `src/screens/app/ManageMinistryMembersScreen.tsx` até terminar a releitura.
  **Testes:** `tests/memberComponents.test.ts`, `tests/teamScreen.test.ts`,
  `tests/ministryService.test.ts`. Cobrir inclusão com falha de capabilities, releitura que
  falha e conclusão após refoco/troca de conta. Sem dependência de banco ou de R1/R2.

### R4 — tirar busca e seleção do catálogo da coordenação do repertório

- [ ] Criar `src/components/music/SetlistSongPicker.tsx` com busca local, filtro por
  música/artista e lista para adicionar. Receber `songs`, IDs já selecionados, `disabled`
  e `onAddSong`; manter busca/filtro no componente, sem consultar ou salvar dados.
  Em `src/screens/app/EventSetlistScreen.tsx`, conservar evento autorizado, catálogo carregado,
  persistido/rascunho, assinatura de alterações, gravação, releitura e proteção de saída.
  Reutilizar `src/components/music/SetlistEditor.tsx` para a lista ordenada existente.
  **Concluir:** selecionar música já incluída não duplica; busca não altera o rascunho;
  refresh/refoco/erro não o substituem. Preservar ordem, `song_key`, `null`, repertório vazio,
  descarte confirmado e diferença entre escrita falha e escrita salva sem releitura.
  A busca atual dura enquanto a tela está montada, inclusive ao cancelar/reabrir a edição.
  Preservar essa duração: o ramo `isLoading` atual desmonta o conteúdo, então manter o picker
  montado e oculto durante carregamento/consulta, mostrando-o somente na edição. Não limpar
  a busca ao cancelar ou iniciar outra edição da mesma tela.
  **Testes:** `tests/eventSetlistScreen.test.ts`, `tests/musicService.test.ts` e novo
  `tests/setlistSongPicker.test.ts` (busca, duplicidade e disabled). Independente das anteriores;
  manter o contrato por evento neste passo.

### Verificação e limite da refatoração

Após cada tarefa, executar `npx tsc --noEmit`, compilar pelo runner existente e rodar apenas
os testes indicados; ao terminar o conjunto, executar `npm test`. Exemplo para R1:

```sh
npm run test:build
node --test .tests-dist/tests/scheduleComponents.test.js .tests-dist/tests/assignmentPickers.test.js .tests-dist/tests/profileAvatar.test.js
```

Se houver `EPERM`, usar a alternativa do README com uma saída nova em `.expo` e os mesmos
nomes de testes. `tests/screenTestHelpers.ts` não renderiza os filhos: testar cada componente
extraído diretamente e, no pai, verificar props/callbacks; não apagar cenários para acomodar
a extração. Não introduzir framework. No celular, repetir os fluxos afetados com rede lenta,
voltar/refocar, erro, teclado e fonte ampliada, conforme a validação acima. Revisar diff/imports;
sem dados reais, mudanças de mensagens/tema ou código morto. Testes ainda não executados nesta rodada.

Não refatorar agora `CreateEventScreen`, `EventAudienceSection` ou `EventRoomSection`:
audência/sala já possuem estado próprio, e a migração retirará esse módulo. Salas já separa
`RoomReservationModal`/`CalendarModal`; manter consulta e revisão da data juntas em
`RoomsScreen`, sem outra extração motivada apenas pelo número de hooks.

## Integração com o novo backend

Banco, API e migração dos dados ficam no [TASK do backend](../../backend-node/docs/TASK.md).
As [regras de negócio](../../backend-node/docs/REGRAS_DE_NEGOCIO.md) são a referência única do produto.
O foco atual é a API; implementar estes fluxos no cliente depois de validar seus contratos no backend.

- [ ] Adaptar os services para HTTP por fluxo, preservando sessão, logout, tratamento de erros,
  falhas de SecureStore, descarte de respostas atrasadas e invalidação dos caches.
- [ ] Implementar o fluxo principal de criação mensal: ministério/mês, padrões de dias e horários,
  geração com exceções, edição de pessoas/funções e gravação em lote com IDs preservados.
- [ ] Integrar rascunho persistido e publicação pela API; mostrar ao autor avisos de conflito,
  preservar o trabalho em erro e só atualizar a equipe após confirmação do servidor.
- [ ] Oferecer edição individual e acréscimo de ocorrências conforme o contrato da API;
  após ajuste publicado, invalidar as consultas afetadas e apresentar os avisos correspondentes.
- [ ] Integrar presets de agenda e cópia de equipes, sem controle de vagas ou quantidades
  obrigatórias; tratar integrantes indisponíveis ou sem habilitação retornados pela API.
- [ ] Manter os cards pessoais e oferecer consulta mensal do ministério com os dados autorizados
  pela API; adaptar filtros e navegação sem duplicar registros entre visualizações.
- [ ] Validar a apresentação mensal no celular e a edição com recorte semanal; o layout exato
  e a escolha entre agenda/calendário permanecem abertos. O PDF é referência, não um layout obrigatório.
- [ ] Tratar repetição de requisições após falha de rede conforme o contrato de idempotência,
  preservando a intenção do comando; impedir toque repetido na UI não substitui a garantia da API.
- [ ] Adaptar os avisos e sugestões de integrantes, distinguindo rascunho, conflito bloqueante
  na publicação e avisos de dia indisponível conforme as regras compartilhadas.
- [ ] Retirar telas, services, audiência e vínculos de eventos depois de adaptar repertórios,
  reservas, notificações e bloqueios ao novo domínio.
- [ ] Retirar o SDK e a configuração do Supabase somente após validar autenticação, dados
  e notificações substitutos nos fluxos do cliente.

## Aprendizado aplicado ao mobile

- [ ] Contratos HTTP e DTOs: apresentar erros de autorização, conflito e publicação sem
  reproduzir as garantias de integridade do servidor em checks locais.
- [ ] Separar estado de edição, rascunho persistido e publicação; tratar respostas atrasadas,
  troca de sessão, caches e reenvios conforme o contrato da API.
- [ ] Entender acesso à API por celular/emulador: loopback depende do dispositivo;
  conferir rede, endereço do servidor e tratamento de falhas.

## Verificações pendentes

- [ ] Confirmar a execução dos testes do mobile no CI.
- [ ] Validar build de produção e variáveis públicas do Expo.
