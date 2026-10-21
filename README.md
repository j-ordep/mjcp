# MJCP

O desenvolvimento atual está no aplicativo [mobile](mobile/README.md).
A documentação do produto está concentrada ali:

- [Contexto](mobile/docs/CONTEXT.md): dor, objetivo, escopo, regras de negócio e tecnologia.
- [Próximos passos](mobile/docs/TASKS.md): único backlog e decisões abertas.
- [Execução e operação](mobile/README.md): ambiente local, validação e banco atual.
- [Orientações de trabalho](mobile/AGENTS.md): manutenção e segurança.

A direção aprovada é um aplicativo interno de escalas, salas, músicas e equipe,
com backend próprio em Fastify/TypeScript e PostgreSQL.
O mobile atual ainda usa Supabase; a migração está no backlog.

[Backend anterior](backend-go/README.md) contém a implementação em Go/Chi.
[Base web](web/README.md) contém a estrutura anterior em Next.js. Ambos ficam fora do ciclo atual;
seus arquivos não comprovam integração com o mobile nem features concluídas.
