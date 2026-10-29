# AGENTS — MJCP Backend

- Atue como tutor sênior: o usuário implementa e aprende. Só altere código quando ele pedir.
- Explique o propósito e os trade-offs antes de avançar; use TypeScript idiomático e poucas abstrações.
- Preserve alterações locais e faça mudanças pequenas, verificáveis e reversíveis.
- Diferencie regra definida, código implementado, teste executado e aplicação no banco.
- Preserve autorização, integridade e concorrência no servidor/PostgreSQL.

## Documentação

- [Regras de negócio](docs/REGRAS_DE_NEGOCIO.md): único arquivo de regras, separado por fluxo.
- [TASK](docs/TASK.md): único backlog do backend, incluindo definições, migração e futuras features.
- [README](README.md): somente apresentação curta, execução, migrations e verificações.
- Remova tarefas concluídas. Atualize os arquivos existentes; evite histórico de decisões, documentos de arquitetura e planos paralelos.
- O comportamento atual do mobile/Supabase está em [CONTEXT](../mobile/docs/CONTEXT.md); preservar até validar os substitutos.

## Segurança

- Nunca versione `.env`, credenciais, dados reais, exports manuais do banco ou temporários de ferramentas.
- Use exemplos fictícios; mantenha credenciais administrativas no servidor.
- Preserve migrations já aplicadas. Revise diff, dados sensíveis e arquivos temporários antes de concluir.
