# Problemas de UX e Comportamento — Modal "Preciso Trocar"

## Contexto Geral
Existe um botão chamado **"Preciso trocar"** que abre um modal do tipo **bottom sheet** (slide de baixo para cima), utilizado para solicitar a troca de escala com outra pessoa.

O comportamento atual apresenta problemas visuais, de UX e bugs funcionais.

---

## 1. Problema de Animação do Fundo (Overlay)

### Comportamento Atual
- Ao abrir o modal, o fundo da tela (screen base) fica escurecido (overlay).
- Esse escurecimento **não aparece instantaneamente**.
- O overlay sobe junto com o modal, acompanhando a animação de slide.

### Problema
- Esse comportamento quebra a UX esperada.
- O overlay deveria ser independente da animação do modal.
- Visualmente parece que o fundo está "grudado" no modal, o que causa estranheza.

### Comportamento Esperado
- O overlay deve:
  - Aparecer imediatamente (fade-in leve, opcional).
  - NÃO se mover junto com o modal.
- O modal deve animar sozinho (slide-up).

---

## 2. Problema de Lógica de Negócio no Modal

### Objetivo do Modal
Permitir que o usuário solicite troca de escala com outra pessoa.

### Comportamento Esperado
O modal deve apresentar:
- Lista de pessoas que:
  - Pertencem ao **mesmo ministério**.
  - Podem exercer a **mesma função/posição**.

### Fluxo Esperado
1. Usuário abre o modal.
2. Visualiza lista filtrada corretamente.
3. Seleciona uma pessoa.
4. (Opcional) Escreve uma mensagem.
5. Envia solicitação de troca.

### Problema Atual
- A listagem não está claramente alinhada com essa regra (necessário validar).
- Possível ausência ou inconsistência no filtro por:
  - Ministério
  - Função

---

## 3. Bug Crítico — Teclado Sobrepondo Modal

### Comportamento Atual
- Ao focar no campo de mensagem:
  - O teclado abre.
  - O teclado fica **sobre o modal**, cobrindo conteúdo importante.

### Problemas
- Parte do modal fica invisível.
- Usuário perde contexto do que está fazendo.
- UX comprometida.

### Comportamento Esperado
- O modal deve:
  - Subir automaticamente acima do teclado, OU
  - Ajustar layout (resize / scroll)
- Conteúdo sempre visível.

---

## 4. Bug Crítico — Teclado Não Fecha

### Comportamento Atual
O teclado NÃO fecha em nenhuma das seguintes ações:
- Pressionar "return"
- Arrastar para baixo
- Tocar fora do input

### Problema
- Usuário fica preso com o teclado aberto.
- Fluxo interrompido.
- Sensação de travamento do app.

### Comportamento Esperado
O teclado deve fechar ao:
- Pressionar "return" (dependendo do tipo de input)
- Tocar fora do campo
- Arrastar gesture (iOS padrão)
- Submeter ação

---

## 5. Impacto Geral

### Severidade
Alta — afeta diretamente:
- UX
- Usabilidade
- Confiança do usuário

### Tipos de Problema
- UI/UX inconsistente
- Quebra de padrão de interação mobile (iOS)
- Bug funcional (teclado)

---

## 6. Hipóteses Técnicas (para investigação)

### Overlay
- Overlay pode estar dentro do mesmo container animado do modal.
- Correto seria separar:
  - Layer do overlay (fixo)
  - Layer do modal (animado)

### Teclado
Possíveis causas:
- Falta de:
  - KeyboardAvoidingView (React Native)
  - Ajuste de insets
  - Listener de keyboard events
- Input sem controle de blur
- Modal bloqueando eventos externos

---

## 7. Prioridades

1. Corrigir bug do teclado não fechar (crítico)
2. Ajustar comportamento do teclado sobre o modal
3. Corrigir animação do overlay
4. Validar regra de negócio da listagem

---

## 8. Resultado Esperado

- Modal fluido e previsível
- Interação compatível com padrões iOS e android
- Teclado funcionando corretamente
- Lista correta de usuários para troca
- se possivel notificar o lider do ministerio quando ocorrer trocas de membros da equipe, mas isso pode ser backlog, adicione isso nas tasks


  sobre o fluxo de swap_requests, na verdade o lider só recebe notificação, não precisa necessariamente de aprovação, precisa que alguem aceite a troca somente, a ideia é o lider escalar o joao, se o joao não puder ele solicita uma troca, isso envia uma notificação para todos que exercem a mesma função que o joao foi escalado, exemplo guitarra, e a "aprovação" é pela primeira pessoa que aceitar (cuidado com concorrencia), já o lider sempre recebera essa notificação e ele pode deixar a vaga "vazia", ele pode aceitar ou somente remover o joao da escala e ficar sem guitarra. (documente isso)

  sobre o modal, não sei, o aplicativo é tanto para android quanto para IOS, o que é mais garantido de ter um bom funcionamento nos dois? não precisa ser botton sheet, pode ser um modal no meio da tela mesmo, ou ate uma nova tela mas não vejo necessidade
