# Modelo de Escalas, Capabilities, Assignments e Trocas

Data de reconciliacao: 2026-04-10 (America/Sao_Paulo)

> Este documento foi alinhado ao estado atual do codigo e das migrations.
> Para estrutura, constraints e RLS, a fonte primaria continua sendo `supabase/migrations/*.sql`.

---

## 1. Capability vs Assignment

| Conceito | O que e | Onde vive | Quem gerencia |
| --- | --- | --- | --- |
| Capability | O que o membro sabe fazer | `ministry_member_roles` | Lider/admin do ministerio |
| Assignment | O que o membro fara em um evento | `schedule_assignments` | Lider/admin ao montar a escala |

Resumo pratico:

- capability e catalogo de aptidoes
- assignment e a escolha feita para uma escala concreta

---

## 2. Modelo atual

### Membership

`ministry_members` diz que o usuario pertence a um ministerio.

### Capability

`ministry_member_roles` diz quais roles aquele membro consegue exercer naquele ministerio.

### Schedule

`schedules` representa o bloco de escala de um ministerio dentro de um evento.

### Assignment

`schedule_assignments` representa a atribuicao real dentro da escala.

O modelo atual permite:

- o mesmo membro em mais de um ministerio
- o mesmo membro com mais de uma capability no mesmo ministerio
- o mesmo membro com mais de uma role na mesma escala, desde que a combinacao `(schedule_id, user_id, role_id)` seja unica

---

## 3. Fluxo atual de criacao e montagem

1. lider/admin cria a escala em `CreateScheduleScreen`
2. depois abre `EditScheduleScreen`
3. a equipe e montada com base em:
   - membro pertence ao ministerio
   - role pertence ao ministerio da escala
   - membro tem capability para a role
4. o sistema pode mostrar warnings de:
   - indisponibilidade (`blocked_dates`)
   - conflito de horario
5. warnings nao bloqueiam por si so; o lider decide continuar ou nao

---

## 4. Conflitos

O projeto hoje trata conflito como warning operacional, nao como bloqueio duro.

### Confirmado no codigo

- conflitos sao verificados no service layer
- indisponibilidade tambem entra como warning
- a validacao dura fica para:
  - membership no ministerio
  - role pertencente ao ministerio da escala
  - capability para a role
  - editabilidade temporal da escala/evento em fluxos sensiveis

### PENDENTE DE DEFINICAO

- politica final de produto para conflitos de horario:
  - warning sempre
  - ou bloqueio em casos especificos

---

## 5. Fluxo atual de troca

O fluxo implementado hoje e:

1. o proprio usuario cria a troca para um assignment seu
2. se o assignment estava confirmado, ele volta imediatamente para pendente
3. a solicitacao fica pendente
4. membros elegiveis do mesmo ministerio e mesma role/capability podem visualizar a troca
5. a primeira pessoa elegivel que aceitar assume a escala
6. pedidos concorrentes remanescentes para aquele assignment sao cancelados
7. o solicitante pode cancelar a propria troca enquanto ela estiver pendente

### Regras confirmadas nas migrations

- nao pode haver duplicacao invalida de pedido pendente
- o solicitante nao pode aceitar a propria troca
- a pessoa elegivel nao pode assumir uma role identica ja ocupada por ela na mesma escala
- no dia do evento ou depois dele, a troca fica bloqueada para:
  - criar
  - aceitar
  - cancelar
- leitura de eventos e escalas continua dependente das policies base de visibilidade
- a janela temporal de editabilidade vale apenas para mutacoes da escala e dos assignments

### PENDENTE DE DEFINICAO

- estrategia final de notificacoes para lider e elegiveis

---

## 6. Status de assignment

Os status hoje aceitos no modelo sao:

- `pending`
- `confirmed`
- `declined`
- `swapped`

### Confirmado no codigo

- `confirmed` esta em uso nas telas e services
- `swapped` existe no modelo
- os valores persistidos no banco seguem em ingles por compatibilidade de schema, mas a UI deve exibir os status em pt-BR

### INFORMACAO INSUFICIENTE

- fluxo completo de `declined` ainda nao esta exposto de forma clara na UI principal

---

## 7. Telas relevantes do fluxo

- `src/screens/app/CreateScheduleScreen.tsx`
- `src/screens/app/EditScheduleScreen.tsx`
- `src/screens/app/ScheduleScreen.tsx`
- `src/screens/app/EventDetailsScreen.tsx`
- `src/screens/app/SwapRequestsScreen.tsx`
- `src/screens/app/ManageMinistryMembersScreen.tsx`

Observacao:

- `EventDetailsScreen` deve ser somente informativa; presenca, troca e equipe ficam no fluxo de escala

---

## 8. Pendencias reais do fluxo

### Confirmado no backlog e no codigo

- falta revisar a experiencia do usuario escalado entre telas
- falta conectar notificacoes
- falta ampliar testes do service layer

### Divergencias que nao devem ser esquecidas

- a regra de somente leitura em historico precisa continuar sendo auditada tela a tela
- documentacao antiga que tratava troca como "lider aprova" nao representa mais o modelo atual
