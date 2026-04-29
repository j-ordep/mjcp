# Ideia futura - Escola Biblica

Data de registro: 2026-04-23 (America/Sao_Paulo)

Objetivo deste documento:
- registrar a frente de produto para retomada futura
- preservar perguntas de arquitetura, dominio e UX antes de implementar
- evitar misturar este fluxo com `eventos` e `escalas` sem definicao clara

---

## Resumo da ideia

Pensar em um fluxo de `escola biblica` dentro do app.

Possiveis capacidades lembradas agora:
- turmas
- professores
- registro de presenca
- escalas relacionadas
- paginas/listagens/detalhes para operacao desse modulo

Ainda nao e requisito fechado. Neste momento, o objetivo e apenas registrar e estruturar a discussao futura.

---

## Confirmado no contexto atual

- O dominio principal hoje continua sendo:
  - eventos
  - escalas
  - membros
  - trocas
- `escola biblica` ainda nao aparece como modulo fechado no estado atual do app.
- A ideia pode tocar varias areas do produto:
  - membros
  - presenca
  - funcoes/professores
  - possivelmente escalas, se houver operacao por equipe

---

## PENDENTE DE DEFINICAO

### 1. Papel do modulo no produto

- `escola biblica` sera:
  - um modulo proprio no app
  - uma area administrativa
  - uma extensao de ministerios
  - ou uma combinacao disso

### 2. Entidades principais

- O que existe no dominio:
  - turma
  - classe
  - professor
  - aluno
  - sala
  - chamada/presenca
  - calendario/aula
  - escala de apoio
- Como essas entidades se relacionam com `profiles`, `ministries` e `events`

### 3. Permissoes

- Quem pode:
  - criar turmas
  - editar turmas
  - cadastrar professores
  - registrar presenca
  - ver presenca
  - montar escalas relacionadas
- Perfis possiveis:
  - admin
  - professor
  - coordenador
  - recepcao/apoio
  - lider

### 4. Fluxo operacional

- Como acontece o ciclo basico:
  - criar turma
  - vincular professor
  - matricular/alocar pessoas
  - registrar presenca por encontro/aula
  - consultar historico
- Se a presenca e por:
  - aula/data
  - aluno
  - turma
  - todos os anteriores

### 5. Relacao com escalas

- `escala` de escola biblica usa o mesmo dominio atual de `schedule`
  - ou precisa de um subdominio proprio
- Exemplo:
  - professor da turma
  - auxiliar
  - recepcao infantil
  - apoio de sala

### 6. UI/UX e navegacao

- Onde isso entra no app:
  - nova aba/modulo proprio
  - item novo no menu
  - area administrativa
  - dentro de ministerios
- Quais paginas minimas fariam sentido:
  - lista de turmas
  - detalhe da turma
  - lista de professores
  - tela de chamada/presenca
  - historico de presencas
  - possivel agenda/calendario da turma
- O principal cuidado de UX e:
  - nao confundir `evento`, `escala` e `escola biblica`
  - deixar claro quando o usuario esta em operacao de aula/turma versus evento da igreja

---

## INFORMACAO INSUFICIENTE

- Nao ha modelagem confirmada no repo para este dominio.
- Nao ha regras fechadas de permissao.
- Nao ha decisao sobre se presenca sera individual, por turma, por encontro ou por escala.
- Nao ha definicao sobre professores serem membros comuns, lideres ou perfil proprio.

---

## Possivel ponto de partida para conversa futura

Uma primeira abordagem de arquitetura poderia ser:

- modulo proprio de `Escola Biblica`
- paginas iniciais:
  - `Turmas`
  - `TurmaDetalhe`
  - `RegistrarPresenca`
  - `Professores`
- fluxo minimo:
  - criar turma
  - vincular professor(es)
  - registrar encontro/aula
  - marcar presenca dos participantes

Mas isso ainda e apenas rascunho arquitetural, nao decisao final.

---

## Proximo passo recomendado quando retomar

Antes de implementar:
- fechar objetivo do modulo
- decidir onde ele entra na navegacao do app
- definir entidades e relacoes
- definir permissoes
- decidir se reaproveita partes do dominio atual de escalas
- so depois abrir plano tecnico e backlog de implementacao
