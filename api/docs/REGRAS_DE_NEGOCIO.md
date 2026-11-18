# Regras de negócio

Aplicativo interno de uma igreja para organizar escalas, equipe, salas e músicas.
Regras compartilhadas por API e mobile. Implementação e definições abertas em [TASK](TASK.md).

## Acesso e equipe

- Administradores gerenciam o domínio. Líderes gerenciam somente os ministérios que lideram.
- A liderança pertence ao vínculo com cada ministério; o acesso global é administrador ou membro.
- Uma pessoa pode participar de vários ministérios e ter várias funções habilitadas.
- Remover alguém de um ministério remove suas atribuições futuras ali e preserva o histórico.

## Preparar a escala mensal

- A escala mensal é o planejamento de um ministério para um mês. Cada ocorrência tem data e equipe próprias, independentemente de eventos; o horário é opcional e informativo.
- A criação principal é mensal; também é possível criar e editar ocorrências individualmente.
- O líder escolhe ministério e mês, define os dias, gera ocorrências com exceções e preenche pessoas e funções. Pode informar horários para orientar os integrantes.
- Presets de agenda e modelos de equipe podem preencher ocorrências; disponibilidade e habilitações precisam ser revalidadas para as novas datas.
- Não há controle de quantidades obrigatórias ou vagas por função. Várias pessoas podem exercer a mesma função.
- O planejamento pode ser salvo em rascunho, visível apenas ao líder autor, sem avisar os integrantes.
- O rascunho mostra ao autor avisos de conflitos e indisponibilidade; não reserva o dia das pessoas.

## Publicar e consultar

- Antes de publicar, revalidar todas as ocorrências, integrantes, funções e conflitos, inclusive dentro do próprio planejamento.
- A publicação disponibiliza o conjunto de forma atômica: um conflito obrigatório impede a publicação do mês.
- Somente ocorrências de planejamentos publicados ocupam o dia das pessoas; rascunhos de outros ministérios não impedem essa ocupação.
- Se dois planejamentos disputam a mesma pessoa na mesma data, apenas uma publicação conflitante pode ser confirmada, inclusive em pedidos simultâneos.
- Repetir uma publicação já concluída não deve duplicar seus efeitos nem os avisos aos integrantes.
- A visão mensal publicada é acessível somente aos integrantes do respectivo ministério.
- O feed de cards pessoais apresenta somente ocorrências publicadas em que a pessoa está escalada.
- O líder tem acesso de gestão às ocorrências do próprio ministério mesmo sem estar escalado.
- As visões diária, semanal e mensal consultam os mesmos registros; mudar a apresentação não cria cópias das escalas.

## Datas e ajustes individuais

- A data civil da ocorrência é obrigatória e pertence ao mês do planejamento. O horário local é opcional, apenas informativo, sem término nem duração presumida.
- O mês do planejamento dá nome à escala mensal. Cada ocorrência é apresentada pela data, pelo horário quando informado e pode ter observações.
- Cada ministério tem no máximo uma ocorrência por data. Ministérios diferentes podem atuar na mesma data com pessoas distintas.
- O conflito é diário: a mesma pessoa não pode ser escalada duas vezes na mesma data, mesmo com horários informativos diferentes.
- Depois da publicação, um ajuste individual passa a valer ao salvar e avisa os envolvidos, sem preparar uma revisão privada do mês para esse ajuste.
- Alterar a data exige revalidar conflitos do ministério e de todos os integrantes; alterar somente o horário informativo não muda a disponibilidade.
- A gestão de cada ocorrência fica disponível até o fim do seu dia em `America/Sao_Paulo`; no dia seguinte, o histórico continua somente para leitura.

## Escalar integrantes

- A pessoa precisa pertencer ao ministério e estar habilitada para a função escolhida.
- Uma pessoa participa uma única vez da mesma ocorrência. Corrigir sua função altera a atribuição existente.
- A pessoa não pode participar de duas ocorrências publicadas na mesma data, inclusive entre ministérios.
- Ao bloquear uma atribuição, informar ao líder a pessoa, o ministério e a data conflitante, sem liberar a consulta à escala completa de outro ministério.
- Sugerir integrantes do ministério habilitados para a função, livres na data e ainda não incluídos na ocorrência.
- O líder escolhe a sugestão; a disponibilidade precisa ser conferida novamente ao salvar ou publicar.

## Confirmar participação e solicitar troca

- Confirmação e troca operam sobre uma atribuição em ocorrência publicada, até o fim do dia da ocorrência.
- O integrante confirma a própria participação ou solicita substituição; a autoria original do pedido é preservada.
- O pedido avisa os líderes do ministério e os demais integrantes habilitados para aquela função.
- A primeira pessoa elegível do mesmo ministério e função assume, sem aprovação do líder. Apenas um aceite pode vencer.
- Quem assume não pode ser o solicitante, já estar na ocorrência ou ter conflito na mesma data. Líderes também precisam ser elegíveis.
- Abrir um pedido retorna a participação para pendente. Assumir a troca também exige nova confirmação.
- O solicitante pode cancelar o pedido pendente até o fim do dia da ocorrência. No dia seguinte, essas operações ficam bloqueadas.

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
- A edição do repertório respeita o ministério gerenciável e fica disponível até o fim do dia da ocorrência.

## Perfil, notificações e datas

- A edição do próprio perfil aceita nome, telefone e avatar. Alterar privilégios exige operação autorizada.
- Os avisos chegam somente aos destinatários correspondentes ao fluxo; preparar o rascunho não notifica a equipe.
- A data da ocorrência é civil (`YYYY-MM-DD`) e não deve ser convertida de UTC. O horário informativo usa `HH:mm` local. Instantes técnicos e reservas de salas preservam seu instante entre app e servidor.
