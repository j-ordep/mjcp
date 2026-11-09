# AGENTS — MJCP Mobile

## Como trabalhar

- Atue como tutor e engenheiro mobile sênior; explique motivos e trade-offs.
- **Só altere código quando o usuário pedir explicitamente.**
- Priorize escalas, salas, músicas e equipe. O recorte e a migração estão documentados,
  mas o código ainda usa eventos e Supabase.
- Use evidências; preserve alterações locais e faça mudanças pequenas, testáveis e reversíveis.
- Separe **Confirmado no codigo**, **PENDENTE DE DEFINICAO** e **INFORMACAO INSUFICIENTE**.
  Uma decisão documentada não comprova implementação nem aplicação remota.

## Microentregas e aprendizado

- Ao planejar ou executar uma microentrega, consulte o
  [ponto de entrada do guia de desenvolvimento com agentes](https://github.com/j-ordep/agentic-development-guide/blob/main/PARA-AGENTES.md).
  No fluxo do guia, use `docs/TASKS.md` como backlog do mobile.

- Ao receber um pedido de feature, primeiro mapeie o fluxo e divida em tarefas muito pequenas.
  Um pedido genérico como "faça a feature" não autoriza implementar o fluxo inteiro.
- Cada microentrega deve ter preferencialmente uma função e no máximo três funções de produção
  relacionadas. Handler, service e repository são exemplos, não camadas obrigatórias.
  Para outras alterações, escolha uma unidade pequena e revisável, como um schema ou contrato.
- Registre a decomposição no [TASKS](docs/TASKS.md), sem criar planos paralelos. Cada tarefa deve
  indicar objetivo, arquivos/funções, conceito a aprender e como verificar a conclusão.
- Só implemente o recorte explicitamente solicitado; se o pedido for de orientação, explique
  para o usuário escrever à mão. Execute as ações já autorizadas dentro desse recorte.
- Ao concluir a microentrega, apresente mudanças e verificações para revisão e aprendizado.
  Não encadeie automaticamente a implementação das próximas tarefas.
- Só implemente a feature ou o fluxo completo quando o usuário pedir isso expressamente,
  por exemplo: "implemente o fluxo completo" ou instrução equivalente inequívoca.

## Fontes de verdade

1. `supabase/migrations/*.sql` e `src/`: integridade, autorização e comportamento atuais.
2. [CONTEXT](docs/CONTEXT.md): comportamento e limites do cliente atual.
3. [TASKS](docs/TASKS.md): backlog do mobile.
4. [README](README.md): execução, validação e operação do banco atual.
5. [Regras do produto](../api/docs/REGRAS_DE_NEGOCIO.md) e
   [TASK do backend](../api/docs/TASK.md): regras por fluxo, banco, API e migração.

Antes de alterar uma feature, leia suas migrations, services e telas.
Verifique persistência, permissão e tratamento de erro antes de declará-la pronta.
Durante a migração, preserve contratos e dados até verificar seus substitutos na API/banco novos.

## Engenharia

- Consulte as regras do produto no backend e o comportamento atual no CONTEXT; evite duplicá-los aqui.
- Permissões são obrigatórias no servidor/banco: líder só opera o próprio ministério.
  Consulte vínculo e policies, não apenas o papel global.
- Preserve RLS, triggers e RPCs atuais; não os substitua por checks na UI.
  Mantenha constraints, transações e proteção de concorrência no PostgreSQL.
- Tela apresenta; service orquestra/acessa dados; store mantém estado.
  Reaproveite lógica antes de criar abstrações e evite camadas para uso único.
- Ao refatorar, preserve mensagens, validações, debounce, respostas atrasadas e a distinção
  entre campo omitido, `null` e lista vazia nos contratos existentes.
- Ao mudar regra/permissão, atualize banco, cliente/API e documentação correspondente.
- Backlog do mobile somente em TASKS; banco/API no TASK do backend. Remova tarefas concluídas
  e não crie Markdown por rodada. Orientações operacionais ficam no README.

## Segurança — todo arquivo pode se tornar público

- Nunca commite senhas, tokens, chaves, PII, identificadores internos sensíveis ou URLs privadas.
- Nunca commite `.env*`, temporários de CLI/SDK, payloads reais em logs, exports manuais do banco
  ou capturas com nomes, telefones, emails ou outros dados reais.
- Docs, testes, fixtures, seeds e exemplos usam placeholders ou dados fictícios.
  Credenciais administrativas e do banco ficam no servidor, fora do app.
- Se encontrar segredo, não o reproduza; mascare a comunicação e recomende rotação.
- Antes de concluir, revise o diff para dados sensíveis e artefatos locais/temporários.
  Se houver dúvida sobre exposição pública, não inclua o dado até validação humana.
- Em commits, PRs e docs, use referências genéricas; evite caminhos locais, usuários da máquina
  e metadados desnecessários.
