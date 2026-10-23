# Contexto do projeto — aprendizado de backend

O dono quer aprender construindo um backend Fastify do zero. A implementação
e a proposta anteriores foram removidas. O dono autorizou a limpeza sem backup.

## Estado atual

- Código anterior removido de `src/`; o dono começou a reconstrução durante as aulas.
- Pastas preservadas em `src/modules/`: auth, events, health, ministries,
  profiles e schedules. Não criar `.gitkeep`; o dono pediu para removê-los.
- Configurações e dependências anteriores preservadas; não significa que todas
  serão usadas desde o início.
- `src/server.ts` cria o Fastify, configura `validatorCompiler`, registra eventos
  e chama `listen`. Execução não verificada nesta atualização de documentação.
- `src/modules/events/route.ts` tem GET /events, GET /events/:id e POST /events
  com lista em memória. POST ainda usa `safeParse` manual; a integração via schema
  da rota e `FastifyPluginAsyncZod` foi explicada, mas ainda não está nesse arquivo.
- `src/modules/events/events.ts` contém EventCategory, ChurchEvent e
  isEventPeriodValid. O modelo e a regra ainda não estão ligados às rotas.
- Ainda não há persistência implementada. README registra progresso e próximos passos.

## Como trabalhar

- O dono é desenvolvedor júnior Go e já conhece o básico de programação e backend.
- O papel do agente é ajudar a desenvolver e aprender TypeScript, Fastify e monolito modular.
- Escrever TypeScript idiomático, sem forçar paralelos com Go. Não presumir que precisa de aulas introdutórias de HTTP.
- Priorizar código legível, nomes claros e poucas camadas.
- Não criar funções `build*`, factories, wrappers ou parses sem uma necessidade concreta.
- Validar e converter dados nas fronteiras quando necessário, evitando repetir validações e transformações internamente.
- Não criar antecipadamente arquivos de service, repository, policy ou interfaces sem uma responsabilidade real que justifique a separação.
- Explicar escolhas de paradigma e arquitetura, além da sintaxe e comportamento de TypeScript.
- Ensinar em português, com passos pequenos e explicação do propósito de cada peça.
- Explicar antes de implementar; não adiantar CRUD, banco, auth ou arquitetura.
- Introduzir tecnologias e separações de arquivos quando houver uma necessidade concreta.
- Objetivo: aprender TypeScript, Fastify, modelagem de domínio e monolito modular enquanto constrói o backend.
- O foco de produto continua sendo o app mobile MJCP; SaaS fica para depois.

## Decisões e continuidade

- Começar com objetos tipados, funções e composição. Classes entram apenas se houver benefício concreto.
- Modularidade significa responsabilidades e contratos entre áreas do negócio; não exige várias camadas por módulo.
- Modelar conceitos e regras antes de expandir o CRUD. O exemplo com id/title não é o domínio completo.
- Distinguir tipo de domínio, schema Zod de entrada e schema Drizzle de persistência.
- Usar inferência de tipos quando as representações coincidirem; não duplicar tipos nem criar mapeamentos sem motivo.
- Fonte existente do modelo: migrations e código em mobile/. Reconstruir o backend não significa recriar o banco.
- Próxima etapa discutida: mapear a tabela events existente com Drizzle, entendendo campos,
  nulabilidade, datas, auditoria, relacionamentos e constraints antes de implementar persistência.
- Nos próximos encontros, conferir o código real: exemplos mostrados no chat não significam implementação concluída.
- Atualizar estes documentos conforme decisões e etapas mudarem, sem avançar o código das próximas aulas autonomamente.
