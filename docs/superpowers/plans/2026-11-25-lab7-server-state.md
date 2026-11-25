# ЛР №7: серверные задачи и TanStack Query — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести задачи Campus Planner с локального `TasksContext` на Campus API и TanStack Query, сохранив вход ЛР №6, отмену удаления, поиск, фильтры, статистику и подсветку новой задачи.

**Architecture:** API-слой (`client.ts` + `tasks.ts`) отдаёт типизированные функции; `QueryClient` создаётся один раз в корне; `useQuery` читает список/детали, `useMutation` меняет данные и инвалидирует ключи с `user.id`. UI-состояние (фильтр, поиск, подсветка, отложенное удаление) живёт в `TasksUiProvider`; серверный массив задач в Context не дублируется.

**Tech Stack:** Expo SDK 57, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, Expo Router ~57.0.31, `@tanstack/react-query`, Campus API.

**Spec:** `docs/superpowers/specs/2026-11-25-lab7-server-state-design.md`

## Global Constraints

- Все запросы к задачам идут только с `Authorization: Bearer <accessToken>`; токен не попадает в `queryKey`, логи, `AsyncStorage`, `.env` или параметры маршрутов.
- Базовый URL — `EXPO_PUBLIC_API_URL`, fallback из `src/api/http.ts`.
- Завершать сессию можно только при `401`; сеть, `400`, `404`, `500` показываются как ошибка запроса.
- `DELETE /tasks/:id` отвечает `204`: не вызывать `response.json()`.
- `dueDate` — `string | null` в формате `YYYY-MM-DD`; `updatedAt` обязателен в модели.
- Ключ списка обязан содержать `user.id` и значение фильтра статуса.
- Массив серверных задач не хранится в React Context.
- `new QueryClient()` создаётся один раз на уровне модуля, не в компоненте.
- Мутации не повторяются автоматически; `POST /tasks` не идемпотентен.
- Установка пакетов — `npx expo install`, не `npm install` (правило `AGENTS.md`).
- После каждой задачи: `npx tsc --noEmit`; перед коммитом — `npx expo lint`.
- Ручной прогон на устройстве может быть недоступен без `adb`/эмулятора; это фиксируется как незакрытый шаг, а не как «всё проверено».

## Review Focus

- **Дата `YYYY-MM-DD` не должна сдвигаться на предыдущий день** в отрицательных часовых поясах; `2026-02-31` должна отклоняться.
- **`401` завершает сессию, а `500` и сетевая ошибка — нет**; после `401` кэш очищен.
- **`204` при удалении не парсится как JSON**, а отложенное удаление не отправляет `DELETE` до истечения таймера и не теряет отмену.
- **Создание при активном фильтре/поиске** должно показать новую карточку: фильтр сбрасывается на «Все», поиск очищается, подсветка не теряется.
- **Быстрые повторы статуса и несколько удалений** не должны отправлять противоречивые `PATCH` или оставлять скрытые карточки без завершённого `DELETE`.

---

## Task 1: Фундамент TanStack Query

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/api/queryClient.ts`
- Modify: `app/_layout.tsx`
- Modify: `src/auth/AuthContext.tsx`

**Interfaces:**
- Produces: `queryClient: QueryClient` из `src/api/queryClient.ts`
- Produces: `QueryClientProvider` в корневом layout
- Produces: очистка кэша в `signIn`, `signOut`, `clearSessionOn401`

- [ ] **Step 1: Установить зависимость**

Run: `npx expo install @tanstack/react-query`
Expected: пакет появился в `dependencies`, версия совместима с React 19 / Expo SDK 57.

- [ ] **Step 2: Создать `src/api/queryClient.ts`**

```ts
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './http';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status !== null && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: { retry: 0 },
  },
});
```

- [ ] **Step 3: Обернуть корень в `QueryClientProvider`**

В `app/_layout.tsx` импортировать `QueryClientProvider` и `queryClient`; порядок: `GestureHandlerRootView → QueryClientProvider → ThemeProvider → AuthProvider → RootNavigator`.

- [ ] **Step 4: Очищать кэш в `AuthContext`**

В `src/auth/AuthContext.tsx` импортировать `queryClient`; вызвать `queryClient.clear()`:
- в `clearSessionOn401` после сброса состояния;
- в `signOut` после сброса состояния;
- в `signIn` после успешного `saveToken`, перед установкой пользователя.

- [ ] **Step 5: Проверить**

Run: `npx tsc --noEmit`
Expected: без ошибок.
Run: `npx expo lint`
Expected: 0 ошибок; допускаются 2 старых warning (`TaskStats.tsx`, `ThemeContext.tsx`).

- [ ] **Step 6: Коммит**

```bash
git add package.json package-lock.json src/api/queryClient.ts app/_layout.tsx src/auth/AuthContext.tsx
git commit -m "feat: add tanstack query client and cache reset"
```

---

## Task 2: Типы задач и API-слой

**Files:**
- Modify: `src/types/task.ts`
- Create: `src/api/client.ts`
- Create: `src/api/tasks.ts`
- Modify (временно, до Task 9): `src/context/TasksContext.tsx`, `src/constants/initialTasks.ts`
- Test (не коммитится): `.superpowers/sdd/2026-11-25-lab7-tasks/tasks-smoke.test.mjs`
- Test loader (не коммитится): `.superpowers/sdd/2026-11-25-lab7-tasks/ts-resolve.mjs`

**Interfaces:**
- Produces: `apiRequest<T>(path, token, init?, onUnauthorized?): Promise<T>`
- Produces: `getErrorMessage(error: unknown): string`
- Produces: `isUnauthorizedError(error: unknown): boolean`
- Produces: `getTasks(token, params?, onUnauthorized?): Promise<Task[]>`
- Produces: `getTaskById(id, token, onUnauthorized?): Promise<Task>`
- Produces: `createTask(input, token, onUnauthorized?): Promise<Task>`
- Produces: `updateTask(id, input, token, onUnauthorized?): Promise<Task>`
- Produces: `deleteTask(id, token, onUnauthorized?): Promise<void>`

- [ ] **Step 1: Написать падающий smoke-тест API**

Скопировать `ts-resolve.mjs` из `.superpowers/sdd/2026-11-21-lab6-auth/ts-resolve.mjs` в новую папку. В `tasks-smoke.test.mjs` поднять локальный `node:http` сервер, выставить `process.env.EXPO_PUBLIC_API_URL`, импортировать `../../../src/api/tasks.ts`.

Тест обязан проверить:

```js
// GET /tasks без параметров: Authorization: Bearer token, вернулся items
assert.equal(request.authorization, 'Bearer token');
assert.deepEqual(tasks.map((t) => t.id), ['t1']);

// GET /tasks?status=active: query-параметр ровно один
assert.equal(request.url, '/tasks?status=active');

// GET /tasks/t%2F1: id кодируется
assert.equal(request.url, '/tasks/t%2F1');

// POST /tasks: Content-Type application/json, тело { title, subject, priority }
assert.equal(request.method, 'POST');
assert.deepEqual(JSON.parse(request.body), input);

// PATCH /tasks/t1: метод PATCH, вернулся item
assert.equal(request.method, 'PATCH');

// DELETE /tasks/t1: 204 без тела, результат undefined
assert.equal(result, undefined);

// 401 на /tasks вызывает onUnauthorized один раз; 500 — ноль раз
// сеть недоступна → ApiError.status === null
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --import ./.superpowers/sdd/2026-11-25-lab7-tasks/ts-resolve.mjs --test .superpowers/sdd/2026-11-25-lab7-tasks/tasks-smoke.test.mjs`
Expected: FAIL — модуль `src/api/tasks.ts` не найден.

- [ ] **Step 3: Обновить `src/types/task.ts`**

```ts
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  subject: string;
  priority: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface TaskListParams {
  status?: TaskStatus;
}

export interface TaskListResponse {
  items: Task[];
}

export interface TaskResponse {
  item: Task;
}

export type TaskStatusFilter = 'all' | TaskStatus;
```

- [ ] **Step 4: Временно починить старые данные для компиляции**

В `src/constants/initialTasks.ts` добавить каждому сиду `updatedAt` (равный `createdAt`); в `TasksContext.createTask` добавить `updatedAt: new Date().toISOString()`. Эти файлы будут удалены в Task 9.

- [ ] **Step 5: Создать `src/api/client.ts`**

```ts
import { ApiError, authorizedFetch, readErrorMessage } from './http';

export async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
  onUnauthorized?: () => void | Promise<void>,
): Promise<T>;
```

Поведение: сетевую ошибку обернуть в `ApiError` с `status: null` и текстом «Не удалось подключиться к серверу. Проверьте интернет и повторите попытку.»; при `!response.ok` бросить `ApiError(await readErrorMessage(response), response.status)`; при `204` вернуть `undefined as T`; при битом JSON — `ApiError` с понятным текстом.

`isUnauthorizedError(error)` возвращает `error instanceof ApiError && error.status === 401`. `getErrorMessage(error)` возвращает `error.message` для `Error`, иначе общий текст.

- [ ] **Step 6: Создать `src/api/tasks.ts`**

Пять функций из блока Interfaces. `getTasks` формирует query через `URLSearchParams` только при наличии `params.status`; id кодируется `encodeURIComponent`; `deleteTask` вызывает `apiRequest<void>(..., { method: 'DELETE' }, ...)`.

- [ ] **Step 7: Прогнать тест и типы**

Run: `node --import ./.superpowers/sdd/2026-11-25-lab7-tasks/ts-resolve.mjs --test .superpowers/sdd/2026-11-25-lab7-tasks/tasks-smoke.test.mjs`
Expected: PASS.
Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 8: Коммит**

```bash
git add src/types/task.ts src/api/client.ts src/api/tasks.ts src/context/TasksContext.tsx src/constants/initialTasks.ts
git commit -m "feat: add typed tasks api client"
```

---

## Task 3: Даты, форма и лимиты полей

**Files:**
- Modify: `src/utils/task.ts`
- Modify: `src/components/task/TaskForm.tsx`
- Modify: `src/components/ui/AppInput.tsx`
- Modify: `src/components/task/TaskCard.tsx`
- Modify: `app/(app)/task/[id].tsx` (только форматирование дат)
- Test (не коммитится): `.superpowers/sdd/2026-11-25-lab7-tasks/dates-smoke.test.mjs`

**Interfaces:**
- Produces: `parseDateOnly(value: string): Date | null`
- Produces: `formatDateOnly(value: string, options?: Intl.DateTimeFormatOptions): string`
- Produces: `TaskForm` props `submitting?: boolean`, `errorMessage?: string`
- Produces: `AppInput` prop `maxLength?: number`

- [ ] **Step 1: Написать падающий тест дат**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { parseDateOnly, formatDateOnly, isTaskOverdue } = await import('../../../src/utils/task.ts');

test('date-only helpers', async (t) => {
  await t.test('parses a real calendar date without timezone shift', () => {
    const date = parseDateOnly('2026-10-01');
    assert.equal(date.getFullYear(), 2026);
    assert.equal(date.getMonth(), 9);
    assert.equal(date.getDate(), 1);
  });

  await t.test('rejects an impossible calendar date', () => {
    assert.equal(parseDateOnly('2026-02-31'), null);
    assert.equal(parseDateOnly('01.10.2026'), null);
  });

  await t.test('formats a date-only value', () => {
    assert.match(formatDateOnly('2026-10-01', { day: 'numeric', month: 'long' }), /1 октября/);
  });

  await t.test('isTaskOverdue uses the end of the due day', () => {
    assert.equal(isTaskOverdue(task({ dueDate: '2026-10-01', status: 'active' })), true);
    assert.equal(isTaskOverdue(task({ dueDate: '2999-10-01', status: 'active' })), false);
    assert.equal(isTaskOverdue(task({ dueDate: '2026-10-01', status: 'completed' })), false);
  });
});
```

`task()` — локальный хелпер, собирающий объект `Task` с `updatedAt`.

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --import ./.superpowers/sdd/2026-11-25-lab7-tasks/ts-resolve.mjs --test .superpowers/sdd/2026-11-25-lab7-tasks/dates-smoke.test.mjs`
Expected: FAIL — `parseDateOnly`/`formatDateOnly` не экспортированы.

- [ ] **Step 3: Добавить утилиты в `src/utils/task.ts`**

`parseDateOnly` проверяет `/^\d{4}-\d{2}-\d{2}$/`, создаёт `new Date(year, month - 1, day)` и сверяет компоненты. `formatDateOnly` возвращает исходную строку, если дата невалидна. `isTaskOverdue` сравнивает с `new Date(year, month - 1, day, 23, 59, 59, 999)`.

- [ ] **Step 4: Обновить `TaskForm`**

- `parseDueDate(raw): string | null | 'invalid'` через `parseDateOnly`; пустое значение → `null`.
- Начальное значение: `initial?.dueDate ? initial.dueDate.slice(0, 10) : ''`.
- В API отправлять `dueDate: parsed === 'invalid' ? null : parsed`.
- Добавить `submitting` и `errorMessage`; кнопка `disabled={submitting}`, label `submitting ? 'Сохранение…' : submitLabel`; ошибка формы — красным текстом над кнопкой.
- `maxLength={120}` для названия, `maxLength={80}` для предмета.

- [ ] **Step 5: Обновить `AppInput`, `TaskCard`, детали**

`AppInput` принимает `maxLength` и передаёт в `TextInput`. `TaskCard` использует `formatDateOnly` для `dueDate`, `createdAt` по-прежнему форматирует как ISO. В `app/(app)/task/[id].tsx` заменить `formatDate(task.dueDate)` на `formatDateOnly(task.dueDate, { day: 'numeric', month: 'long', year: 'numeric' })`.

- [ ] **Step 6: Прогнать тест, типы и lint**

Run: `node --import ./.superpowers/sdd/2026-11-25-lab7-tasks/ts-resolve.mjs --test .superpowers/sdd/2026-11-25-lab7-tasks/dates-smoke.test.mjs`
Expected: PASS.
Run: `npx tsc --noEmit`
Run: `npx expo lint`

- [ ] **Step 7: Коммит**

```bash
git add src/utils/task.ts src/components/task/TaskForm.tsx src/components/ui/AppInput.tsx src/components/task/TaskCard.tsx "app/(app)/task/[id].tsx"
git commit -m "fix: handle date-only task deadlines and form states"
```

---

## Task 4: Ключи и хуки чтения

**Files:**
- Create: `src/features/tasks/queryKeys.ts`
- Create: `src/features/tasks/useTasksQuery.ts`

**Interfaces:**
- Produces: `taskKeys.all(userId)`, `taskKeys.lists(userId)`, `taskKeys.list(userId, status)`, `taskKeys.detail(userId, id)`
- Produces: `useTasksQuery(filter: TaskStatusFilter)`
- Produces: `useAllTasksQuery()`
- Produces: `useTaskQuery(id: string | undefined)`

- [ ] **Step 1: Создать ключи**

```ts
export const taskKeys = {
  all: (userId: string) => ['tasks', userId] as const,
  lists: (userId: string) => ['tasks', userId, 'list'] as const,
  list: (userId: string, status: TaskStatusFilter) =>
    ['tasks', userId, 'list', { status }] as const,
  detail: (userId: string, id: string) =>
    ['tasks', userId, 'detail', id] as const,
};
```

- [ ] **Step 2: Создать `useTasksQuery.ts`**

- Брать `user`, `accessToken`, `signOut` из `useAuth()`.
- `useTasksQuery(filter)` → `useQuery` с ключом `taskKeys.list(userId, filter)`, `enabled: Boolean(user && accessToken)`, `placeholderData: keepPreviousData`; `queryFn` вызывает `getTasks(accessToken, filter === 'all' ? undefined : { status: filter }, signOut)`.
- `useAllTasksQuery()` → тот же ключ `taskKeys.list(userId, 'all')`, всегда без `status`; нужен для статистики.
- `useTaskQuery(id)` → ключ `taskKeys.detail(userId, id ?? '')`, `enabled: Boolean(user && accessToken && id)`, `queryFn` вызывает `getTaskById(id!, accessToken, signOut)`.
- Если токена нет, `queryFn` бросает `new ApiError('Сессия не найдена.', 401)`.

- [ ] **Step 3: Проверить**

Run: `npx tsc --noEmit`
Run: `npx expo lint`

- [ ] **Step 4: Коммит**

```bash
git add src/features/tasks/queryKeys.ts src/features/tasks/useTasksQuery.ts
git commit -m "feat: add task query keys and read hooks"
```

---

## Task 5: Мутации и UI-провайдер

**Files:**
- Create: `src/features/tasks/useTaskMutations.ts`
- Create: `src/features/tasks/TasksUiContext.tsx`
- Modify: `app/(app)/_layout.tsx`

**Interfaces:**
- Produces: `useCreateTask()` — `mutate(input: CreateTaskInput)`
- Produces: `useUpdateTask()` — `mutate({ id, input }: { id: string; input: UpdateTaskInput })`
- Produces: `useToggleTaskStatus()` — `mutate({ id, status }: { id: string; status: TaskStatus })`
- Produces: `useTasksUi()` — см. дизайн §7.2; `scheduleDelete(task)`, `undoDelete(id)`, `pendingIds: ReadonlySet<string>`, `latestPending: Task | null`, `statusFilter`, `searchQuery`, `setStatusFilter`, `setSearchQuery`, `resetListView`, `lastCreatedId`, `markCreated`, `clearLastCreated`, `isPending(id)`
- Produces: `TasksUiProvider` внутри `(app)/_layout.tsx`

- [ ] **Step 1: Реализовать мутации**

`useCreateTask` и `useUpdateTask` — обычные `useMutation` с инвалидацией `taskKeys.all(user.id)` в `onSuccess`. `useToggleTaskStatus` — оптимистичная: `onMutate` отменяет запросы, сохраняет снимки `getQueriesData<Task[]>({ queryKey: taskKeys.lists(user.id) })` и детали, меняет `status`; `onError` восстанавливает снимки; `onSettled` инвалидирует. Все три при отсутствии токена бросают `ApiError('Сессия не найдена.', 401)`.

- [ ] **Step 2: Реализовать `TasksUiProvider`**

- `lastCreatedId` + `markCreated`/`clearLastCreated`.
- `statusFilter` (`'all'` по умолчанию), `searchQuery` (`''`), сеттеры, `resetListView()`.
- `pendingRef: Map<string, { task: Task; timer: ReturnType<typeof setTimeout> }>`, `pendingVersion` для ререндера, `pendingIds`, `latestPending`, `isPending`.
- `scheduleDelete(task)`: игнорировать дубль; `setTimeout(5000)` → `deleteMutation.mutate(task.id)`; добавить в map.
- `undoDelete(id)`: `clearTimeout`, удалить из map.
- `deleteMutation`: `deleteTask`, при успехе убрать задачу из `taskKeys.lists(user.id)` через `setQueriesData`, удалить `taskKeys.detail(user.id, id)`, инвалидировать `taskKeys.all(user.id)`; при ошибке убрать из pending, показать `Alert`, кроме `isUnauthorizedError`.
- При размонтировании снять таймеры и дослать оставшиеся `deleteTask` с сохранённым токеном (fire-and-forget, ошибки игнорировать).

- [ ] **Step 3: Подключить провайдер**

В `app/(app)/_layout.tsx` заменить `TasksProvider` на `TasksUiProvider`.

- [ ] **Step 4: Проверить**

Run: `npx tsc --noEmit`
Run: `npx expo lint`

- [ ] **Step 5: Коммит**

```bash
git add src/features/tasks/useTaskMutations.ts src/features/tasks/TasksUiContext.tsx "app/(app)/_layout.tsx"
git commit -m "feat: add task mutations and pending delete provider"
```

---

## Task 6: Экран списка на серверных данных

**Files:**
- Modify: `app/(app)/index.tsx`

**Interfaces:**
- Consumes: `useTasksQuery`, `useAllTasksQuery`, `useToggleTaskStatus`, `useTasksUi`
- Produces: экран списка с загрузкой, ошибкой, пустотой, поиском, серверным фильтром, refresh и отложенным удалением

- [ ] **Step 1: Переписать источник данных**

Убрать `useTasks`, `lastCreatedId`/`clearLastCreated` из старого контекста. Подключить `useTasksQuery(statusFilter)`, `useAllTasksQuery()`, `useToggleTaskStatus()`, `useTasksUi()`. `visibleTasks` = задачи из query без `pendingIds`, отсортированные `sortTasksByPriority` и отфильтрованные `filterTasks(..., searchQuery)`.

- [ ] **Step 2: Добавить состояния**

- Первая загрузка — центрированный `ActivityIndicator` в `Screen`.
- Ошибка без данных — `EmptyState` с кнопкой «Повторить» (`refetch`).
- Ошибка при данных — компактная плашка с повтором над списком.
- Пустота: `allTasks.length === 0` → «Задач пока нет»; непустой поиск → «Ничего не найдено»; иначе → «В этой категории пусто».
- `RefreshControl` с `refreshing={isRefetching || allQuery.isRefetching}` и `onRefresh`, обновляющим оба запроса.

- [ ] **Step 3: Подключить фильтр, поиск и статистику**

`TaskFilterBar` получает `statusFilter`/`setStatusFilter` из `useTasksUi`; `AppInput` — `searchQuery`/`setSearchQuery`. `TaskStats` считает `getTaskStats(allTasks.filter((t) => !pendingIds.has(t.id)))`.

- [ ] **Step 4: Подключить статус, удаление и подсветку**

- Toggle: если `toggleMutation.isPending` — игнорировать; иначе `mutate({ id, status: next })`, при ошибке `Alert`, кроме `isUnauthorizedError`.
- Удаление из свайпа и из кнопки в карточке — один `requestDelete(task)` с `Alert` → `scheduleDelete(task)`.
- Плашка: если `latestPending`, показать «Удаление… Отменить», по нажатию `undoDelete(latestPending.id)`.
- `useEffect`: когда `lastCreatedId` появился в `visibleTasks`, запустить таймер 1200 мс → `clearLastCreated()`; очищать таймер при размонтировании.

- [ ] **Step 5: Проверить**

Run: `npx tsc --noEmit`
Run: `npx expo lint`

- [ ] **Step 6: Коммит**

```bash
git add "app/(app)/index.tsx"
git commit -m "feat: load task list from server with filters and refresh"
```

---

## Task 7: Создание и редактирование

**Files:**
- Modify: `app/(app)/create.tsx`
- Modify: `app/(app)/edit/[id].tsx`

**Interfaces:**
- Consumes: `useCreateTask`, `useUpdateTask`, `useTaskQuery`, `useTasksUi`
- Produces: создание с черновиком на пользователя, редактирование с загрузкой и ошибками

- [ ] **Step 1: Переписать `create.tsx`**

- Ключ черновика: `@campus_planner/create_draft:${user.id}`; старый `@campus_planner/create_draft` удалять при чтении.
- `useCreateTask()`; `markCreated`, `resetListView` из `useTasksUi()`.
- На успех: удалить черновик, `resetListView()`, `markCreated(task.id)`, `router.back()`.
- На ошибку: `setFormError(getErrorMessage(error))`, кроме `isUnauthorizedError`.
- Передать в `TaskForm` `submitting={mutation.isPending}` и `errorMessage={formError}`.

- [ ] **Step 2: Переписать `edit/[id].tsx`**

- `useTaskQuery(id)`; пока грузится — спиннер; `404`/нет данных — «Задача не найдена»; другая ошибка — «Не удалось загрузить» + повтор.
- `useUpdateTask()`; на успех `router.back()`, на ошибку `formError`.
- `TaskForm initial={task} submitting={mutation.isPending} errorMessage={formError}`.

- [ ] **Step 3: Проверить**

Run: `npx tsc --noEmit`
Run: `npx expo lint`

- [ ] **Step 4: Коммит**

```bash
git add "app/(app)/create.tsx" "app/(app)/edit/[id].tsx"
git commit -m "feat: create and edit tasks through server mutations"
```

---

## Task 8: Детали задачи

**Files:**
- Modify: `app/(app)/task/[id].tsx`

**Interfaces:**
- Consumes: `useTaskQuery`, `useToggleTaskStatus`, `useTasksUi`
- Produces: детали с загрузкой, ошибкой, сменой статуса и отложенным удалением

- [ ] **Step 1: Перевести детали на запрос**

Убрать `useTasks`/`getTaskById`. Подключить `useTaskQuery(id)`. Пока грузится — `ActivityIndicator`; ошибка `404` или отсутствие данных — «Задача не найдена»; другая ошибка — «Не удалось загрузить» + `refetch`.

- [ ] **Step 2: Подключить действия**

- Toggle: `useToggleTaskStatus`; кнопка показывает «Сохранение…» и блокируется на время мутации; ошибка — `Alert`, кроме `isUnauthorizedError`.
- Delete: подтверждение → `scheduleDelete(task)` → `router.back()`; плашка отмены появится на списке.
- «Редактировать» остаётся переходом на `/edit/${task.id}`.

- [ ] **Step 3: Проверить**

Run: `npx tsc --noEmit`
Run: `npx expo lint`

- [ ] **Step 4: Коммит**

```bash
git add "app/(app)/task/[id].tsx"
git commit -m "feat: load task details from server"
```

---

## Task 9: Удаление локального состояния и обновление текста

**Files:**
- Delete: `src/context/TasksContext.tsx`
- Delete: `src/hooks/useTasks.ts`
- Delete: `src/constants/initialTasks.ts`
- Modify: `app/(app)/settings.tsx`

- [ ] **Step 1: Проверить ссылки**

Run: `rg "TasksContext|useTasks|INITIAL_TASKS" app src`
Expected: совпадений нет (кроме удаляемых файлов).

- [ ] **Step 2: Удалить файлы и обновить подсказку**

Удалить три файла. В `settings.tsx` заменить текст про хранение задач в памяти на: задачи хранятся на сервере Campus API, кэш очищается при выходе, черновик привязан к пользователю.

- [ ] **Step 3: Проверить**

Run: `npx tsc --noEmit`
Run: `npx expo lint`
Run: `npx expo export --platform android`
Expected: экспорт завершён успешно.

- [ ] **Step 4: Коммит**

```bash
git add -A src/context/TasksContext.tsx src/hooks/useTasks.ts src/constants/initialTasks.ts "app/(app)/settings.tsx"
git commit -m "refactor: remove local task state"
```

---

## Task 10: Сквозная проверка

**Files:**
- Modify: только файлы с найденными дефектами

- [ ] **Step 1: Автоматические проверки**

Run: `npx tsc --noEmit`
Run: `npx expo lint`
Run: `npx expo export --platform android`
Expected: типы чисто, lint 0 ошибок (2 старых warning), export успешен.

- [ ] **Step 2: Smoke-тесты API и дат**

Run: `node --import ./.superpowers/sdd/2026-11-25-lab7-tasks/ts-resolve.mjs --test .superpowers/sdd/2026-11-25-lab7-tasks/tasks-smoke.test.mjs`
Run: `node --import ./.superpowers/sdd/2026-11-25-lab7-tasks/ts-resolve.mjs --test .superpowers/sdd/2026-11-25-lab7-tasks/dates-smoke.test.mjs`
Expected: PASS.

- [ ] **Step 3: Живой API без секретов**

Run: `curl.exe -s -o NUL -w "%{http_code}" https://campus-api.mkseva.workers.dev/health`
Expected: `200`.
Run: `curl.exe -s -o NUL -w "%{http_code}" https://campus-api.mkseva.workers.dev/tasks`
Expected: `401`.

- [ ] **Step 4: Ручной чек-лист**

Если доступен эмулятор/устройство:

1. Вход, список с сервера; у нового пользователя пусто.
2. Создание → карточка появилась, фильтр сброшен, подсветка сработала.
3. Перезапуск → задача на месте.
4. Редактирование и смена статуса → список, детали и статистика согласованы.
5. Фильтр «Активные»/«Выполненные» → запрос содержит `status`, список меняется.
6. Поиск, пустой результат, pull-to-refresh.
7. Удаление → карточка исчезает, «Отменить» возвращает; повторное удаление без отмены исчезает после перезапуска.
8. Авиарежим → ошибка и повтор, сессия не сбрасывается.
9. Просроченный токен → выход и очистка кэша.
10. Выход и вход другим пользователем → чужих задач и черновика нет.

Если `adb`/эмулятора нет — записать, что ручной прогон не выполнен, и не писать «всё проверено».

- [ ] **Step 5: Финальный коммит при наличии правок**

```bash
git add -A
git commit -m "test: verify lab 7 server task flow"
```

---

## Самопроверка плана

- [x] Все требования спецификации покрыты задачами 1–10.
- [x] Типы и имена согласованы: `getTasks`, `getTaskById`, `createTask`, `updateTask`, `deleteTask`; `taskKeys`; `useTasksQuery`, `useAllTasksQuery`, `useTaskQuery`; `useCreateTask`, `useUpdateTask`, `useToggleTaskStatus`; `useTasksUi`.
- [x] `Review Focus` покрыт тестами Task 2/3 и ручными проверками Task 10.
- [x] Нет шагов «сделать что-то хорошее» без проверяемого результата.
- [x] Каждая задача заканчивается коммитом.
