# Tarefas do backend

Somente pendências; remover o que for concluído. Regras compartilhadas em [REGRAS_DE_NEGOCIO](REGRAS_DE_NEGOCIO.md).
Mobile e suas telas ficam em [TASKS do mobile](../../mobile/docs/TASKS.md); execução no [README](../README.md).

## Foco agora: API da escala mensal

- [ ] Validar `checkDatabaseConnection` em `src/db/client.ts` com o PostgreSQL de desenvolvimento disponível, confirmando `connected: 1`. Conceito: consulta real e propagação de erros.
- [ ] Validar o encerramento em `src/server.ts` com `Ctrl+C` e falha de inicialização (porta ocupada). Conceito: ciclo de vida do Fastify. Concluir: confirmar fechamento do PostgreSQL e saída com código `1` quando a inicialização falhar.
- [ ] Definir os contratos de geração por padrões de dias/horários e exceções, alterações em lote com IDs preservados, filtros de período e erros HTTP.
- [ ] Implementar autenticação/sessão e autorização no servidor: autoria do rascunho, leitura mensal por vínculo, feed pessoal por atribuição e gestão por liderança do ministério.
- [ ] Validar `insertSchedulePlan` em `src/modules/schedules/repository.ts` com o PostgreSQL local. A função recebe cliente/transação e os dados de persistência preparados pelo service e retorna o rascunho inserido. Conceito: `insert`, `returning` e valores gerados pelo banco. Concluir: verificar ID/estado/mês persistidos e rejeição de ministério/mês duplicado em transação de teste, desfazendo os dados fictícios ao final.
- [ ] Validar com PostgreSQL real o fluxo conectado handler → service → repository → banco para a criação do rascunho vazio.
  - Objetivo e arquivos. Em `routes.ts`, o handler recebe o DTO validado e o contexto autenticado, chama `createSchedulePlan` de `service.ts` e monta a resposta HTTP. O handler já chama o service e monta o DTO de resposta. O service restringe esta etapa a `occurrences: []`, prepara `referenceMonth` e chama `insertSchedulePlan`. O plugin recebe `db` e `authorizeMinistry`, que deve autenticar e verificar a gestão do ministério antes de fornecer o autor.
  - Conceito. Limites entre HTTP, tratamento da operação e acesso ao banco. O service prepara os dados da operação e o handler mapeia o resultado para o DTO de resposta. Tipos de persistência podem ser inferidos do schema Drizzle.
  - Verificação. Em teste isolado com contexto autorizado, acompanhar ministério/mês/autor até o registro gravado e conferir a resposta `201` com ID, ministério, mês e status. Rejeitar ocorrências não vazias até sua gravação estar implementada. O registro no servidor depende de autenticação e autorização.
- [ ] Criar somente `insertScheduleOccurrence` no mesmo `repository.ts`, recebendo a transação, plano, ministério e os dados de uma ocorrência. Conceito: FK e conversão de datas ISO para os valores de persistência. Concluir: verificar vínculo com o plano/ministério e preservar término ausente como `NULL` em transação de teste.
- [ ] Criar somente `insertScheduleOccurrenceAssignments` no mesmo `repository.ts`, recebendo a transação, ocorrência, ministério e a lista de participações. Conceito: inserção de várias linhas e unicidade da pessoa na ocorrência. Concluir: aceitar lista vazia e pessoas diferentes na mesma função; rejeitar a mesma pessoa repetida na ocorrência em transação de teste.
- [ ] Orquestrar a criação mensal em uma única transação usando as funções de persistência, gravando o rascunho sem avisos à equipe e retornando ao autor conflitos e integrantes alternativos elegíveis. As funções recebem a transação do chamador; não devem confirmar gravações separadamente. Habilitar a rota somente com autenticação e autorização.
- [ ] Proteger no banco os períodos publicados por ministério e por pessoa, inclusive na publicação concorrente, trocas e edições; usar 60 minutos sem término e permitir períodos consecutivos.
- [ ] Garantir vínculo e função habilitada, ocorrência dentro do mês do plano no fuso da igreja e alterações atômicas de equipe/funções; as FKs já mantêm plano/ocorrência/função no mesmo ministério.
- [ ] Implementar publicação transacional e idempotente, revalidando o conjunto e registrando os avisos sem duplicação.
- [ ] Implementar consultas autorizadas e edição individual imediata após publicação, com avisos e bloqueio no início da ocorrência.
- [ ] Testar permissões, rascunho privado sem ocupar horário, conflitos no próprio mês, duas publicações simultâneas, repetição da publicação e limites exatos de horário; executar no CI.

## Fluxo inicial da API — proposto

O handler em `src/modules/schedules/routes.ts` está conectado a `createSchedulePlan` e `insertSchedulePlan` para criar um rascunho vazio e devolver `201`. O plugin recebe o cliente/transação em `db` e a função `authorizeMinistry`, responsável pela autenticação e autorização do autor. A validação com PostgreSQL real está pendente. O registro em `server.ts` depende da implementação dessa autorização. As demais rotas são propostas.

Contrato de criação do rascunho mensal:

- URL: `ministryId`.
- Corpo mensal: `month` e `occurrences[]`.
- A ocorrência recebe `startAt`, `endAt`, `notes` e `assignments[]`.
- Participação: `userId` e `positionId`.
- Resposta mínima da criação: `id`, `ministryId`, `month` e `status: "draft"`.
- Erros da criação. `400` para entrada inválida ou ocorrências ainda não suportadas, `401`/`403` para falhas de autenticação/autorização, `409` para ministério/mês duplicado e `500` com mensagem genérica para falhas inesperadas.

`occurrences` e `assignments` são obrigatórios e aceitam `[]`. Observações e término podem ser omitidos. Os horários exigem `Z` ou um offset explícito e aceitam até três casas decimais nos segundos. Cada pessoa aparece no máximo uma vez por ocorrência. As observações passam por `trim()` e aceitam texto vazio.

| Rota | Responsabilidade |
| --- | --- |
| `POST /ministries/:ministryId/schedule-plans` | Criar o rascunho mensal e suas ocorrências iniciais. |
| `GET /ministries/:ministryId/schedule-plans?month=YYYY-MM` | Consultar o mês: publicado para integrantes; rascunho somente para o autor. |
| `PATCH /schedule-plans/:planId` | Salvar alterações em lote no rascunho, preservando os IDs existentes. |
| `POST /schedule-plans/:planId/publish` | Publicar com validação do conjunto, concorrência e idempotência. |
| `POST /schedule-plans/:planId/occurrences` | Acrescentar uma ocorrência individual; comportamento em mês já publicado ainda a definir. |
| `PATCH /schedule-occurrences/:occurrenceId` | Editar uma ocorrência no escopo autorizado; depois de publicada, aplicar e avisar ao salvar. |
| `GET /me/schedule-occurrences?from=...&to=...` | Consultar somente as próprias ocorrências publicadas no período. |

Começar pela conexão real e pelo contrato de criação do rascunho; habilitar os endpoints somente com autorização. Uma VIEW SQL é opcional para reutilizar consultas, não um requisito das visualizações.

## Demais entregas

- [ ] Persistir presets de agenda e modelos de equipe por ministério; aplicar sem copiar confirmações e revalidar as novas datas, sem controle de vagas.
- [ ] Implementar recuperação de acesso e os fluxos restantes de equipe, confirmação, trocas, indisponibilidade, salas e músicas com validação de entrada/saída.
- [ ] Traduzir `23P01` da constraint `room_reservations_no_overlap` em HTTP 409 e testar o fluxo pela API.
- [ ] Entregar notificações internas e substituir a dependência de realtime do Supabase.

## Aprendizado na API

- [ ] Modelagem: escala mensal, ocorrência, atribuição, relações N:M, PK/FK/UNIQUE, chaves compostas e o motivo de repetir `ministry_id` para integridade.
- [ ] Drizzle: schemas, migrations versionadas e cliente em execução; separar configuração da CLI e conexão da API.
- [ ] Fastify: rotas/plugins, hooks, validação, DTOs, tipos inferidos e respostas de erro sem expor dados internos. Referência: [rotas](https://fastify.dev/docs/latest/Reference/Routes/).
- [ ] Concorrência: dois comandos diferentes disputando a mesma pessoa/horário; estudar constraints, travas, isolamento e [transações](https://www.postgresql.org/docs/current/tutorial-transactions.html). Exercício: duas conexões tentando publicar planos conflitantes.
- [ ] Idempotência: repetir o mesmo comando após timeout sem duplicar os efeitos ou avisos. Estudar estado da operação, deduplicação e eventual chave de idempotência; `POST` não oferece essa garantia automaticamente. Exercício: repetir a publicação e conferir um único efeito. Referência: [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2).
- [ ] Rede e datas: portas do Compose, loopback/WSL/container, conexão do mobile à API, mês civil versus instante, fuso local e intervalos com término exclusivo.
- [ ] Testes de integração: usar banco real, sessões distintas e falhas/reenvios para verificar autorização e persistência; testes HTTP com `app.inject`.

## Definir

- [ ] Histórico mensal: apenas meses anteriores ou versões do mesmo mês; nenhuma revisão privada foi modelada para ajustes individuais.
- [ ] Exceções de acesso a rascunhos para outros líderes/administradores e inclusão de ocorrência em mês já publicado.
- [ ] Contrato dos presets: persistência, edição, escopo e aplicação; definir se alternativas entre pessoas são apenas indecisão do rascunho ou um recurso próprio.
- [ ] Entrada de pessoas e transição das contas; permissões de catálogos, tons por cantor e reservas de salas.
- [ ] Definir quais estados de participação ocupam horário em ocorrências publicadas, inclusive durante trocas.
- [ ] Avaliar a remoção da coluna `title` de `schedule_occurrences` em uma migration própria.
- [ ] Hospedagem do servidor e do banco.

## Migração do Supabase

- [ ] Inventariar dados, policies, RPCs, triggers, duplicidades e constraints pendentes de validação.
- [ ] Mapear perfis, vínculos, funções e permissões, preservando identificadores e histórico quando possível.
- [ ] Converter horários dos eventos em ocorrências e agrupá-las por ministério/mês; definir o destino dos repertórios compartilhados e preservar reservas ao retirar vínculos com eventos.
- [ ] Preservar autores de trocas quando recuperáveis; tratar autoria desconhecida e conflitos históricos sem inventar informações.
- [ ] Validar transferência e autorização em cópia de teste; preparar recuperação e corte de acesso antes de desativar o Supabase.

## Futuras features

- [ ] Permitir ao administrador configurar a duração presumida, preservando a duração adotada nas ocorrências existentes.
- [ ] Entrega de notificações por push.
- [ ] Várias igrejas com isolamento de dados e permissões.
