# Ideia futura - Cadastro de visitante

Data de registro: 2026-04-23 (America/Sao_Paulo)

Objetivo deste documento:
- registrar a ideia para retomada futura
- preservar perguntas de arquitetura e produto antes de qualquer implementacao
- evitar que a ideia se perca antes de virar escopo fechado

---

## Resumo da ideia

Pensar em um fluxo de `registrar visitante` dentro do app.

Cenario imaginado hoje:
- algum usuario da igreja abre uma acao como `Registrar visitante`
- preenche um formulario simples no app
- registra dados basicos do visitante para acompanhamento posterior

Exemplos de campos inicialmente lembrados:
- nome
- telefone
- quem convidou
- observacoes basicas, se fizer sentido no fluxo

---

## Confirmado no contexto atual

- A ideia surgiu como backlog de produto, nao como requisito fechado.
- Ainda nao existe regra de negocio validada para esse fluxo.
- A intencao neste momento e apenas lembrar e arquitetar melhor depois.
- O app hoje tem dominio principal mais maduro em:
  - eventos
  - escalas
  - membros
  - trocas

---

## PENDENTE DE DEFINICAO

- Quem pode registrar visitante:
  - qualquer membro
  - apenas recepcao
  - apenas `admin`
  - apenas pastores
  - alguma combinacao desses papeis
- Se o visitante vira apenas um registro simples ou parte de um fluxo maior de acompanhamento.
- Quais campos sao obrigatorios no MVP.
- Se `quem convidou` aponta para:
  - membro existente
  - texto livre
  - ambos
- Se o cadastro deve permitir:
  - visitante unico
  - familia/grupo
  - multiplos contatos
- Se havera status posterior, por exemplo:
  - primeiro contato
  - retorno
  - integrado
  - acompanhamento pastoral
- Se o fluxo precisa de LGPD/consentimento explicito para dados pessoais.
- Se isso fica em modulo proprio ou dentro de algum contexto existente no app.

---

## INFORMACAO INSUFICIENTE

- Nao ha evidencia no repo, neste momento, de modelagem pronta para visitantes.
- Nao ha definicao confirmada de permissao, ownership ou ciclo de vida desse dado.
- Nao ha decisao sobre notificacoes, follow-up ou relatórios para visitantes.

---

## Possivel direcao inicial para discutir depois

Opcao mais simples para um futuro MVP:
- criar uma tela/formulario de `Registrar visitante`
- campos minimos:
  - nome
  - telefone
  - quem convidou
- acesso inicial restrito a perfis operacionais definidos depois
- lista basica de visitantes cadastrados para acompanhamento

Isso e apenas ponto de partida para conversa, nao decisao final.

---

## Proximo passo recomendado quando retomar

Antes de implementar:
- fechar objetivo de produto
- fechar regra de permissao
- desenhar modelo de dados
- definir se o visitante se relaciona com membro, evento, culto ou acompanhamento
- so depois abrir plano tecnico e backlog de implementacao
