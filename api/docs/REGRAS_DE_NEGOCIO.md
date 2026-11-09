# Regras de negócio

Aplicativo interno de uma igreja para organizar escalas, equipe, salas e músicas.
Regras compartilhadas por API e mobile. Implementação e definições abertas em [TASK](TASK.md).

## Acesso e equipe

- Administradores gerenciam o domínio. Líderes gerenciam somente os ministérios que lideram.
- A liderança pertence ao vínculo com cada ministério; o acesso global é administrador ou membro.
- Uma pessoa pode participar de vários ministérios e ter várias funções habilitadas.
- Remover alguém de um ministério remove suas atribuições futuras ali e preserva o histórico.

## Preparar a escala mensal

- A escala mensal é o planejamento de um ministério para um mês. Cada ocorrência tem dia, horário e equipe próprios, independentemente de eventos.
- A criação principal é mensal; também é possível criar e editar ocorrências individualmente.
- O líder escolhe ministério e mês, define padrões de dias e horários, gera ocorrências com exceções e preenche pessoas e funções.
- Presets de agenda e modelos de equipe podem preencher ocorrências; disponibilidade e habilitações precisam ser revalidadas para as novas datas.
- Não há controle de quantidades obrigatórias ou vagas por função. Várias pessoas podem exercer a mesma função.
- O planejamento pode ser salvo em rascunho, visível apenas ao líder autor, sem avisar os integrantes.
- O rascunho mostra ao autor avisos de conflitos e indisponibilidade; não reserva o horário das pessoas.

## Publicar e consultar

- Antes de publicar, revalidar todas as ocorrências, integrantes, funções e conflitos, inclusive dentro do próprio planejamento.
- A publicação disponibiliza o conjunto de forma atômica: um conflito obrigatório impede a publicação do mês.
- Somente ocorrências de planejamentos publicados ocupam o horário das pessoas; rascunhos de outros ministérios não impedem essa ocupação.
- Se dois planejamentos disputam a mesma pessoa no mesmo período, apenas uma publicação conflitante pode ser confirmada, inclusive em pedidos simultâneos.
- Repetir uma publicação já concluída não deve duplicar seus efeitos nem os avisos aos integrantes.
- A visão mensal publicada é acessível somente aos integrantes do respectivo ministério.
- O feed de cards pessoais apresenta somente ocorrências publicadas em que a pessoa está escalada.
- O líder tem acesso de gestão às ocorrências do próprio ministério mesmo sem estar escalado.
- As visões diária, semanal e mensal consultam os mesmos registros; mudar a apresentação não cria cópias das escalas.

## Horários e ajustes individuais

- O início da ocorrência é obrigatório. O término é opcional e, quando informado, deve ser posterior ao início.
- O título e as observações da ocorrência são opcionais. Quando informado, o título deve conter texto após remover espaços nas extremidades.
- Para conflitos, uma ocorrência sem término ocupa 60 minutos; com término, vale o período informado.
- Ocorrências publicadas do mesmo ministério não podem se sobrepor. Ministérios diferentes podem ter horários simultâneos.
- Uma ocorrência pode começar exatamente quando a anterior termina.
- Depois da publicação, um ajuste individual passa a valer ao salvar e avisa os envolvidos, sem preparar uma revisão privada do mês para esse ajuste.
- Alterar horários exige revalidar conflitos do ministério e de todos os integrantes.
- A gestão de cada ocorrência bloqueia exatamente no seu início; o histórico continua disponível para leitura.

## Escalar integrantes

- A pessoa precisa pertencer ao ministério e estar habilitada para a função escolhida.
- Uma pessoa participa uma única vez da mesma ocorrência. Corrigir sua função altera a atribuição existente.
- A pessoa não pode participar de ocorrências publicadas sobrepostas, inclusive entre ministérios.
- Ao bloquear uma atribuição, informar ao líder a pessoa, o ministério e o período conflitante, sem liberar a consulta à escala completa de outro ministério.
- Sugerir integrantes do ministério habilitados para a função, livres no período e ainda não incluídos na ocorrência.
- O líder escolhe a sugestão; a disponibilidade precisa ser conferida novamente ao salvar ou publicar.

## Confirmar participação e solicitar troca

- Confirmação e troca operam sobre uma atribuição em ocorrência publicada, antes do início.
- O integrante confirma a própria participação ou solicita substituição; a autoria original do pedido é preservada.
- O pedido avisa os líderes do ministério e os demais integrantes habilitados para aquela função.
- A primeira pessoa elegível do mesmo ministério e função assume, sem aprovação do líder. Apenas um aceite pode vencer.
- Quem assume não pode ser o solicitante, já estar na ocorrência ou ter conflito de horário. Líderes também precisam ser elegíveis.
- Abrir um pedido retorna a participação para pendente. Assumir a troca também exige nova confirmação.
- O solicitante pode cancelar o pedido pendente antes do início. As operações bloqueiam no início da ocorrência.

## Informar indisponibilidade

- O integrante pode bloquear dias inteiros e informar um motivo.
- A data bloqueada gera aviso ao montar a equipe; o bloqueio obrigatório por conflito de ocorrências é uma regra distinta.

## Reservar salas

- As reservas têm agenda própria, sem depender de eventos ou escalas.
- Início e término são obrigatórios; o término deve ser posterior ao início.
- Uma sala admite no máximo uma reserva ativa em cada instante, independentemente de quem reservou.
- Reservas consecutivas são permitidas. Salas diferentes podem ser reservadas simultaneamente.
- Cancelar libera o período. Alterar horários ou reativar uma reserva também exige disponibilidade.
- Pedidos simultâneos não podem confirmar duas reservas conflitantes; o usuário recebe uma mensagem de conflito.

## Músicas e repertório

- O catálogo registra a música e seu artista original; o cantor da equipe é uma pessoa distinta.
- Uma música pode ter vários cantores, cada um com seu tom preferido.
- O repertório pertence a uma ocorrência de louvor e possui uma ordem de execução.
- Cada item registra o cantor e o tom daquela execução; mudar a preferência não altera o histórico.
- A edição do repertório respeita o ministério gerenciável e bloqueia no início da ocorrência.

## Perfil, notificações e datas

- A edição do próprio perfil aceita nome, telefone e avatar. Alterar privilégios exige operação autorizada.
- Os avisos chegam somente aos destinatários correspondentes ao fluxo; preparar o rascunho não notifica a equipe.
- Horários são apresentados na hora local; o mesmo instante deve ser preservado entre app e servidor.
