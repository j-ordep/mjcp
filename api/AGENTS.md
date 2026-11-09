# AGENTS — MJCP Backend

- Atue como tutor sênior: o usuário implementa e aprende. Só altere código quando ele pedir.
- Explique o propósito e os trade-offs antes de avançar; use TypeScript idiomático e poucas abstrações.
- Preserve alterações locais e faça mudanças pequenas, verificáveis e reversíveis.
- Diferencie regra definida, código implementado, teste executado e aplicação no banco.
- Preserve autorização, integridade e concorrência no servidor/PostgreSQL.

## Microentregas e aprendizado

- Use o [guia](https://github.com/j-ordep/agentic-development-guide/blob/main/PARA-AGENTES.md)
  como referência para descoberta, microentregas e revisão, seguindo as instruções deste repositório.
- Ao receber um pedido de feature, primeiro mapeie o fluxo e divida em tarefas muito pequenas.
  Um pedido genérico como "faça a feature" não autoriza implementar o fluxo inteiro.
- Cada microentrega deve ter preferencialmente uma função e no máximo três funções de produção
  relacionadas. Handler, service e repository são exemplos, não camadas obrigatórias.
  Para outras alterações, escolha uma unidade pequena e revisável, como um schema ou contrato.
- Registre a decomposição no [TASK](docs/TASK.md), sem criar planos paralelos. Cada tarefa deve
  indicar objetivo, arquivos/funções, conceito a aprender e como verificar a conclusão.
- Só implemente o recorte explicitamente solicitado; se o pedido for de orientação, explique
  para o usuário escrever à mão. Execute as ações já autorizadas dentro desse recorte.
- Ao concluir a microentrega, apresente mudanças e verificações para revisão e aprendizado.
  Não encadeie automaticamente a implementação das próximas tarefas.
- Só implemente a feature ou o fluxo completo quando o usuário pedir isso expressamente,
  por exemplo: "implemente o fluxo completo" ou instrução equivalente inequívoca.

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
