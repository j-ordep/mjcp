# Próximos passos

Revisado em 2026-10-21. Este é o único backlog.
Produto e regras em [CONTEXT](CONTEXT.md); execução e banco atual no [README](../README.md).

## Padronização com React Native Reusables

Implementado: componentes locais `Text`, `Input`, `Textarea`, `Label`, `Button`, `Checkbox`,
`Switch`, `Separator` e `SelectField`, adaptados do React Native Reusables com licença preservada.
Textos e campos das telas usam a base compartilhada; categorias e ministérios simples usam select.
Busca/seleção múltipla, refs, máscaras, callbacks e contratos permanecem nos fluxos existentes.
Tokens e portals seguem NativeWind 4; reserva possui portal próprio e Voltar fecha primeiro o select.
Paper permanece em avatares, cartões, chips e notificações; não foi removido como dependência.

Correção visual: buscas de Escalas, Músicas, Eventos e repertório usam apenas a caixa do `Input`,
sem fundo no rótulo nem bordas duplicadas. `fieldClassName` separa aparência da caixa e espaçamento
externo. Textos respeitam a altura natural da fonte; botão cresce com o rótulo e select limita
texto longo antes da seta. Preservados callbacks, filtros e persistência.

Alinhamento vertical do `Input`: campos de uma linha têm altura de 48, alinhamento central,
sem altura de linha imposta nem padding extra de fonte no Android. Inclui campos de leitura
que abrem calendário (data da agenda de Salas); textareas mantêm o início no topo.

Verificado em 2026-10-12 após as correções: TypeScript, 352 testes Node e bundles Android/web passaram.
`npm test` ainda encontra `EPERM` na saída `.tests-dist`; a mesma configuração passa
usando uma pasta nova em `.expo`, conforme o README. Nenhuma alteração de banco neste ciclo.

Preparação do PR em 2026-10-20: TypeScript e `npm test` passaram em uma cópia limpa dos
arquivos preparados para commit (352 testes), sem alterações locais de autenticação ou banco.
Revisões de código concluídas sem problemas impeditivos. A conferência em dispositivo permanece
pendente; o PR de interface fica em rascunho. Escalas independentes de eventos continuam futuras.

- [ ] Conferir no celular: foco/teclado, senha e máscaras; erros e campos de leitura; selects
  com muitas opções, rolagem, fonte ampliada e fechamento; categoria da reserva dentro do modal
  (Voltar primeiro fecha o select, depois a reserva). Conferir Android/iOS; bundles não validam UI.

## Refinamento da tela de Escalas

Direção B aprovada em 2026-10-21: próxima escala em destaque e cartões espaçados, atalhos compactos,
busca ao lado do filtro de ministério e criação no rodapé para gestores. Dados continuam reais;
o protótipo visual não altera o vínculo com eventos nem as ações disponíveis no detalhe.

Implementado: `ScheduleListCard` apresenta data/horário locais com ano, ministério, evento,
função e situação. Só a primeira próxima escala dos resultados filtrados recebe destaque;
histórico usa cartões neutros. `ScheduleSummaryCard` permanece nos formulários/detalhes.
`ScheduleActions` concentra os dois atalhos; o filtro mantém seu modal e a criação fica no
rodapé, com o escopo existente. Filtros, ordenação, refresh, erros e descarte de respostas
antigas foram preservados.

Verificado em 2026-10-21: TypeScript, 359 testes Node e exportações Android/web passaram.
Conferência web dos componentes reais com dados fictícios em larguras de 320 e 390 pixels:
sem transbordamento horizontal; seleção de ministério atualiza a lista e fecha o modal.
Essa conferência não valida teclado, fonte ampliada ou comportamento nativo Android/iOS.

- [ ] Conferir no celular o destaque das ações, nomes longos, lista extensa, fonte ampliada,
  teclado e fechamento do modal pelo X, toque fora e voltar do Android.

## Identidade verde em todo o mobile

Direção aprovada: aplicar a identidade da opção B às telas existentes, com referência
shadcn/Reusables, usando NativeWind e Paper atuais. Verde floresta nas ações e destaques,
fundo claro, superfícies brancas, bordas suaves e cores semânticas próprias para avisos/erros.

Implementado: tokens semânticos compartilhados entre NativeWind, estilos nativos, Paper e
navegação; botões, campos, cabeçalhos e seletores coerentes. `Card` e `Badge` consolidam
superfícies e metadados repetidos. Todas as 18 telas, calendários e modais usam a paleta;
cartões de destaque mantêm texto claro. Alinhamento, refs, estados e ações foram preservados.

Verificado em 2026-10-21: TypeScript, 360 testes Node e exportações Android/web passaram.
Pares de texto da paleta atendem contraste AA (4,5:1). Prévia web exportada com consultas
substituídas por dados fictícios: abas, calendário e seletor de categorias conferidos;
Equipe sem transbordamento horizontal em 320 pixels. Essa prévia não valida o ambiente remoto.

- [ ] Conferir em Android/iOS a identidade, fonte ampliada, toque, teclado, calendário e
  seletores em modais. Exportações e testes Node não comprovam layout/interação nativos.

Escopo exclusivamente visual: nenhuma mudança em services, stores, contratos, banco ou backend.

## Validação do ciclo de simplificação

Implementado no mobile com o Supabase existente: isolamento de sessão e descarte de respostas
antigas; Escalas como entrada (Minhas/Gerenciadas); participação no detalhe; Trocas com Histórico;
Perfil/notificações no cabeçalho; Eventos de apoio; repertório compartilhado por evento em tela
própria; Salas sem contadores; Equipe com escopo confirmado e releitura em falhas parciais.
Home/YouTube e código sem consumidores foram retirados. Sem alterações de banco ou aplicação remota.

Montagem e participação/troca da escala, editor/busca de integrante e audiência/sala do
formulário de evento agora possuem componentes com estado próprio. As telas mantêm contexto,
dados compartilhados e atualização geral; contratos, mensagens, debounce e descarte de respostas
antigas permanecem preservados. Não foram adicionadas camadas genéricas ou dependências.

- [ ] Validar no celular com contas fictícias: login/troca de conta, Minhas/Gerenciadas,
  criação/montagem/confirmação, trocas/histórico/notificações, indisponibilidade, repertório,
  reservas, Equipe e Perfil/logout. Repetir rede lenta, erros, retorno à tela, teclado e modais.
- [ ] Validar aceites concorrentes e reservas simultâneas em ambiente de testes já preparado.
  Mocks e inspeção textual de migrations não comprovam concorrência no banco remoto.

Comandos e alternativa para saída de testes bloqueada estão no README.
Verificado em 2026-10-11: `npx tsc --noEmit` passou; 338 testes Node passaram.
`npm test` passou em uma cópia limpa do conteúdo preparado para o PR. Na pasta de trabalho,
`.tests-dist` encontrou `EPERM`; a mesma configuração passou usando uma pasta nova de `.expo`.
Revisões de código concluídas;
validação em dispositivo, SQL de autorização, CI e ambiente remoto não executados neste ciclo.

## Dependência de banco, fora deste ciclo

- [ ] Salvar alterações de integrante/capabilities de forma atômica. Hoje a substituição de
  capabilities apaga antes de inserir; uma falha pode perder as funções anteriores e deixar edição parcial.
- [ ] Dar data, horário e identificação próprios às escalas de cada ministério.
  Migrar os dados atuais preservando equipe, confirmações, trocas e histórico.
- [ ] Ligar repertórios às escalas de louvor e manter a agenda de salas independente.
  Resolver os vínculos atuais com eventos sem perder repertórios ou reservas.
- [ ] Retirar telas, services, permissões de audiência/gestão e estruturas de eventos somente
  depois de adaptar dependências, notificações e bloqueios ao horário da escala.
- [ ] Implementar tom preferido por música/cantor e cantor/tom por item do repertório,
  preservando a execução histórica quando uma preferência mudar.
- [ ] Registrar o solicitante original de uma troca para atribuir autoria histórica com segurança.
- [ ] Avaliar restrição adicional de leitura por ministério; esconder a gestão na UI não altera RLS.

Melhorias exclusivas do módulo antigo de eventos foram retiradas da fila:
exclusão na UI, mensagens do formulário e índice de listagem.

## P2 — migrar Supabase para Fastify e PostgreSQL

Direção aprovada; backend Fastify e integração HTTP ainda não implementados.

- [ ] Definir autenticação, transição de contas/sessões e recuperação de acesso;
  substituir Supabase Auth e decidir hospedagem do servidor/banco.
- [ ] Criar API Fastify/TypeScript com PostgreSQL, validação de entrada, autenticação
  e autorização por usuário/ministério, com organização simples.
- [ ] Migrar as features por etapas e adaptar os services do mobile para HTTP.
  Preservar constraints, transações, concorrência, proteção de perfis e leitura histórica.
- [ ] Substituir notificações/realtime do Supabase e validar isolamento entre sessões.
- [ ] Validar permissões e fluxos com dados fictícios; testar aceites concorrentes,
  reservas sobrepostas e limite exato do horário de início na nova implementação.
- [ ] Conferir migração dos dados, recuperação/retorno ao ambiente anterior e corte de acesso
  ao Supabase; só então remover SDK, configuração e proteções que tiverem sido substituídas.

## PENDENTE DE DEFINICAO

| Tema | Decisão |
| --- | --- |
| Entrada de pessoas | Convite, cadastro administrativo ou cadastro livre; o convite foi recomendado, ainda não decidido |
| Músicas | Quem cadastra músicas, altera tons preferidos e escolhe cantor/tom no repertório |
| Catálogos | Permissões e manutenção mínima de ministérios, funções, salas e músicas |
| Escalas | Regra de unicidade dentro do ministério, identificação obrigatória/opcional e migração de repertório hoje compartilhado |
| Nova infraestrutura | Solução de autenticação, hospedagem, entrega de notificações e ferramenta de acesso/migrations do PostgreSQL |

Trocas continuam sem aprovação e conflitos de escala/indisponibilidade continuam avisos.
Mudanças nessas regras, recusa na UI e push externo dependem de necessidade confirmada.

## INFORMACAO INSUFICIENTE — verificações pendentes

- [ ] Conferir migrations remotas, inconsistências históricas, duplicidades e constraints
  `NOT VALID` antes de saneamento/validação ou migração de dados.
- [ ] Confirmar estratégia e execução de testes no CI e validar os fluxos completos em Android/iOS.
  O app abrir no celular não confirma todos os fluxos; conferir também teclado e modais.
- [ ] Validar build de produção e a configuração das variáveis públicas do Expo;
  o bundle Android verificado neste ciclo foi de desenvolvimento.

Ao concluir trabalho, remova a pendência. Não crie outro roadmap, plano histórico ou backlog Markdown.
