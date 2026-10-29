# Tarefas do backend

Somente pendências. Remova cada item concluído; não mantenha histórico de tarefas.
Regras em [REGRAS_DE_NEGOCIO](REGRAS_DE_NEGOCIO.md); execução no [README](../README.md).

## Próximas entregas

- [ ] Preparar o PostgreSQL de desenvolvimento, aplicar as migrations e conectar a API ao banco.
- [ ] Bloquear no banco sobreposição de escalas por ministério, usando 60 minutos quando faltar término.
- [ ] Bloquear sobreposição da mesma pessoa entre escalas, inclusive em atribuições concorrentes, trocas e alterações de horário.
- [ ] Garantir vínculo e função habilitada na atribuição e salvar alterações de equipe/funções de forma atômica.
- [ ] Implementar autenticação, sessões, recuperação de acesso e autorização por ministério.
- [ ] Implementar os fluxos de equipe, escalas, confirmação, trocas, indisponibilidade, salas e músicas com validação de entrada/saída.
- [ ] Retornar conflitos com dados para o alerta e sugerir integrantes elegíveis e disponíveis.
- [ ] Entregar notificações internas e substituir a dependência de realtime do Supabase.
- [ ] Automatizar testes de permissão, concorrência e limite exato do início; configurar sua execução no CI.

## Definir

- [ ] Entrada de pessoas: convite, cadastro administrativo ou cadastro livre; definir também a transição de contas.
- [ ] Permissões para manter catálogos, tons por cantor e reservas de salas.
- [ ] Obrigatoriedade da identificação da escala e quais estados de participação ocupam horário, inclusive durante trocas.
- [ ] Hospedagem do servidor e do banco.

## Migração do Supabase

- [ ] Inventariar dados, policies, RPCs, triggers, duplicidades e constraints pendentes de validação.
- [ ] Mapear perfis, vínculos, funções e permissões para o novo schema, preservando identificadores e histórico quando possível.
- [ ] Transferir horários dos eventos para escalas; definir o destino dos repertórios compartilhados e preservar reservas ao retirar vínculos com eventos.
- [ ] Preservar autores de trocas quando recuperáveis; tratar autoria desconhecida e conflitos históricos sem inventar informações.
- [ ] Validar transferência e autorização em cópia de teste; preparar recuperação e corte de acesso antes de desativar o Supabase.

## Futuras features

- [ ] Permitir ao administrador configurar a duração presumida das escalas, preservando a duração adotada nas existentes.
- [ ] Entrega de notificações por push.
- [ ] Várias igrejas com isolamento de dados e permissões.
