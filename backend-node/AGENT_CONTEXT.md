# Contexto do projeto — aprendizado de backend

O dono quer aprender construindo um backend Fastify do zero. A implementação
e a proposta anteriores foram removidas. O dono autorizou a limpeza sem backup.

## Estado atual

- Código anterior removido de `src/`.
- Pastas vazias preservadas em `src/modules/`: auth, events, health, ministries,
  profiles e schedules. Não criar `.gitkeep`; o dono pediu para removê-los.
- Configurações e dependências anteriores preservadas; não significa que todas
  serão usadas desde o início.
- Ainda não existe servidor executável. Primeiro exercício em `README.md`.

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
- Objetivo: entender HTTP, Fastify e monolito modular enquanto constrói o backend.
- O foco de produto continua sendo o app mobile MJCP; SaaS fica para depois.
