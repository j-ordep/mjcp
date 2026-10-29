# MJCP

Aplicativo interno para organizar escalas, equipe, salas e músicas de uma igreja.

- [Backend Fastify](backend-node/README.md): execução e migrations.
- [Regras de negócio](backend-node/docs/REGRAS_DE_NEGOCIO.md): referência única por fluxo.
- [Tarefas do backend](backend-node/docs/TASK.md): pendências, definições, migração do Supabase e futuras features.
- [Mobile](mobile/README.md): execução e operação do cliente atual.
- [Contexto do mobile](mobile/docs/CONTEXT.md): comportamento atual e limites da transição.
- [Tarefas do mobile](mobile/docs/TASKS.md): ajustes e integração do cliente.

O mobile ainda usa Supabase. O backend Fastify possui schemas e migrations;
persistência e fluxos da API continuam pendentes de implementação.

As bases [Go](backend-legacy/README.md) e [web](web/README.md) ficam fora do ciclo atual.
