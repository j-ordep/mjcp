# Contexto do MJCP

Revisado em 2026-10-11. Comportamento atual: código e migrations.
A direção futura abaixo exige mudanças de banco; o recorte mobile já usa Escalas como entrada.

## Dor e objetivo

As equipes precisam saber quem vai servir, quando, em qual função e quem pode substituir
uma pessoa. Também precisam organizar o uso das salas e consultar o tom adequado de cada
música para seus cantores. O objetivo é reunir essas informações em um aplicativo interno,
com poucos fluxos e manutenção simples.

O público são administradores, líderes de ministério e integrantes das equipes.

## Produto que vamos construir

| Área | Responsabilidade |
| --- | --- |
| Escalas, tela inicial | Escalas independentes por ministério, equipe, funções, confirmação, trocas e indisponibilidade |
| Salas | Agenda por data/horário, disponibilidade, reserva e cancelamento |
| Músicas | Catálogo, tom por cantor e repertório das escalas de louvor |
| Equipe | Administradores e líderes consultam e gerenciam integrantes dos ministérios |
| Perfil e notificações | Acesso pelo cabeçalho/menu; dados pessoais e avisos relacionados ao serviço |

Cada escala terá seu ministério, data, horário e identificação, como “Culto da manhã”.
Escalas de ministérios diferentes serão independentes. Um ministério poderá ter mais de
uma escala no mesmo dia; a data sozinha não identifica uma escala.

O módulo de eventos será retirado: criar escala deixará de exigir criar um evento.
Reservas terão agenda própria. O repertório ficará ligado à escala de louvor.
Uma música poderá ter vários cantores cadastrados, cada um com seu tom preferido.
O repertório registrará o cantor e o tom daquela execução, preservando o histórico quando
a preferência mudar. O artista original da música e o cantor da equipe são informações distintas.

A página inicial geral e vídeos do YouTube foram retirados. Eventos e gestão de audiência
continuam como apoio, fora das abas principais, enquanto sustentarem os contratos atuais.
Visitantes, escola bíblica, relatórios gerais e SaaS para várias igrejas ficam
fora deste recorte.

## Regras de negócio a preservar

- Admin gerencia o domínio. Líder gerencia escalas e equipe dos ministérios que lidera.
  Membro confirma a própria participação e opera trocas quando elegível.
- Liderança depende do vínculo com o ministério; o papel global `leader` sozinho não basta.
  A gestão de equipe fica disponível somente a administradores e líderes, respeitando esse escopo.
- Capability é a função que alguém sabe exercer; assignment é a função que fará na escala.
  A atribuição exige vínculo e capability compatíveis. Novas atribuições não repetem a pessoa na escala.
- Confirmação e gestão da escala/trocas bloqueiam exatamente no início; o histórico continua legível.
  Hoje o horário vem do evento; passará a pertencer à escala.
- Na troca, a primeira pessoa elegível do mesmo ministério e função assume, sem aprovação do líder.
  Ela não pode já estar na escala nem aceitar o próprio pedido. Apenas um aceite pode vencer.
- Abrir troca retorna a participação para `pending`; assumir também exige nova confirmação.
  O solicitante pode cancelar o pedido pendente antes do início.
- Conflitos de escala e datas bloqueadas geram avisos. Sobreposição de reservas da mesma sala é bloqueada.
- Remover integrante de um ministério remove suas atribuições futuras ali e preserva o histórico.
- Edição pessoal envia somente nome, telefone e avatar. Papel e outros privilégios exigem operação autorizada.
- Formulários apresentam hora local e persistem instantes em UTC. Estados persistidos são em inglês;
  os rótulos da interface são em português.

## Confirmado no codigo

O mobile usa Supabase diretamente para autenticação, dados e notificações internas.
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

## Tecnologia e manutenção

| Parte | Atual | Direção aprovada |
| --- | --- | --- |
| Cliente | React Native, Expo, TypeScript, React Navigation, Zustand, Paper e NativeWind | Manter; trocar acesso direto ao Supabase por HTTP para a API |
| Backend | Serviços de Auth/API/Realtime do Supabase | API própria com Node.js, Fastify e TypeScript |
| Banco | PostgreSQL gerenciado pelo Supabase | PostgreSQL independente do Supabase |

A migração inclui substituir Supabase Auth, acesso a dados e entrega de notificações.
O destino é `mobile → API Fastify → PostgreSQL`; a API Fastify ainda precisa ser criada.
A implementação anterior em Go permanece no repositório e não é o backend integrado ao mobile.

Telas/componentes apresentam e coordenam interação; services acessam dados; stores mantêm estado.
Na API, regras e permissões ficam no servidor. O PostgreSQL mantém constraints e transações,
inclusive proteção de concorrência em trocas e reservas.
As proteções atuais só serão retiradas após existir substituto verificado.

Organize por responsabilidade e reaproveite lógica real. Evite interfaces, wrappers e camadas
para uso único. Componentizar deve facilitar leitura, preservando erros, estado, permissões
e contratos de atualização parcial durante a transição. Versões atuais estão em `package.json`.

Componentes específicos de uma tela são úteis quando assumem um fluxo completo e seu estado
local, como montagem de equipe, participação, edição de integrante ou busca de pessoas.
A tela mantém o contexto compartilhado e a atualização dos dados. Evite extrair apenas JSX
para continuar repassando todos os estados e setters da tela.

## PENDENTE DE DEFINICAO e INFORMACAO INSUFICIENTE

Decisões abertas e trabalho de migração ficam somente em [TASKS](TASKS.md).
Aplicação remota de migrations, execução de CI e validação integral em Android/iOS
exigem verificação específica; código local não comprova esses estados.
