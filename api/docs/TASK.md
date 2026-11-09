# Tarefas do backend

Somente pendências; remover o que for concluído. Regras compartilhadas em [REGRAS_DE_NEGOCIO](REGRAS_DE_NEGOCIO.md).
Mobile e suas telas ficam em [TASKS do mobile](../../mobile/docs/TASKS.md); execução no [README](../README.md).

## Foco agora: API da escala mensal

- [ ] Validar `checkDatabaseConnection` em `src/db/client.ts` com o PostgreSQL de desenvolvimento disponível, confirmando `connected: 1`. Conceito: consulta real e propagação de erros.
- [ ] Validar o encerramento em `src/server.ts` com `Ctrl+C` e falha de inicialização (porta ocupada). Conceito: ciclo de vida do Fastify. Concluir: confirmar fechamento do PostgreSQL e saída com código `1` quando a inicialização falhar.
- [ ] Completar os contratos de entrada/saída com ocorrências, equipe, geração por padrões de dias/horários e exceções, alterações em lote com IDs preservados, filtros de período, precisão dos horários (a comparação atual com `Date.parse` considera milissegundos) e erros HTTP.
- [ ] Implementar autenticação/sessão e autorização no servidor: autoria do rascunho, leitura mensal por vínculo, feed pessoal por atribuição e gestão por liderança do ministério.
- [ ] Criar somente `insertSchedulePlan` em `src/modules/schedules/repository.ts`, recebendo a transação, ministério, autor e mês; persistir `schedule_plans` como rascunho, converter o mês para o primeiro dia e retornar o registro inserido. Conceito: `insert`, `returning` e valores gerados pelo banco. Concluir: verificar ID/estado/mês persistidos e rejeição de ministério/mês duplicado em transação de teste.
- [ ] Criar somente `insertScheduleOccurrence` no mesmo `repository.ts`, recebendo a transação, plano, ministério e os dados de uma ocorrência. Conceito: FK e conversão de datas ISO para os valores de persistência. Concluir: verificar vínculo com o plano/ministério e preservar término ausente como `NULL` em transação de teste.
- [ ] Criar somente `insertScheduleOccurrenceAssignments` no mesmo `repository.ts`, recebendo a transação, ocorrência, ministério e a lista de participações. Conceito: inserção de várias linhas e unicidade da pessoa na ocorrência. Concluir: aceitar lista vazia e pessoas diferentes na mesma função; rejeitar a mesma pessoa repetida na ocorrência em transação de teste.
- [ ] Orquestrar a criação mensal em uma única transação usando as funções de persistência, gravando o rascunho sem avisos à equipe e retornando ao autor conflitos e integrantes alternativos elegíveis. As funções recebem a transação do chamador; não devem confirmar gravações separadamente. Habilitar a rota somente com autenticação e autorização.
- [ ] Proteger no banco os períodos publicados por ministério e por pessoa, inclusive na publicação concorrente, trocas e edições; usar 60 minutos sem término e permitir períodos consecutivos.
- [ ] Garantir vínculo e função habilitada, ocorrência dentro do mês do plano no fuso da igreja e alterações atômicas de equipe/funções; as FKs já mantêm plano/ocorrência/função no mesmo ministério.
- [ ] Implementar publicação transacional e idempotente, revalidando o conjunto e registrando os avisos sem duplicação.
- [ ] Implementar consultas autorizadas e edição individual imediata após publicação, com avisos e bloqueio no início da ocorrência.
- [ ] Testar permissões, rascunho privado sem ocupar horário, conflitos no próprio mês, duas publicações simultâneas, repetição da publicação e limites exatos de horário; executar no CI.

## Fluxo inicial da API — proposto

Rotas ainda não implementadas; payloads serão fechados antes de codificar. `schedule_plans` guarda o mês; `schedule_occurrences` guarda cada ocorrência, com atribuições e repertório próprios.

Mapa do contrato de criação mensal, ainda em construção:

- URL: `ministryId`.
- Corpo mensal: `month` e `occurrences[]`.
- Ocorrência: `title`, `startAt`, `endAt`, `notes` e `assignments[]`.
- Participação: `userId` e `positionId`.
- Resposta mínima da criação: `id`, `ministryId`, `month` e `status: "draft"`.

Os validadores atuais cobrem ministério, mês, horários, participações (`userId`/`positionId`), título e observações. `occurrences` e `assignments` são obrigatórios e aceitam `[]`; título, observações e término podem ser omitidos. Título e observações têm espaços removidos das extremidades; título informado exige conteúdo e observações podem ser vazias.

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
