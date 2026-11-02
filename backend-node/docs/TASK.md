# Tarefas do backend

Somente pendências; remover o que for concluído. Regras compartilhadas em [REGRAS_DE_NEGOCIO](REGRAS_DE_NEGOCIO.md).
Mobile e suas telas ficam em [TASKS do mobile](../../mobile/docs/TASKS.md); execução no [README](../README.md).

## Foco agora: API da escala mensal

- [ ] Conectar a API ao PostgreSQL com o cliente Drizzle, validar `DATABASE_URL`, executar `SELECT 1` e encerrar as conexões com a aplicação.
- [ ] Gerar, revisar e aplicar a base inicial no PostgreSQL de desenvolvimento com os schemas de plano mensal e ocorrências; incluir a migration customizada de salas conforme o README.
- [ ] Definir DTOs de entrada/saída, geração por padrões de dias/horários e exceções, alterações em lote com IDs preservados, filtros de período e erros HTTP.
- [ ] Implementar autenticação/sessão e autorização no servidor: autoria do rascunho, leitura mensal por vínculo, feed pessoal por atribuição e gestão por liderança do ministério.
- [ ] Implementar criação mensal e gravação do rascunho sem avisos à equipe; retornar ao autor conflitos e integrantes alternativos elegíveis.
- [ ] Proteger no banco os períodos publicados por ministério e por pessoa, inclusive na publicação concorrente, trocas e edições; usar 60 minutos sem término e permitir períodos consecutivos.
- [ ] Garantir vínculo e função habilitada, ocorrência dentro do mês do plano no fuso da igreja e alterações atômicas de equipe/funções; as FKs já mantêm plano/ocorrência/função no mesmo ministério.
- [ ] Implementar publicação transacional e idempotente, revalidando o conjunto e registrando os avisos sem duplicação.
- [ ] Implementar consultas autorizadas e edição individual imediata após publicação, com avisos e bloqueio no início da ocorrência.
- [ ] Testar permissões, rascunho privado sem ocupar horário, conflitos no próprio mês, duas publicações simultâneas, repetição da publicação e limites exatos de horário; executar no CI.

## Fluxo inicial da API — proposto

Rotas ainda não implementadas; payloads serão fechados antes de codificar. `schedule_plans` guarda o mês; `schedule_occurrences` guarda cada ocorrência, com atribuições e repertório próprios.

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
- [ ] Obrigatoriedade do título e quais estados de participação ocupam horário em ocorrências publicadas, inclusive durante trocas.
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
