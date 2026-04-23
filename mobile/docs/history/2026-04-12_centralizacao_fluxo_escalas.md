# Centralizacao do Fluxo de Escalas e Trocas

Data: 2026-04-12 (America/Sao_Paulo)

## Decisao

- `ScheduleScreen` passa a ser o hub principal do dominio de escalas.
- O acesso primario a `SwapRequestsScreen` deve acontecer a partir de `ScheduleScreen`.
- A Home deixa de ser ponto de entrada primario para trocas.

## Motivacao

- A Home e dashboard geral, nao area operacional de escalas.
- O dominio de trocas pertence semanticamente ao fluxo de escalas.
- Centralizar reduz quebra de contexto e melhora a orientacao do usuario.

## Aplicacao na UI

- Renomear `MySchedulesScreen` para `ScheduleScreen`.
- Manter a Home com atalho para `Escalas`.
- Deixar o card antigo de trocas na Home inativo por enquanto.
- Adicionar um card de navegacao de segundo nivel dentro de `ScheduleScreen`, acima da busca e dos filtros:
  - titulo: `Trocas de escala`
  - descricao: `Acompanhe solicitacoes, trocas disponiveis e respostas`
  - acao: abrir `SwapRequestsScreen`
- Ao tocar em uma escala no hub, todos os perfis devem abrir `EditScheduleScreen`:
  - `admin` e `leader` no modo gerencial
  - `member` no modo de participacao, sem acoes administrativas

## Racional de UX

Seguindo a direcao usada para composicao de tela e hierarquia de secoes, o acesso a trocas deve aparecer como bloco de navegacao de dominio, e nao como CTA dentro de cada card individual de escala.

Por isso, o posicionamento recomendado e:

1. card de acesso a trocas
2. busca e filtros
3. lista de escalas

## Confirmado no codigo

- `ScheduleScreen` concentra confirmacao, troca direta por card, criacao de escala e abertura dos detalhes.
- `ScheduleScreen` nao deve redirecionar o membro para a tela antiga de `EventDetails` ao abrir uma escala.
- `SwapRequestsScreen` continua sendo a tela dedicada de acompanhamento.
- A Home continua existindo como dashboard, mas nao deve ser a entrada principal para trocas.

## Pendencias futuras

- Reavaliar se o card inativo da Home deve virar outro atalho de produto.
- Revisar se notificacoes de swap devem continuar abrindo `SwapRequestsScreen` direto ou primeiro retornar ao hub de `ScheduleScreen`.
