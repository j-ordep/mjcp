# Backend MJCP — desenvolvimento e aprendizado

Este backend será construído aos poucos para aprender TypeScript, Fastify,
modelagem de domínio e monolito modular enquanto atende ao app mobile MJCP.
O desenvolvedor já conhece o básico de backend e trabalha com Go; o código
seguirá o estilo de TypeScript, sem forçar equivalências com Go.

## Como vamos trabalhar

- Uma etapa por vez, explicando o propósito e as escolhas antes de avançar.
- Código legível, nomes claros, poucas camadas e separações justificadas.
- Objetos tipados, funções e composição como ponto de partida.
- Classes, services, repositories, factories e funções build apenas com necessidade concreta.
- Validação nas fronteiras, evitando parses e conversões repetidos.
- Modelagem de domínio faz parte do aprendizado desde o início.
- Exemplos apresentados no chat e código implementado são acompanhados separadamente.

O histórico de decisões e as orientações para continuidade estão em AGENT_CONTEXT.md.
A implementação anterior foi removida sem backup, conforme solicitado.

## Conceitos que estamos construindo

Um monolito modular é uma aplicação publicada como uma unidade, organizada em
áreas de negócio com responsabilidades e contratos claros. Pastas, sozinhas,
não estabelecem esses limites.

- Tipos de domínio representam conceitos do negócio.
- Funções expressam regras e operações.
- Schemas Zod validam dados recebidos pela API e permitem inferir tipos.
- Schemas Drizzle mapeiam tabelas e constraints do Postgres.
- Rotas Fastify conectam HTTP às operações do módulo.

Não é obrigatório criar um arquivo ou uma camada para cada item dessa lista.

## Nomenclatura de acesso e funções de serviço

No recorte atual de uma igreja, `users.accessRole` (`access_role` no banco)
aceita `admin` ou `member`. Liderança pertence somente ao vínculo
`ministry_members.is_leader`; uma pessoa pode liderar um ministério e ser
apenas integrante de outro.

`ministry_positions` define funções como baixo, bateria e transmissão.
`ministry_member_capabilities` associa o integrante às funções que sabe exercer.
`schedule_assignments.position_id` registra a função que exercerá naquela escala.

Ao implementar gestão de equipe, a API deverá autorizar administradores ou
líderes com vínculo no ministério da operação. Adicionar uma pessoa à equipe
cria esse vínculo; não exige atribuir um papel global de líder. Rotas, permissões
e migração dos dados ainda precisam ser implementadas e verificadas.

## Estado conferido em 22/10/2026

### Presente nos arquivos

- src/server.ts: criação do Fastify, validatorCompiler, registro de eventos e listen.
- src/modules/events/route.ts: listagem, consulta por ID e criação em memória.
- A criação ainda valida o body com safeParse manual.
- src/modules/events/events.ts: EventCategory, ChurchEvent e isEventPeriodValid.
- A regra permite término ausente ou posterior ao início, considerando datas válidas.

A execução do servidor não foi verificada nesta atualização da documentação.

### Explicado, mas ainda não integrado

- Validação por schema da rota e inferência com FastifyPluginAsyncZod.
- Uso de ChurchEvent e da regra de período nas operações reais.
- Persistência com Drizzle e Postgres.

Os eventos das rotas ainda têm apenas id e title. O tipo ChurchEvent é um
recorte maior do domínio, mas ainda precisa ser alinhado à persistência,
incluindo autoria e campos de auditoria.

## Próxima etapa guiada

Mapear a tabela events existente para Drizzle e explicar cada escolha:

1. Conferir campos, categorias, nulabilidade e defaults nas migrations existentes.
2. Entender o mapeamento de camelCase para snake_case e de Date para timestamptz.
3. Representar a integridade temporal e os relacionamentos existentes.
4. Decidir quais tipos podem ser inferidos e quais precisam de representação própria.
5. Depois, conectar uma operação ao banco e integrar as regras do domínio.

A modelagem existente está em mobile/supabase/migrations/ e a visão do domínio
em mobile/docs/EVENT_CORE_PLAN.md. Reconstruir o código do backend não significa
recriar as tabelas existentes.

## Execução

Dentro de backend-node:

```sh
bun run dev
```

O servidor está configurado para a porta 3000. As rotas atuais usam /events.
Os dados em memória desaparecem quando o processo reinicia.
