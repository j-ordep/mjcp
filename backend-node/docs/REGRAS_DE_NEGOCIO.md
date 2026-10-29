# Regras de negócio

Aplicativo interno de uma igreja para organizar escalas, equipe, salas e músicas.
Estas são as regras a atender. A implementação pendente fica em [TASK](TASK.md).

## Acesso e equipe

- Administradores gerenciam o domínio. Líderes gerenciam somente os ministérios que lideram.
- A liderança pertence ao vínculo com cada ministério; o acesso global é administrador ou membro.
- Uma pessoa pode participar de vários ministérios e ter várias funções habilitadas.
- Remover alguém de um ministério remove suas atribuições futuras ali e preserva o histórico.

## Criar e editar escalas

- Cada escala pertence a um ministério e existe independentemente de eventos. O mês é uma forma de organizar a agenda.
- O início é obrigatório. O término é opcional e, quando informado, deve ser posterior ao início.
- Para conflitos, uma escala sem término ocupa 60 minutos a partir do início; com término, vale o período informado.
- Escalas do mesmo ministério não podem se sobrepor. Ministérios diferentes podem ter escalas simultâneas.
- Uma escala pode começar exatamente quando a anterior termina.
- Alterar horários exige revalidar conflitos do ministério e de todos os integrantes.
- A gestão da escala bloqueia exatamente no início; o histórico continua disponível para leitura.

## Escalar integrantes

- A pessoa precisa pertencer ao ministério e estar habilitada para a função escolhida.
- Várias pessoas podem exercer a mesma função na escala, como dois guitarristas.
- Uma pessoa participa uma única vez da mesma escala. Corrigir sua função altera a atribuição existente.
- A pessoa não pode participar de escalas sobrepostas, inclusive entre ministérios.
- Ao bloquear uma atribuição, informar ao líder a pessoa, o ministério e o período conflitante.
- Sugerir integrantes do ministério habilitados para a função, livres no período e ainda não incluídos na escala.
- O líder escolhe a sugestão; a disponibilidade precisa ser conferida novamente ao salvar.

## Confirmar participação e solicitar troca

- O integrante confirma a própria participação antes do início da escala.
- O integrante solicita substituição na própria atribuição; a autoria original do pedido é preservada.
- O pedido avisa os líderes do ministério e os demais integrantes habilitados para aquela função.
- A primeira pessoa elegível do mesmo ministério e função assume, sem aprovação do líder. Apenas um aceite pode vencer.
- Quem assume não pode ser o solicitante, já estar na escala ou ter conflito de horário. Líderes também precisam ser elegíveis.
- Abrir um pedido retorna a participação para pendente. Assumir a troca também exige nova confirmação.
- O solicitante pode cancelar o pedido pendente antes do início. Confirmação e operações de troca bloqueiam no início.

## Informar indisponibilidade

- O integrante pode bloquear dias inteiros e informar um motivo.
- A data bloqueada gera aviso ao montar a equipe; o bloqueio obrigatório por conflito de escalas é uma regra distinta.

## Reservar salas

- As reservas têm agenda própria, sem depender de eventos ou escalas.
- Início e término são obrigatórios; o término deve ser posterior ao início.
- Uma sala admite no máximo uma reserva ativa em cada instante, independentemente de quem reservou.
- Reservas consecutivas são permitidas. Salas diferentes podem ser reservadas simultaneamente.
- Cancelar libera o período. Alterar horários ou reativar uma reserva também exige disponibilidade.
- Pedidos simultâneos não podem confirmar duas reservas conflitantes; o usuário deve receber uma mensagem de conflito.

## Músicas e repertório

- O catálogo registra a música e seu artista original; o cantor da equipe é uma pessoa distinta.
- Uma música pode ter vários cantores, cada um com seu tom preferido.
- O repertório pertence à escala de louvor e possui uma ordem de execução.
- Cada item registra o cantor e o tom daquela execução; mudar a preferência não altera o histórico.
- A edição do repertório respeita o ministério gerenciável e bloqueia no início da escala.

## Perfil, notificações e datas

- A edição do próprio perfil aceita nome, telefone e avatar. Alterar privilégios exige operação autorizada.
- Os avisos devem chegar somente aos destinatários correspondentes ao fluxo.
- Horários são apresentados na hora local; o mesmo instante deve ser preservado entre app e servidor.
