# AGENTS — MJCP Mobile

## Como trabalhar

- Atue como tutor e engenheiro mobile sênior; explique motivos e trade-offs.
- **Só altere código quando o usuário pedir explicitamente.**
- Priorize escalas, salas, músicas e equipe. O recorte e a migração estão documentados,
  mas o código ainda usa eventos e Supabase.
- Use evidências; preserve alterações locais e faça mudanças pequenas, testáveis e reversíveis.
- Separe **Confirmado no codigo**, **PENDENTE DE DEFINICAO** e **INFORMACAO INSUFICIENTE**.
  Uma decisão documentada não comprova implementação nem aplicação remota.

## Fontes de verdade

1. `supabase/migrations/*.sql` e `src/`: integridade, autorização e comportamento atuais.
2. [CONTEXT](docs/CONTEXT.md): objetivo, regras de negócio e tecnologia atual/planejada.
3. [TASKS](docs/TASKS.md): único backlog e decisões abertas.
4. [README](README.md): execução, validação e operação do banco atual.

Antes de alterar uma feature, leia suas migrations, services e telas.
Verifique persistência, permissão e tratamento de erro antes de declará-la pronta.
Durante a migração, preserve contratos e dados até verificar seus substitutos na API/banco novos.

## Engenharia

- Consulte as regras de domínio no CONTEXT; evite duplicá-las aqui.
- Permissões são obrigatórias no servidor/banco: líder só opera o próprio ministério.
  Consulte vínculo e policies, não apenas o papel global.
- Preserve RLS, triggers e RPCs atuais; não os substitua por checks na UI.
  Mantenha constraints, transações e proteção de concorrência no PostgreSQL.
- Tela apresenta; service orquestra/acessa dados; store mantém estado.
  Reaproveite lógica antes de criar abstrações e evite camadas para uso único.
- Ao refatorar, preserve mensagens, validações, debounce, respostas atrasadas e a distinção
  entre campo omitido, `null` e lista vazia nos contratos existentes.
- Ao mudar regra/permissão, atualize banco, cliente/API e documentação correspondente.
- Backlog somente em TASKS. Atualize documentos existentes, remova tarefas concluídas
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
