# Event Core Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o contrato do core de eventos explícito no código: reunião continua sendo evento, audiência privada representa convite + visibilidade no MVP, e as telas informativas passam a depender de um shape canônico de apresentação.

**Architecture:** Manter `events` como entidade central e evitar nova tabela para reunião. Extrair dois utilitários puros e pequenos: um para a semântica de audiência privada e outro para o payload informativo usado por `EventsScreen` e `EventDetailsScreen`. Reusar esses utilitários no service layer e nas telas, sem acoplar evento ao fluxo de escalas ou ao módulo de salas.

**Tech Stack:** React Native, TypeScript, Zustand, Supabase, `node:test`

---

## File Map

- Modify: `src/utils/eventCategory.ts`
  - Corrigir labels/values de categoria em pt-BR e manter `EBD` coberta por `ensino`.
- Modify: `src/types/models.ts`
  - Deixar comentários e semântica do domínio de evento mais claros.
- Create: `src/utils/eventAudience.ts`
  - Centralizar normalização e validação da audiência privada.
- Create: `src/utils/eventPresentation.ts`
  - Gerar o shape informativo canônico para cards e detalhe de evento.
- Modify: `src/services/eventService.ts`
  - Reusar `eventAudience.ts` e manter o service como orquestrador, não como dono da semântica.
- Modify: `src/screens/app/EventsScreen.tsx`
  - Consumir `eventPresentation.ts` em vez de mapear campos soltos na tela.
- Modify: `src/screens/app/EventDetailsScreen.tsx`
  - Consumir `eventPresentation.ts` e manter a tela puramente informativa.
- Modify: `package.json`
  - Incluir os novos testes unitários na suíte.
- Modify: `tests/eventCategory.test.ts`
  - Atualizar a fonte de verdade das categorias para os valores corretos em pt-BR.
- Create: `tests/eventAudience.test.ts`
  - Cobrir deduplicação/trim e regra de evento privado.
- Create: `tests/eventPresentation.test.ts`
  - Cobrir o shape informativo canônico.
- Modify: `docs/CONTEXT.md`
- Modify: `docs/NEXT_STEPS_PLAN.md`
- Modify: `docs/TASKS.md`
  - Registrar o fechamento da Fase 1 quando a implementação terminar.

---

### Task 1: Normalizar categorias e terminologia compartilhada

**Files:**
- Modify: `src/utils/eventCategory.ts`
- Modify: `src/types/models.ts`
- Test: `tests/eventCategory.test.ts`

- [ ] **Step 1: Escrever o teste vermelho das categorias**

```ts
test("EVENT_CATEGORY_OPTIONS exposes canonical pt-BR categories", () => {
  assert.deepEqual(
    EVENT_CATEGORY_OPTIONS.map((option) => option.value),
    ["geral", "culto", "ensino", "jovens", "oração", "reunião", "especial"],
  );
});

test("ensino remains the category that covers EBD", () => {
  assert.equal(getEventCategoryLabel("ensino"), "Ensino");
  assert.equal(normalizeEventCategory("ebd"), "ensino");
});
```

- [ ] **Step 2: Rodar o teste para verificar a falha**

Run: `npm run test:build && node .tests-dist/tests/eventCategory.test.js`

Expected: FAIL porque `eventCategory.ts` e o teste atual ainda carregavam valores com encoding quebrado (`oracao`, `reuniao`).

- [ ] **Step 3: Implementar a correção mínima**

```ts
export const EVENT_CATEGORY_OPTIONS = [
  { value: "geral", label: "Geral", ... },
  { value: "culto", label: "Culto", ... },
  { value: "ensino", label: "Ensino", ... },
  { value: "jovens", label: "Jovens", ... },
  { value: "oração", label: "Oração", ... },
  { value: "reunião", label: "Reunião", ... },
  { value: "especial", label: "Especial", ... },
] as const;
```

```ts
export interface Event {
  // ...
  is_public: boolean;
  visible_to_user_ids?: string[]; // convite + visibilidade no MVP
}
```

- [ ] **Step 4: Rodar o teste para verificar que passou**

Run: `npm run test:build && node .tests-dist/tests/eventCategory.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/eventCategory.ts src/types/models.ts tests/eventCategory.test.ts
git commit -m "fix(events): normalize event categories in pt-BR"
```

---

### Task 2: Extrair o contrato de audiência privada

**Files:**
- Create: `src/utils/eventAudience.ts`
- Modify: `src/services/eventService.ts`
- Test: `tests/eventAudience.test.ts`
- Test: `tests/eventService.test.ts`

- [ ] **Step 1: Escrever o teste vermelho da audiência privada**

```ts
test("normalizeAudienceUserIds trims, dedupes and drops empty ids", () => {
  assert.deepEqual(
    normalizeAudienceUserIds([" user-1 ", "user-1", "", "user-2 "]),
    ["user-1", "user-2"],
  );
});

test("assertPrivateAudienceSelection rejects private events without selected users", () => {
  assert.throws(
    () => assertPrivateAudienceSelection(false, []),
    /Selecione pelo menos um membro para evento privado/,
  );
});
```

- [ ] **Step 2: Rodar o teste para verificar a falha**

Run: `npm run test:build && node .tests-dist/tests/eventAudience.test.js`

Expected: FAIL com `Cannot find module '../src/utils/eventAudience'`

- [ ] **Step 3: Implementar a extração mínima**

```ts
export function normalizeAudienceUserIds(userIds: string[] | undefined) {
  return Array.from(
    new Set((userIds ?? []).map((userId) => userId.trim()).filter(Boolean)),
  );
}

export function assertPrivateAudienceSelection(
  isPublic: boolean,
  visibleUserIds: string[],
) {
  if (!isPublic && visibleUserIds.length === 0) {
    throw new Error("Selecione pelo menos um membro para evento privado.");
  }
}
```

```ts
// src/services/eventService.ts
import {
  assertPrivateAudienceSelection,
  normalizeAudienceUserIds,
} from "../utils/eventAudience";
```

- [ ] **Step 4: Rodar os testes para verificar que passaram**

Run: `npm run test:build && node .tests-dist/tests/eventAudience.test.js && node .tests-dist/tests/eventService.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/eventAudience.ts src/services/eventService.ts tests/eventAudience.test.ts tests/eventService.test.ts
git commit -m "refactor(events): extract private audience contract"
```

---

### Task 3: Criar o payload canônico das superfícies informativas

**Files:**
- Create: `src/utils/eventPresentation.ts`
- Modify: `src/screens/app/EventsScreen.tsx`
- Modify: `src/screens/app/EventDetailsScreen.tsx`
- Test: `tests/eventPresentation.test.ts`

- [ ] **Step 1: Escrever o teste vermelho do payload informativo**

```ts
test("toInformationalEventViewModel returns canonical data for event surfaces", () => {
  const event = {
    id: "event-1",
    title: "Reunião de obreiros",
    category: "reunião",
    description: null,
    location: null,
    start_at: "2026-05-01T19:00:00.000Z",
    end_at: "2026-05-01T21:00:00.000Z",
    is_public: false,
  };

  assert.deepEqual(toInformationalEventViewModel(event), {
    title: "Reunião de obreiros",
    category: "reunião",
    startAt: "2026-05-01T19:00:00.000Z",
    endAt: "2026-05-01T21:00:00.000Z",
    location: "Não informado",
    description: "Sem descrição.",
  });
});
```

- [ ] **Step 2: Rodar o teste para verificar a falha**

Run: `npm run test:build && node .tests-dist/tests/eventPresentation.test.js`

Expected: FAIL com `Cannot find module '../src/utils/eventPresentation'`

- [ ] **Step 3: Implementar a extração mínima**

```ts
export interface InformationalEventViewModel {
  title: string;
  category: EventCategory;
  startAt: string;
  endAt: string | null;
  location: string;
  description: string;
}

export function toInformationalEventViewModel(
  event: Pick<Event, "title" | "category" | "start_at" | "end_at" | "location" | "description">,
): InformationalEventViewModel {
  return {
    title: event.title,
    category: normalizeEventCategory(event.category),
    startAt: event.start_at,
    endAt: event.end_at ?? null,
    location: event.location || "Não informado",
    description: event.description || "Sem descrição.",
  };
}
```

```ts
// src/screens/app/EventsScreen.tsx
const viewModel = toInformationalEventViewModel(item);
<EventCard
  title={viewModel.title}
  category={viewModel.category}
  startAt={viewModel.startAt}
  endAt={viewModel.endAt}
  location={viewModel.location}
  description={viewModel.description}
  showActions={false}
/>
```

```ts
// src/screens/app/EventDetailsScreen.tsx
const viewModel = toInformationalEventViewModel(event);
<EventInfoCard
  title={viewModel.title}
  category={viewModel.category}
  startAt={viewModel.startAt}
  endAt={viewModel.endAt}
  location={viewModel.location}
  description={viewModel.description}
/>
```

- [ ] **Step 4: Rodar os testes e o typecheck**

Run: `npm run test:build && node .tests-dist/tests/eventPresentation.test.js && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/eventPresentation.ts src/screens/app/EventsScreen.tsx src/screens/app/EventDetailsScreen.tsx tests/eventPresentation.test.ts
git commit -m "refactor(events): add informational event view model"
```

---

### Task 4: Atualizar docs e validar o contrato da Fase 1

**Files:**
- Modify: `docs/CONTEXT.md`
- Modify: `docs/NEXT_STEPS_PLAN.md`
- Modify: `docs/TASKS.md`
- Modify: `docs/EVENT_CORE_PLAN.md`

- [ ] **Step 1: Atualizar a documentação viva**

```md
- `EBD` continua coberta por `ensino`
- `event_audiences` representa convite + visibilidade no MVP
- `EventDetailsScreen` continua informativa, inclusive para `admin`
```

- [ ] **Step 2: Rodar a validação final**

Run: `npm test`

Expected: PASS em toda a suíte unitária

Run: `npx tsc --noEmit`

Expected: PASS sem erros de tipagem

- [ ] **Step 3: Revisar diff antes do commit**

Run: `git diff -- src/utils/eventCategory.ts src/utils/eventAudience.ts src/utils/eventPresentation.ts src/services/eventService.ts src/screens/app/EventsScreen.tsx src/screens/app/EventDetailsScreen.tsx src/types/models.ts tests/eventCategory.test.ts tests/eventAudience.test.ts tests/eventPresentation.test.ts docs/CONTEXT.md docs/NEXT_STEPS_PLAN.md docs/TASKS.md docs/EVENT_CORE_PLAN.md`

Expected: diff restrito ao contrato do core de eventos, sem tocar fluxo de escalas ou salas

- [ ] **Step 4: Commit**

```bash
git add src/utils/eventCategory.ts src/utils/eventAudience.ts src/utils/eventPresentation.ts src/services/eventService.ts src/screens/app/EventsScreen.tsx src/screens/app/EventDetailsScreen.tsx src/types/models.ts tests/eventCategory.test.ts tests/eventAudience.test.ts tests/eventPresentation.test.ts docs/CONTEXT.md docs/NEXT_STEPS_PLAN.md docs/TASKS.md docs/EVENT_CORE_PLAN.md
git commit -m "chore(events): lock event core phase 1 contract"
```

---

## Self-Review

- O plano cobre o recorte fechado com o produto:
  - reunião continua sendo evento
  - `EBD` continua em `ensino`
  - audiência privada continua sendo convite + visibilidade
  - detalhe do evento continua informativo
- O plano evita criar novas tabelas ou novo módulo para reunião.
- O plano não mistura fase de salas com a Fase 1 do core de eventos.
