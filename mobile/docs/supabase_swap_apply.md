# Aplicar Migrations de Swap no Supabase

Data: 2026-04-10

Objetivo:
- aplicar no projeto Supabase as migrations pendentes do fluxo de `swap_requests`
- liberar as RPCs `accept_swap_request` e `cancel_own_swap_request`
- validar a regra de somente leitura no dia do evento ou depois

Project ref encontrado no repo:
- `ifiksgchvjiuqhttazvv`

---

## 1. Pre-requisitos

Voce precisa ter:
- Supabase CLI instalada
- acesso ao projeto Supabase correto
- terminal aberto na raiz do projeto:
  - `C:\dev\mjcp\mobile`

Comando para conferir a CLI:

```powershell
supabase --version
```

Se nao estiver instalada:

```powershell
npm install -g supabase
```

---

## 2. Login no Supabase

Se ainda nao estiver autenticado:

```powershell
supabase login
```

Isso vai abrir o fluxo de autenticacao no navegador.

---

## 3. Linkar o projeto local ao projeto remoto

Na raiz do repo:

```powershell
supabase link --project-ref ifiksgchvjiuqhttazvv
```

Se pedir o database password, use a senha do banco do projeto Supabase.

Observacao:
- o arquivo `supabase\config.toml` neste repo esta vazio
- o `project-ref` foi encontrado em `supabase\.temp\project-ref`

---

## 4. Conferir o estado antes de aplicar

Opcional, mas recomendado:

```powershell
supabase migration list
```

Voce deve verificar especialmente estas migrations:

```text
20260312000008_create_swap_requests.sql
20260312000100_create_rls_policies.sql
20260410000107_swap_request_acceptance_flow.sql
20260410000108_enforce_single_pending_swap_per_schedule.sql
20260410000109_enforce_swap_read_only_window.sql
```

---

## 5. Aplicar as migrations pendentes

Comando principal:

```powershell
supabase db push
```

Esse comando aplica no banco remoto todas as migrations locais ainda nao aplicadas.

Se o CLI mostrar diff ou pedir confirmacao, confirme apenas se o projeto remoto correto for o `ifiksgchvjiuqhttazvv`.

---

## 6. Conferir se as RPCs existem

Depois do `db push`, rode:

```powershell
supabase migration list
```

E valide no Supabase Dashboard ou SQL Editor que estas funcoes existem:

```sql
select proname
from pg_proc
where proname in (
  'accept_swap_request',
  'cancel_own_swap_request'
);
```

Tambem vale conferir se o trigger de criacao existe:

```sql
select trigger_name
from information_schema.triggers
where event_object_table = 'swap_requests'
  and trigger_name = 'swap_requests_validate_creation';
```

---

## 7. Validacao manual do fluxo

Depois de aplicar, teste nesta ordem:

1. Criar uma solicitacao de troca.
2. Cancelar a solicitacao de troca.
3. Criar novamente.
4. Tentar criar uma segunda solicitacao pendente na mesma escala.
   Resultado esperado:
   - deve falhar
5. Aceitar a troca com um usuario elegivel.
6. Tentar aceitar com usuario nao elegivel.
   Resultado esperado:
   - deve falhar
7. Testar no dia do evento ou em evento passado:
   - criar swap
   - cancelar swap
   - aceitar swap
   Resultado esperado:
   - tudo deve falhar com mensagem de escala somente leitura

---

## 8. Erros comuns

### Erro:

```text
could not find the function public.cancel_own_swap_request(p_swap_request_id) in the schema cache
```

Causa:
- migration `20260410000107_swap_request_acceptance_flow.sql` nao foi aplicada no projeto remoto

Correcao:

```powershell
supabase db push
```

### Erro de projeto errado

Confirme o projeto linkado:

```powershell
supabase link --project-ref ifiksgchvjiuqhttazvv
```

### Migration nao aparece como aplicada

Confira:

```powershell
supabase migration list
```

Se houver divergencia entre local e remoto, nao saia apagando coisas manualmente no banco. Revise primeiro o estado real das migrations.

---

## 9. Ordem minima relevante para swap

Se voce quiser revisar a dependencia logica:

1. `20260312000008_create_swap_requests.sql`
   - cria a tabela
2. `20260312000100_create_rls_policies.sql`
   - habilita RLS e policies base
3. `20260410000107_swap_request_acceptance_flow.sql`
   - cria `accept_swap_request` e `cancel_own_swap_request`
4. `20260410000108_enforce_single_pending_swap_per_schedule.sql`
   - bloqueia segunda solicitacao pendente
5. `20260410000109_enforce_swap_read_only_window.sql`
   - bloqueia create/cancel/accept no dia do evento ou depois

---

## 10. Depois disso

Se o `db push` passar e ainda houver erro no app:
- capture a mensagem exata
- verifique se o erro vem da RPC, da RLS ou de dados inconsistentes
- com a mensagem exata fica facil corrigir
