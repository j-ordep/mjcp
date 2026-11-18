# Contexto do mobile

Aplicativo interno para organizar escalas, equipe, salas e músicas de uma igreja.
As regras do produto ficam em [REGRAS_DE_NEGOCIO](../../api/docs/REGRAS_DE_NEGOCIO.md).
Este arquivo distingue o código do cliente da estrutura remota durante a migração.

## Confirmado no código

O cliente ainda usa o SDK Supabase para autenticação e acesso direto aos dados.
A navegação aguarda a restauração da sessão no Expo Go e na web. Sem sessão válida,
mostra o login em desenvolvimento e produção; após entrar, abre em Escalas. Sair retorna ao login.
O login usa componentes locais de `src/components/ui`; no navegador, o formulário não
intercepta os cliques para executar `Keyboard.dismiss`.

Em Escalas, o botão de criação aparece para admin ou para quem lidera algum ministério,
conforme os vínculos do usuário da sessão. A criação agora abre uma prévia mensal local:
admin escolhe qualquer ministério; líder escolhe entre os que lidera. Uma única opção
fica selecionada e fixa. O calendário permite marcar dias e usar atalhos por dia da semana;
a prévia mostra uma ocorrência por data, em ordem, com horário informativo opcional.
Datas anteriores a hoje, no fuso da igreja, ficam desabilitadas. Trocar mês ou ministério
limpa a seleção. Não há gravação, publicação, montagem de equipe nem conexão à API;
o conteúdo da prévia é descartado ao sair da tela.

As demais telas e services antigos ainda esperam eventos, `schedules`, `schedule_assignments`,
funções antigas e RPCs do Supabase. Esses contratos não correspondem mais ao banco remoto.
O código contém equipe/funções, confirmação, trocas, indisponibilidade, salas, catálogo e
repertório, mas esses fluxos precisam ser adaptados e verificados antes de serem considerados
funcionais com o novo schema. Os caches e a invalidação por sessão devem ser preservados.

## Banco remoto alinhado à API

Em 2026-11-16 foi aplicada a migration `20261116031253_align_api_daily_schema`:

- As 16 tabelas de domínio correspondem ao schema exportado de `api/src/modules/**/*.tables.ts`.
- `users`, `ministry_positions` e `ministry_member_capabilities` substituem os nomes antigos.
- `schedule_plans`, `schedule_occurrences` e `schedule_occurrence_assignments` representam o fluxo mensal.
- Contas do Auth, usuários, ministérios, funções, vínculos, capabilities, indisponibilidade,
  salas, reservas e músicas foram mantidos. Eventos, escalas, trocas e avisos antigos de teste
  foram descartados com autorização do usuário; planos e ocorrências iniciam vazios.
- O banco mantém tipos, FKs, unicidades e checks simples. Não há triggers de negócio de escalas.
  Conflitos, publicação e bloqueio após o fim do dia serão executados na API TypeScript.
- As tabelas novas têm RLS habilitado. A view `profiles` permite apenas ler o próprio perfil,
  mantendo o login atual; o trigger do Auth somente cria o correspondente registro em `users`.
- A migration `20261116033652_read_monthly_preview_ministries` libera somente leitura
  dos próprios vínculos e dos ministérios dos quais a pessoa participa; admin lê todos
  os ministérios. O service restringe as opções de criação aos vínculos de liderança.
  Não há permissão de escrita do cliente nem funções/triggers de negócio novos.
  Os demais dados de domínio continuam fechados ao acesso direto do cliente.

## Transição e pendências

O contrato de ocorrência usa `date` civil e `time` informativo opcional, sem evento nem
intervalo de horário. As regras completas ficam na referência de negócio, sem duplicação aqui.
A API ainda cria somente o rascunho mensal vazio; autenticação por token, persistência das
ocorrências, publicação e consultas continuam pendentes no backend.

A adaptação das telas e services para HTTP fica em [TASKS](TASKS.md). Ela ainda não foi
implementada. A prévia mensal serve para avaliar a interação sem depender dessa adaptação.
Não recriar os fluxos antigos em RPCs/triggers para compensar essa lacuna.
Tipos e testes locais não comprovam integração nem interação nativa após a troca de schema.

- [TASK do backend](../../api/docs/TASK.md): banco, API e definições.
- [README](../README.md): execução e verificações do cliente.
