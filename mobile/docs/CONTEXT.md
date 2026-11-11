# Contexto do mobile

Aplicativo interno para organizar escalas, equipe, salas e músicas de uma igreja.

As regras do produto ficam em [REGRAS_DE_NEGOCIO](../../backend-node/docs/REGRAS_DE_NEGOCIO.md).
Este arquivo descreve o cliente atual; regras definidas para o novo backend ainda dependem da migração.

## Confirmado no codigo

O mobile usa Supabase diretamente para autenticação, dados e notificações internas.
Em desenvolvimento (`__DEV__`), a navegação abre diretamente em Escalas no Expo Go e na web,
mesmo sem sessão; em produção, exige login. Esse atalho não cria uma sessão nem altera a
autorização dos dados no Supabase: consultas e ações protegidas ainda exigem usuário autenticado.
Escalas ainda dependem de `events`, com uma escala por `(event_id, ministry_id)`.
Repertórios também dependem de eventos; reservas podem ser avulsas ou vinculadas a eles.
Eventos públicos são visíveis a usuários autenticados; privados usam audiência e permissões próprias.

Escalas abre em Minhas; Gerenciadas consulta apenas o escopo de administração/liderança.
A lista filtra por ministério, busca e próximas/anteriores; confirmação e troca ficam no detalhe.
Trocas separa pendentes próprios, disponíveis e histórico, sem inferir o solicitante original
de uma atribuição já transferida. Perfil e notificações ficam no cabeçalho das abas.

Já existem equipe/funções, confirmação, trocas, indisponibilidade, reservas, catálogo musical,
tom base e tom por repertório. Equipe é restrita a administradores e líderes com vínculo confirmado.
Repertório é acessível por Músicas ou escala, identificado pelo evento compartilhado, com edição
por gestor antes do início e rascunho preservado em erro. Salas consulta ocupação e reservas,
sem contadores de integrantes. Eventos de apoio ficam no Perfil dos gestores autorizados.
Os caches são invalidados ao sair/trocar de usuário e descartam respostas ultrapassadas.
Salvar liderança/integrante e capabilities ainda pode resultar em gravação parcial: a tela relê
o estado persistido e mantém a edição para conferência; não existe transação simulada no cliente.
Tons por cantor, escalas sem eventos e integração Fastify ainda não existem.
CRUD completo dos catálogos administrativos e push externo também não estão implementados no mobile.

A autorização atual depende de RLS, triggers e RPCs. Gestão de eventos ainda usa admin ou
`profiles.can_manage_events`; perfis usam `profiles.role` e liderança usa `ministry_members.is_leader`.
Essas estruturas precisam continuar protegidas enquanto fizerem parte do sistema.

## Transição

A API Fastify possui schemas e migrations em `backend-node`. Persistência, autenticação
e integração HTTP ainda precisam ser implementadas. O exemplo de eventos em memória
não define o domínio do produto.

A criação mensal com rascunho/publicação, os presets e as novas consultas por ministério
estão planejados, ainda sem implementação no cliente. As regras compartilhadas ficam no
arquivo de negócio citado acima; tarefas de interface e HTTP ficam em [TASKS](TASKS.md).

Preserve contratos, dados, RLS, triggers e RPCs do Supabase até verificar seus substitutos.
As refatorações do mobile atual devem preservar seu comportamento durante essa transição.

## Pendências

- [TASKS](TASKS.md): ajustes, validação e integração do mobile.
- [TASK do backend](../../backend-node/docs/TASK.md): banco, API, definições e migração dos dados.
- [README](../README.md): execução e operação do cliente atual.

Aplicação remota de migrations e validação em Android/iOS exigem verificação específica.
