# Fluxo de Swap Requests + Diretrizes de UI (Cross-Platform)

## 1. Objetivo

Definir corretamente:
- Regra de negócio do fluxo de **troca de escala (swap_requests)**
- Papel do líder vs participantes
- Comportamento concorrente
- Diretriz de UI estável para Android e iOS

---

## 2. Correção de Premissa (Importante)

### NÃO existe aprovação do líder

- O líder **não aprova** a troca.
- O líder apenas:
  - Recebe notificação
  - Pode agir manualmente na escala

### A troca é validada por:
➡️ **A primeira pessoa que aceitar a solicitação**

---

## 3. Fluxo Correto de Swap

### Cenário base

1. Líder escala **João** para uma função (ex: guitarra)
2. João não pode comparecer
3. João solicita uma troca

---

### Disparo da Solicitação

Ao solicitar troca:

- O usuario pode ter apenas uma solicitacao pendente por escala
- Se ja existir uma solicitacao pendente naquela escala:
  - nao pode criar outra
  - deve primeiro cancelar a solicitacao atual
- O proprio solicitante pode cancelar uma solicitacao pendente antes do aceite
- Enquanto a solicitacao estiver `PENDING`, ela bloqueia nova solicitacao para a mesma escala

- Enviar notificação para:
  - Todos os usuários que:
    - Pertencem ao **mesmo ministério**
    - Exercem a **mesma função** (ex: guitarra)

- Enviar também notificação para:
  - Líder responsável pela escala

---

## 4. Regra de Aceite (Crítico)

### Quem valida a troca?

➡️ **Primeira pessoa que aceitar**

### Regras:

- A troca NÃO depende do líder
- NÃO existe múltipla aprovação
- NÃO existe fila de aprovação

---

### Problema de Concorrência (CRÍTICO)

Cenário:
- Várias pessoas recebem a notificação
- Mais de uma tenta aceitar ao mesmo tempo

### Requisito obrigatório:

- Garantir que **apenas UMA pessoa consiga aceitar**

### Estratégias possíveis (nível conceitual):

- Lock otimista (status + verificação)
- Transação no banco
- "First write wins"

### Estado esperado:

```text
PENDING -> ACCEPTED
PENDING -> CANCELLED
READ_ONLY on event day or after
```

## 5. Decisoes adicionais de produto (2026-04-10)

- Nao e necessario manter historico forte de substituicao entre pessoas
- Nao e prioridade guardar uma trilha detalhada como:
  - "Joao foi escalado originalmente e depois trocou com Marcelo"
- O historico mais relevante para produto fica no fluxo de notificacoes
- Esse historico/notificacao e especialmente util para acompanhamento do lider
- A escala deixa de ser editavel no proprio dia do evento e depois dele
- Isso vale para toda a operacao:
  - montagem da equipe
  - adicao/remocao de assignments
  - confirmacao
  - pedido de troca
  - aceite de troca
- A partir do dia do evento, a escala passa a ser somente leitura e vira historico
- Limpeza/retencao de escalas antigas pode ser discutida no futuro, mas nao e prioridade agora
