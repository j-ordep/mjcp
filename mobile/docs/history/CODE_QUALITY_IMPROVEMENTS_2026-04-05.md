# Melhorias Estruturais - 2026-04-05

## Resumo

Este documento registra as melhorias feitas para deixar o codigo mais legivel, mais previsivel e mais facil de mudar antes de continuar adicionando novas features.

Objetivo das mudancas:
- reduzir regra de negocio espalhada pela UI
- centralizar comportamento de data/hora de eventos
- melhorar tipagem de navegacao
- diminuir risco de regressao em alteracoes futuras

Status atual:
- a base ficou melhor e mais segura para continuar
- ainda nao esta "arrumada por completo"
- ja da para seguir com features pequenas e medias
- antes de features maiores, ainda vale melhorar tipagem do Supabase e remover `any` dos fluxos principais

---

## O que foi feito

### 1. Regra de data de evento saiu da tela e foi centralizada

Antes, a tela de criacao de evento decidia sozinha:
- data default
- hora default
- duracao default
- como converter para `ISO`

Isso dificultava manutencao porque qualquer mudanca exigia procurar comportamento em varios lugares.

Agora existe um ponto unico em `src/utils/eventDate.ts`.

Trecho:

```ts
const EVENT_DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

export function getDefaultEndAt(startAt: Date) {
  return new Date(startAt.getTime() + EVENT_DEFAULT_DURATION_MS);
}
```

E tambem:

```ts
export function normalizeEventRange(input: {
  startAt?: string | null;
  endAt?: string | null;
  requireFutureStart?: boolean;
}) {
  const startDate = input.startAt ? new Date(input.startAt) : getNow();
  const endDate = input.endAt ? new Date(input.endAt) : getDefaultEndAt(startDate);
}
```

Por que isso e melhor:
- a regra de `3 horas` fica em um lugar so
- o fallback de `now` deixa de ficar escondido na UI
- validacao de intervalo invalido fica reutilizavel
- facilita mudar duracao padrao depois sem procurar hardcode espalhado

Arquivos afetados:
- `src/utils/eventDate.ts`
- `src/services/eventService.ts`
- `src/screens/app/CreateEventScreen.tsx`

---

### 2. `eventService` passou a normalizar e validar intervalo

Antes, `eventService` aplicava um fallback proprio e diferente do que estava na tela.

Trecho anterior relevante:

```ts
start_at: eventData.start_at || new Date().toISOString(),
end_at: eventData.end_at || new Date(Date.now() + 3600000).toISOString(),
```

Problemas:
- duracao padrao era `1 hora`
- a tela usava outra regra
- a validacao ficava incoerente entre pontos diferentes do sistema

Agora o service usa a mesma regra centralizada:

```ts
const normalizedRange = normalizeEventRange({
  startAt: eventData.start_at,
  endAt: eventData.end_at,
  requireFutureStart: true,
});
```

Por que isso e melhor:
- evita divergencia entre tela e service
- garante que criacao em lote e criacao simples sigam a mesma regra
- reduz bug silencioso de duracao diferente dependendo da rota do codigo

Arquivo:
- `src/services/eventService.ts`

---

### 3. `CreateEventScreen` passou a abrir com default dinamico do sistema

Antes, a tela iniciava com campos vazios e exigia mais preenchimento manual.

Agora ela usa a data/hora atual do sistema no momento em que o formulario abre.

Trecho:

```ts
const [time, setTime] = useState(() => formatTimeFromDate(getNow()));
const [selectedDays, setSelectedDays] = useState<Record<string, any>>(() => {
  const todayKey = formatLocalDateKey(getNow());
  return { [todayKey]: { selected: true, selectedColor: '#000' } };
});
```

Tambem deixou de hardcodar calculo de termino:

```ts
end_at: getDefaultEndAt(eventDate).toISOString(),
```

Por que isso e melhor:
- segue a regra de produto definida
- evita formulario inconsistente com o backlog
- reduz duplicacao de calculo de data

Arquivo:
- `src/screens/app/CreateEventScreen.tsx`

---

### 4. Navegacao das telas principais ficou tipada

Antes, algumas telas recebiam `route` e `navigation` sem tipagem forte.

Exemplo anterior:

```ts
export default function EventDetailsScreen({ route, navigation }) {
```

Agora os tipos sao expostos pelo navigator:

```ts
export type EventDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "EventDetails"
>;
```

E consumidos pela tela:

```ts
export default function EventDetailsScreen({
  route,
  navigation,
}: EventDetailsScreenProps) {
```

Por que isso e melhor:
- evita erro de parametro de rota
- melhora autocomplete e refactor
- deixa mais claro o contrato entre telas

Arquivos afetados:
- `src/navigation/AppNavigator.tsx`
- `src/screens/app/EventDetailsScreen.tsx`
- `src/screens/app/CreateEventScreen.tsx`

---

## O que isso melhora na pratica

### Leitura

O codigo agora comunica melhor:
- onde esta a regra de data do evento
- onde a navegacao define seus contratos
- onde alterar fallback de horario e duracao

### Mudanca

Ficou mais facil alterar:
- duracao padrao de evento
- validacao de data futura
- comportamento de campos default
- parametros de navegacao das telas principais

### Risco

Foi reduzido o risco de:
- service e UI usarem regras diferentes
- mudar uma tela e esquecer outra
- quebrar rota por parametro errado sem perceber

---

## O que ainda falta melhorar

Estes pontos ainda atrapalham manutencao:

### 1. `database.types.ts` ainda esta vazio

Arquivo:
- `src/types/database.types.ts`

Impacto:
- a integracao com Supabase continua sem o melhor nivel de seguranca de tipos
- parte dos joins ainda depende de cast manual

### 2. Ainda existem `any` e joins pouco tipados

Exemplo recorrente:
- `src/services/scheduleService.ts`

Impacto:
- dificulta mudar shape de consulta com seguranca
- aumenta chance de erro em runtime

### 3. Algumas telas ainda acumulam responsabilidade demais

Exemplo:
- `src/screens/app/CreateScheduleScreen.tsx`

Hoje essa tela mistura:
- carregamento de contexto
- criacao da escala
- warnings
- adicao de assignments
- renderizacao de lista escalada

Impacto:
- a tela continua legivel, mas muda-la fica mais caro do que deveria

---

## Estamos prontos para novas features?

Resposta curta: sim, mas com criterio.

Recomendacao:
- pode seguir com a proxima feature se ela for bem focada
- antes de uma rodada maior de features, ainda vale fazer mais uma etapa de arrumacao

Melhor proximo bloco tecnico:
1. preencher `src/types/database.types.ts`
2. reduzir `any` do `scheduleService`
3. tipar melhor os payloads de evento/escala

Se a proxima feature for pequena:
- pode seguir agora

Se a proxima feature mexer forte em escalas, assignments e cards:
- melhor fazer mais uma rodada de tipagem antes

---

## Validacao feita

Foi executado:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

Resultado:
- tipagem compilou sem erro apos as mudancas desta rodada
