# Tarefas do backend

Somente pendências; remover o que for concluído. Regras compartilhadas em [REGRAS_DE_NEGOCIO](REGRAS_DE_NEGOCIO.md).
Mobile e suas telas ficam em [TASKS do mobile](../../mobile/docs/TASKS.md); execução no [README](../README.md).

## Foco agora: API da escala mensal

### Modelo atual — datas civis e persistência

Regra confirmada: conflito por pessoa/data, uma ocorrência por ministério/data e
bloqueio de edição, confirmação e troca somente após o fim do dia em `America/Sao_Paulo`.
Horário opcional é informativo. Reservas de salas continuam com início e término.

DTO, schema e migration usam `date` e `time` opcional. O Supabase recebeu as 16 tabelas
exportadas do schema da API; contas e catálogos foram mantidos, e os planos iniciam vazios.
Eventos, escalas e trocas antigos de teste foram descartados com autorização do usuário.
As regras de negócio serão executadas na API TypeScript, usando o repository para consultas
e transações. Não criar funções/triggers de negócio de escalas no SQL.
O acesso direto do cliente às novas tabelas está fechado; somente o próprio perfil continua
legível pelo SDK para manter o login. A integração HTTP do mobile ainda está pendente.

Fluxo em foco — o líder prepara uma escala mensal em rascunho, salva e consegue continuar seu preenchimento depois. As microentregas acompanham uma ação completa pela API.

- [ ] Validar o encerramento em `src/server.ts` com `Ctrl+C` e falha de inicialização (porta ocupada). Conceito: ciclo de vida do Fastify. Concluir: confirmar fechamento do PostgreSQL e saída com código `1` quando a inicialização falhar.
- [ ] Definir os contratos de geração por padrões de dias e exceções, horários informativos opcionais, alterações em lote com IDs preservados, filtros de período e erros HTTP.
- [ ] Salvar um rascunho mensal com ocorrências, ainda com `assignments: []`, pelo mesmo `POST /ministries/:ministryId/schedule-plans`.
  - Objetivo e arquivos. Acompanhar o corpo validado em `schedules.schema.ts`, o controller, `createSchedulePlan` no service e a persistência no repository. Gravar plano e ocorrências na mesma transação, mantendo o cliente Drizzle no repository e a dependência do service por contrato.
  - Conceito. Uma microentrega atravessa as camadas para entregar uma ação do usuário. Preservar a data civil e o horário informativo ausente como `NULL`, mantendo as FKs do plano/ministério.
  - Conclusão. Um pedido com mês e ocorrência retorna `201` e grava ambos; uma falha desfaz todo o pedido. Rejeitar equipe preenchida até a próxima entrega, preservando o rascunho vazio já suportado.
- [ ] Preencher pessoas e funções nas ocorrências durante a criação do rascunho, acompanhando entrada, service, repository e resposta. Conceito: vínculo, habilitação e unicidade da pessoa na ocorrência. Concluir: aceitar equipe vazia e pessoas diferentes na mesma função, rejeitar a mesma pessoa repetida e desfazer o pedido inteiro se uma atribuição falhar.
- [ ] Orquestrar a criação mensal em uma única transação usando as funções de persistência, gravando o rascunho sem avisos à equipe e retornando ao autor conflitos e integrantes alternativos elegíveis. Os repositories devem ser criados com a mesma transação do chamador, preservando a confirmação conjunta das gravações. Habilitar a rota somente com autenticação e autorização.
- [ ] Validar no service TypeScript os conflitos por pessoa/data na publicação, troca e edição, com controle de concorrência na transação da API. Manter no schema a unicidade de ministério/data.
- [ ] Validar no service TypeScript vínculo e função habilitada e alterações atômicas de equipe/funções; DTO valida a data dentro do mês e as FKs mantêm plano/ocorrência/função no mesmo ministério.
- [ ] Implementar publicação transacional e idempotente, revalidando o conjunto e registrando os avisos sem duplicação.
- [ ] Implementar consultas autorizadas e edição individual imediata após publicação, com avisos e bloqueio após terminar o dia da ocorrência.
- [ ] Testar permissões, rascunho privado sem ocupar o dia, conflitos no próprio mês, duas publicações simultâneas, repetição da publicação e virada do dia em `America/Sao_Paulo`; executar no CI.

## Fluxo inicial da API — proposto

O handler em `src/modules/schedules/schedules.controller.ts` recebe o service já montado para criar um rascunho vazio e devolver `201`. `schedules.routes.ts` registra o handler com os schemas da rota. A composição é `createSchedulePlanRepository(db)` → `createSchedulePlanService(repository)` → registro de `schedulesRoutes` com `service` e `authorizeMinistryManagement`. Essa última função é criada por `createMinistryManagementAuthorizer(ministryAuthorizationService)` em `src/modules/ministries/ministries.authorization.ts`, lê `request.authenticatedUser` e chama `authorizeUserToManageMinistry` no service de ministérios. O service consulta o papel global e o vínculo no ministério, permitindo administrador ou líder daquele ministério. O `server.ts` já cria os repositories e services e registra essa rota, injetando o adaptador de autorização. Sem identidade autenticada, uma requisição válida recebe `401`; a identificação real por sessão/token está pendente. As demais rotas são propostas.

Contrato de criação do rascunho mensal:

- URL: `ministryId`.
- Corpo mensal: `month` e `occurrences[]`.
- A ocorrência recebe `date`, `time` opcional, `notes` e `assignments[]`.
- Participação: `userId` e `positionId`.
- Resposta mínima da criação: `id`, `ministryId`, `month` e `status: "draft"`.
- Erros da criação. `400` para entrada inválida ou ocorrências ainda não suportadas, `401`/`403` para falhas de autenticação/autorização (ministério inexistente também recebe `403`), `409` para ministério/mês duplicado e `500` com mensagem genérica para falhas inesperadas.

`occurrences` e `assignments` são obrigatórios e aceitam `[]`. A data civil usa `YYYY-MM-DD`, pertence ao mês e não pode se repetir no mesmo pedido. `time` usa `HH:mm`, sem offset e apenas para informação. Observações e horário podem ser omitidos. Cada pessoa aparece no máximo uma vez por ocorrência. As observações passam por `trim()` e aceitam texto vazio.

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

## Para depois — autenticação e autorização

Retomar este fluxo com o usuário escrevendo o código à mão, com mentoria.
Começar pela revisão da autorização por ministério já criada em `src/modules/ministries/ministries.service.ts`
e `ministries.repository.ts`, antes de evoluir a autenticação e a integração HTTP.

- [ ] Implementar identificação por sessão/token que preencha `request.authenticatedUser` antes do controller. A rota e o adaptador de autorização já estão conectados em `server.ts`. Conceito: autenticação fornece a identidade; autorização verifica a gestão do ministério. Concluir: obter o autor de uma sessão válida e verificar a integração com a regra de gestão do ministério.
- [ ] Implementar as permissões restantes: rascunho privado por autoria, leitura mensal por vínculo e feed pessoal por atribuição.

## Demais entregas

- [ ] Persistir presets de agenda e modelos de equipe por ministério; aplicar sem copiar confirmações e revalidar as novas datas, sem controle de vagas.
- [ ] Implementar recuperação de acesso e os fluxos restantes de equipe, confirmação, trocas, indisponibilidade, salas e músicas com validação de entrada/saída.
- [ ] Traduzir `23P01` da constraint `room_reservations_no_overlap` em HTTP 409 e testar o fluxo pela API.
- [ ] Entregar notificações internas e substituir a dependência de realtime do Supabase.

## Aprendizado na API

- [ ] Modelagem: escala mensal, ocorrência, atribuição, relações N:M, PK/FK/UNIQUE, chaves compostas e o motivo de repetir `ministry_id` para integridade.
- [ ] Drizzle: schemas, migrations versionadas e cliente em execução; separar configuração da CLI e conexão da API.
- [ ] Fastify: rotas/plugins, hooks, validação, DTOs, tipos inferidos e respostas de erro sem expor dados internos. Referência: [rotas](https://fastify.dev/docs/latest/Reference/Routes/).
- [ ] Concorrência: dois comandos diferentes disputando a mesma pessoa/data; estudar travas, isolamento e [transações](https://www.postgresql.org/docs/current/tutorial-transactions.html), com a orquestração no service TypeScript. Exercício: duas conexões tentando publicar planos conflitantes.
- [ ] Idempotência: repetir o mesmo comando após timeout sem duplicar os efeitos ou avisos. Estudar estado da operação, deduplicação e eventual chave de idempotência; `POST` não oferece essa garantia automaticamente. Exercício: repetir a publicação e conferir um único efeito. Referência: [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2).
- [ ] Rede e datas: portas do Compose, loopback/WSL/container, conexão do mobile à API, mês/data civil versus instante e virada do dia no fuso da igreja. Intervalos de horário pertencem às reservas de salas.
- [ ] Testes de integração: usar banco real, sessões distintas e falhas/reenvios para verificar autorização e persistência; testes HTTP com `app.inject`.

## Definir

- [ ] Histórico mensal: apenas meses anteriores ou versões do mesmo mês; nenhuma revisão privada foi modelada para ajustes individuais.
- [ ] Exceções de acesso a rascunhos para outros líderes/administradores e inclusão de ocorrência em mês já publicado.
- [ ] Contrato dos presets: persistência, edição, escopo e aplicação; definir se alternativas entre pessoas são apenas indecisão do rascunho ou um recurso próprio.
- [ ] Entrada de pessoas e transição das contas; permissões de catálogos, tons por cantor e reservas de salas.
- [ ] Definir quais estados de participação ocupam o dia em ocorrências publicadas, inclusive durante trocas.
- [ ] Avaliar a remoção da coluna `title` de `schedule_occurrences` em uma migration própria.
- [ ] Hospedagem do servidor e do banco.

## Migração do Supabase

- [ ] Inventariar dados, policies, RPCs, triggers, duplicidades e constraints pendentes de validação.
- [ ] Mapear perfis, vínculos, funções e permissões, preservando identificadores e histórico quando possível.
- [ ] Adaptar os consumidores do mobile aos planos e ocorrências, sem eventos; o histórico antigo de teste foi autorizado para descarte, com planos novos vazios.
- [ ] Validar transferência e autorização em cópia de teste; preparar recuperação e corte de acesso antes de desativar o Supabase.

## Futuras features

- [ ] Entrega de notificações por push.
- [ ] Várias igrejas com isolamento de dados e permissões.
