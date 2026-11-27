# ЛР №8: финальная подготовка Campus Planner — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подготовить Campus Planner к демонстрации: добавить календарный список по срокам, убрать комментарии и дублирование, сделать понятные ошибки и оформить README с планом EAS.

**Architecture:** Чистая функция `groupTasksByDueDate` строит секции, `buildTaskRows` разворачивает их в строки текущего `Animated.FlatList`. Свайпы, анимации, поиск, статистика и отложенное удаление остаются без изменений. Общие состояния экранов задач выносятся в `TaskQueryGate`, тексты ошибок маппятся по HTTP-статусу, комментарии удаляются последним проходом, чтобы не вернуть их новыми правками.

**Tech Stack:** Expo SDK 57, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, TanStack Query 5.108.4, Expo Router, Reanimated 4.5.1, Gesture Handler 2.32.

**Spec:** `docs/superpowers/specs/2026-11-27-lab8-final-project-design.md`

## Global Constraints

- Комментарии в коде запрещены; сохраняются только `'worklet';` и `/// <reference types="expo/types" />`.
- `any` в собственном коде запрещён.
- Пользовательские тексты не показывают сырой `error.message` сервера.
- `dueDate` — `string | null` в `YYYY-MM-DD`; сравнение дат только по локальным компонентам, без UTC.
- Свайпы, отложенное удаление, поиск, статистика, темы и черновик не должны сломаться.
- Реальные логины, пароли и токены не попадают в репозиторий и README.
- После каждой задачи: `npx tsc --noEmit`; перед коммитом: `npx expo lint`.
- Ручной прогон на устройстве и EAS-сборка в этой среде недоступны; это фиксируется честно.
- Скриншоты для README делает пользователь на телефоне; до их получения README содержит список кадров, а не битые ссылки.

## Review Focus

- **`dueDate: null` и невалидная дата** должны попадать в «Без срока», а не исчезать из списка.
- **Выполненная задача с прошедшим сроком** не должна попадать в «Просрочено» при фильтре «Все».
- **Фильтр «Выполненные»** должен давать одну секцию без дат, а «Активные» — не показывать выполненные.
- **Границы 7 дней и полночь** считаются по локальному дню; часовой пояс не должен сдвигать секцию.
- **Удаление, отмена и оптимистичный toggle** должны перемещать задачу между секциями без дублей и потерь.

---

## Task 1: Утилита календарных секций

**Files:**
- Create: `src/utils/taskSections.ts`
- Test (не коммитится): `C:\Users\user\AppData\Local\Temp\opencode\lab8-sections\sections-smoke.test.mjs`
- Test loader (не коммитится): `C:\Users\user\AppData\Local\Temp\opencode\lab8-sections\ts-resolve.mjs`
- Test loader (не коммитится): `C:\Users\user\AppData\Local\Temp\opencode\lab8-sections\ts-hooks.mjs`

**Interfaces:**
- Produces: `TaskSectionKey`, `TaskSection`, `TaskListRow` из `src/utils/taskSections.ts`
- Produces: `groupTasksByDueDate(tasks: Task[], filter: TaskStatusFilter): TaskSection[]`
- Produces: `buildTaskRows(sections: TaskSection[]): TaskListRow[]`
- Consumes: `parseDateOnly`, `sortTasksByPriority` из `src/utils/task.ts`; `PRIORITY_ORDER` из `src/theme/priority.ts`

- [ ] **Step 1: Создать загрузчик TS для smoke-теста**

В `C:\Users\user\AppData\Local\Temp\opencode\lab8-sections\ts-resolve.mjs`:

```js
import { register } from 'node:module';
register('./ts-hooks.mjs', import.meta.url);
```

В `ts-hooks.mjs` — `resolve`, который при ошибке резолва относительного импорта пробует `specifier + '.ts'`, `specifier + '.tsx'` и `specifier + '/index.ts'`. Абсолютные и пакетные импорты не трогать.

- [ ] **Step 2: Написать падающий smoke-тест**

Тест импортирует `taskSections.ts` через `pathToFileURL` и проверяет:

```js
// helper: shift(days) возвращает YYYY-MM-DD на days от сегодня, локально
// helper: task(id, overrides) возвращает валидную Task

// 1. dueDate = shift(-1) → секция overdue
// 2. dueDate = shift(0) → today; shift(1) → tomorrow
// 3. shift(3) и shift(7) → thisWeek; shift(8) → later
// 4. dueDate: null → noDueDate; dueDate: '2026-02-31' → noDueDate
// 5. completed + shift(-1) при filter 'all' → нет overdue, есть completed
// 6. filter 'active' → нет секции completed
// 7. filter 'completed' → ровно одна секция completed, задач ровно столько же
// 8. порядок секций: overdue, today, tomorrow, thisWeek, later, noDueDate, completed
// 9. внутри overdue: shift(-5) раньше shift(-1); при равной дате high раньше low
// 10. buildTaskRows: сначала строка section с count, затем task с ключом task:<id>
// 11. пустой массив → []
```

- [ ] **Step 3: Убедиться, что тест падает**

Run:

```powershell
cd C:\Users\user\AppData\Local\Temp\opencode\lab8-sections
node --import ./ts-resolve.mjs --test ./sections-smoke.test.mjs
```

Expected: FAIL — модуль `src/utils/taskSections.ts` не найден.

- [ ] **Step 4: Реализовать `src/utils/taskSections.ts`**

Экспорты и поведение:

```ts
export type TaskSectionKey =
  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'thisWeek'
  | 'later'
  | 'noDueDate'
  | 'completed';

export interface TaskSection {
  key: TaskSectionKey;
  title: string;
  tasks: Task[];
}

export type TaskListRow =
  | { kind: 'section'; key: string; title: string; count: number; overdue: boolean }
  | { kind: 'task'; key: string; task: Task };

export function groupTasksByDueDate(tasks: Task[], filter: TaskStatusFilter): TaskSection[];
export function buildTaskRows(sections: TaskSection[]): TaskListRow[];
```

Правила:

- `today` — начало текущего локального дня; `dayDiff = Math.round((due - today) / 86_400_000)`.
- `dayDiff < 0` → `overdue`; `0` → `today`; `1` → `tomorrow`; `2..7` → `thisWeek`; `> 7` → `later`.
- `dueDate: null` или `parseDateOnly === null` → `noDueDate`.
- Секции дат сортируются по сроку возрастанию, при равном сроке — по `PRIORITY_ORDER`.
- `noDueDate` и `completed` — по `sortTasksByPriority`.
- При `filter === 'completed'` — одна секция `completed` со всеми переданными задачами, без дат.
- При `filter === 'active'` — только даты и `noDueDate`, без `completed`.
- При `filter === 'all'` — активные по датам, выполненные отдельной секцией в конце.
- Пустые секции не добавляются.
- `buildTaskRows`: ключ заголовка `section:<key>`, ключ задачи `task:<id>`.

- [ ] **Step 5: Прогнать тест и типы**

Run:

```powershell
cd C:\Users\user\AppData\Local\Temp\opencode\lab8-sections
node --import ./ts-resolve.mjs --test ./sections-smoke.test.mjs
```

Expected: PASS, 11/11.

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 6: Коммит**

```bash
git add src/utils/taskSections.ts
git commit -m "feat: add due date task sections"
```

---

## Task 2: Секции в списке

**Files:**
- Create: `src/components/task/TaskSectionHeader.tsx`
- Modify: `app/(app)/index.tsx`

**Interfaces:**
- Consumes: `groupTasksByDueDate`, `buildTaskRows`, `TaskListRow` из Task 1
- Produces: `TaskSectionHeader({ title, count, overdue })`

- [ ] **Step 1: Создать `TaskSectionHeader`**

Props: `title: string`, `count: number`, `overdue?: boolean`. Строка с заголовком слева и круглым счётчиком справа; для `overdue` заголовок цвета `colors.danger`, иначе `colors.subtext`. Отступы: `marginHorizontal: spacing.md`, `marginTop: spacing.md`, `marginBottom: spacing.xs`. Заголовок: 13 pt, `fontWeight: '700'`, `letterSpacing: 0.4`, `textTransform: 'uppercase'`. `accessibilityRole="header"`.

- [ ] **Step 2: Перестроить данные списка в `app/(app)/index.tsx`**

Вместо `visibleTasks`:

```ts
const sections = useMemo(() => {
  const withoutPending = tasks.filter((task) => !pendingIds.has(task.id));
  const byStatus =
    statusFilter === 'all'
      ? withoutPending
      : filterTasksByStatus(withoutPending, statusFilter);
  return groupTasksByDueDate(filterTasks(byStatus, searchQuery), statusFilter);
}, [tasks, pendingIds, statusFilter, searchQuery]);

const rows = useMemo(() => buildTaskRows(sections), [sections]);
const visibleTasks = useMemo(
  () => sections.flatMap((section) => section.tasks),
  [sections],
);
```

`visibleTasks` остаётся только для подсветки `lastCreatedId`.

- [ ] **Step 3: Отрисовать строки**

- `data={rows}`, `keyExtractor={(row) => row.key}`.
- `renderItem`: для `kind === 'section'` — `TaskSectionHeader`; для `kind === 'task'` — текущий `Animated.View` с `SwipeableTaskCard`.
- Анимации `entering`/`exiting`, `itemLayoutAnimation`, `RefreshControl`, `ListHeaderComponent`, `ListEmptyComponent`, баннер ошибки и плашка отмены не меняются.
- Если TypeScript не выводит тип строк, указать `<Animated.FlatList<TaskListRow> ...>`.

- [ ] **Step 4: Проверить**

Run: `npx tsc --noEmit`
Expected: без ошибок.

Run: `npx expo lint`
Expected: 0 ошибок; допускаются 2 старых warning до Task 7.

- [ ] **Step 5: Коммит**

```bash
git add src/components/task/TaskSectionHeader.tsx "app/(app)/index.tsx"
git commit -m "feat: group task list by due date"
```

---

## Task 3: `TaskQueryGate` и хелперы дат

**Files:**
- Create: `src/components/task/TaskQueryGate.tsx`
- Modify: `app/(app)/task/[id].tsx`
- Modify: `app/(app)/edit/[id].tsx`
- Modify: `src/utils/task.ts`
- Modify: `src/components/task/TaskCard.tsx`

**Interfaces:**
- Produces: `TaskQueryGate({ id, query, onBack, children })`, где `children: (task: Task) => ReactNode`
- Produces: `formatIsoDate(iso: string): string`, `formatIsoDateTime(iso: string): string`

- [ ] **Step 1: Создать `TaskQueryGate`**

Props:

```tsx
interface TaskQueryGateProps {
  id: string | undefined;
  query: UseQueryResult<Task, Error>;
  onBack: () => void;
  children: (task: Task) => ReactNode;
}
```

Поведение:

- `!id` или `query.error instanceof ApiError && status === 404` → `EmptyState` «Задача не найдена», «Назад к списку»;
- `query.isPending` → `ActivityIndicator`;
- `query.isError || !query.data` → `EmptyState` «Не удалось загрузить задачу», «Повторить» с `query.refetch()`;
- иначе `children(query.data)`.

- [ ] **Step 2: Перевести экраны на gate**

- `task/[id].tsx` и `edit/[id].tsx` убирают локальные `notFound`, `isPending`, `isError`-блоки, лишние импорты `ActivityIndicator`, `EmptyState`, `ApiError` и стиль `centered`.
- Тело экрана оборачивается в `<TaskQueryGate id={id} query={taskQuery} onBack={() => router.back()}>{(task) => (...)}</TaskQueryGate>`.
- Обработчики, которым нужен `task`, определяются внутри render-prop; хуки остаются на верхнем уровне экрана.

- [ ] **Step 3: Добавить хелперы дат**

В `src/utils/task.ts`:

```ts
export function formatIsoDate(iso: string): string;
export function formatIsoDateTime(iso: string): string;
```

Первая форматирует день/месяц/год, вторая — день/месяц/год и часы/минуты через `toLocaleDateString('ru-RU')` / `toLocaleString('ru-RU')`.

- `TaskCard.tsx`: локальный `formatFullDate` заменить на `formatIsoDate`.
- `task/[id].tsx`: локальный `formatDate` заменить на `formatIsoDateTime`.

- [ ] **Step 4: Проверить**

Run: `npx tsc --noEmit`
Expected: без ошибок.

Run: `npx expo lint`
Expected: 0 ошибок; допускаются 2 старых warning до Task 7.

- [ ] **Step 5: Коммит**

```bash
git add src/components/task/TaskQueryGate.tsx "app/(app)/task/[id].tsx" "app/(app)/edit/[id].tsx" src/utils/task.ts src/components/task/TaskCard.tsx
git commit -m "refactor: share task screen states and date helpers"
```

---

## Task 4: `SettingsRow`

**Files:**
- Create: `src/components/ui/SettingsRow.tsx`
- Modify: `app/(app)/settings.tsx`

**Interfaces:**
- Produces: `SettingsRow({ title, subtitle, right })`

- [ ] **Step 1: Создать `SettingsRow`**

Props: `title: string`, `subtitle?: string`, `right?: ReactNode`. Компонент сам берёт `colors` из `useTheme` и рисует карточку с рамкой, заголовком, подзаголовком и правым элементом. Стили строки переносятся из `settings.tsx`.

- [ ] **Step 2: Переписать `settings.tsx`**

- Строка темы: `<SettingsRow title="Тёмная тема" subtitle={...} right={<Switch ... />} />`.
- Строка профиля: `<SettingsRow title={user.name} subtitle={`@${user.login}`} />`.
- Удалить дублирующиеся `styles.row`, `styles.labels`, `styles.title`, `styles.subtitle`.

- [ ] **Step 3: Проверить и закоммитить**

Run: `npx tsc --noEmit`
Expected: без ошибок.

```bash
git add src/components/ui/SettingsRow.tsx "app/(app)/settings.tsx"
git commit -m "refactor: extract settings row"
```

---

## Task 5: Понятные ошибки без текста сервера

**Files:**
- Modify: `src/api/client.ts`
- Modify: `app/(auth)/login.tsx`
- Test (не коммитится): `C:\Users\user\AppData\Local\Temp\opencode\lab8-sections\errors-smoke.test.mjs`

**Interfaces:**
- Produces: `getErrorMessage(error: unknown): string` с маппингом статусов
- Produces: `getLoginErrorMessage(error: unknown): string`

- [ ] **Step 1: Написать падающий smoke-тест ошибок**

Импортировать `client.ts` и `http.ts`; проверить:

```js
// ApiError('raw', null) → текст про интернет
// 400 → «Проверьте введённые данные.»
// 401 → «Сессия истекла. Войдите снова.»
// 403 → «Нет доступа к этой операции.»
// 404 → «Запись не найдена.»
// 429 → «Слишком много запросов. Попробуйте позже.»
// 500 и 503 → «Сервер временно недоступен. Попробуйте позже.»
// 418 → «Не удалось выполнить запрос. Попробуйте ещё раз.»
// getLoginErrorMessage(ApiError('raw', 401)) → «Неверный логин или пароль.»
// getLoginErrorMessage(ApiError('raw', 400)) → «Проверьте логин и пароль.»
// getLoginErrorMessage(ApiError('raw', null)) → текст про интернет
```

- [ ] **Step 2: Убедиться, что тест падает**

Run:

```powershell
cd C:\Users\user\AppData\Local\Temp\opencode\lab8-sections
node --import ./ts-resolve.mjs --test ./errors-smoke.test.mjs
```

Expected: FAIL — `getLoginErrorMessage` не экспортирован или возвращается сырой текст.

- [ ] **Step 3: Реализовать маппинг**

В `client.ts`:

- `getErrorMessage` проверяет `error instanceof ApiError`:
  - `status === null` → сетевой текст;
  - `400`, `401`, `403`, `404`, `429` → точные тексты из теста;
  - `status >= 500` → текст про сервер;
  - иначе → общий текст.
- `getLoginErrorMessage`:
  - `401` → «Неверный логин или пароль.»;
  - `400` → «Проверьте логин и пароль.»;
  - иначе → `getErrorMessage`.
- `ApiError.message` остаётся для отладки, UI его не печатает.

- [ ] **Step 4: Перевести вход на новый хелпер**

В `login.tsx` заменить `error instanceof ApiError ? error.message : ...` на `getLoginErrorMessage(error)`; импорт `ApiError` убрать, если он больше не нужен.

- [ ] **Step 5: Прогнать тест, типы и линт**

Run:

```powershell
cd C:\Users\user\AppData\Local\Temp\opencode\lab8-sections
node --import ./ts-resolve.mjs --test ./errors-smoke.test.mjs
```

Expected: PASS.

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 6: Коммит**

```bash
git add src/api/client.ts "app/(auth)/login.tsx"
git commit -m "fix: show friendly api errors"
```

---

## Task 6: README, EAS и идентичность Android

**Files:**
- Create: `README.md`
- Create: `eas.json`
- Create: `docs/screenshots/.gitkeep`
- Modify: `app.json`
- Modify: `.gitignore` (только если нужно игнорировать локальные артефакты скриншотов; иначе не трогать)

**Interfaces:**
- Produces: README с обязательными разделами ЛР8
- Produces: `eas.json` с профилем `preview` (APK)
- Produces: `android.package: com.campusplanner.app`

- [ ] **Step 1: Добавить `android.package`**

В `app.json` в блок `expo.android` добавить `"package": "com.campusplanner.app"`.

- [ ] **Step 2: Создать `eas.json`**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

- [ ] **Step 3: Написать `README.md`**

Разделы:

1. `# Campus Planner` — краткое описание и ветка.
2. «Возможности» — вход/выход, CRUD через Campus API, загрузка/пусто/ошибка, поиск, фильтр статуса, календарный список, свайпы, две+ анимации, светлая/тёмная тема, обработка 404/401.
3. «Собственная функция» — календарный список и правила секций из спеки.
4. «Стек» — Expo SDK 57, RN 0.86.3, React 19.2.3, TS 6.0.3, TanStack Query 5.108.4, Reanimated, Gesture Handler.
5. «Структура проекта» — `app/`, `src/api`, `src/features/tasks`, `src/components`, `src/utils`.
6. «Запуск» — Node 20+, `npm install`, `.env` с `EXPO_PUBLIC_API_URL`, `npx expo start`, Expo Go/эмулятор.
7. «Учебный API» — URL по умолчанию, переменная окружения, отсутствие реальных учётных данных; тестовые данные выдаёт преподаватель.
8. «Скриншоты» — список 5 кадров и путь `docs/screenshots/`; изображения добавляются после получения файлов (см. Task 8).
9. «Демонстрация» — сценарий на 3 минуты: вход → список → создание → детали → свайп → удаление с отменой → темы → выход.
10. «EAS Build» — `npx eas-cli@latest init`, `npx eas-cli@latest build -p android --profile preview`; статус «не выполнялась, доступа к EAS нет».
11. «Проверки» — `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform android`.
12. «Ограничения» — ручной прогон на устройстве за пользователем, скриншоты с телефона, EAS недоступен.

- [ ] **Step 4: Создать папку скриншотов**

`docs/screenshots/.gitkeep` — чтобы папка попала в репозиторий. В README перечислить имена `01-login.png` … `05-dark.png` без битых image-тегов.

- [ ] **Step 5: Проверить и закоммитить**

Run: `npx tsc --noEmit`
Expected: без ошибок.

```bash
git add README.md eas.json app.json docs/screenshots/.gitkeep
git commit -m "docs: add project readme and eas config"
```

---

## Task 7: Удаление комментариев, `.bak` и старых warning

**Files:**
- Modify: все `.ts`/`.tsx` в `src/` и `app/`, где есть комментарии
- Modify: `eslint.config.js`
- Modify: `src/components/task/TaskStats.tsx`
- Modify: `src/context/ThemeContext.tsx`
- Delete: `App.tsx.bak`, `index.ts.bak`

- [ ] **Step 1: Удалить комментарии**

- Удалить все строки, начинающиеся с `//`, `/*`, `*`, во всех `.ts`/`.tsx` в `src/` и `app/`.
- Удалить три inline-комментария в `src/types/task.ts` (`// YYYY-MM-DD`, `// ISO 8601`).
- Удалить URL-комментарий в первой строке `eslint.config.js`.
- Сохранить `'worklet';` в `SwipeableTaskCard.tsx` и `/// <reference types="expo/types" />` в `src/types/env.d.ts`.
- Не трогать `docs/` и README.

- [ ] **Step 2: Проверить отсутствие обычных комментариев**

Python-скрипт по `src` и `app`: для каждой строки, у которой `strip()` начинается с `//`, `/*` или `*`, печатать файл и номер; исключить `/// <reference`. Expected: пустой вывод.

- [ ] **Step 3: Удалить `.bak` и починить warning**

```bash
git rm App.tsx.bak index.ts.bak
```

- `TaskStats.tsx`: `const cells: { label: string; value: string }[] = [...]`.
- `ThemeContext.tsx`: импортировать `useCallback`; обернуть `toggleTheme` в `useCallback` с зависимостью `[theme]`; добавить `toggleTheme` в зависимости `useMemo`.

- [ ] **Step 4: Проверить**

Run: `npx tsc --noEmit`
Expected: без ошибок.

Run: `npx expo lint`
Expected: 0 ошибок, 0 warning.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "refactor: remove code comments and dead files"
```

---

## Task 8: Финальная проверка и скриншоты

**Files:**
- Modify: `README.md` (только после получения скриншотов)
- Create: `docs/screenshots/01-login.png` … `05-dark.png` (от пользователя)

- [ ] **Step 1: Прогнать все проверки**

```powershell
npx tsc --noEmit
npx expo lint
npx expo export --platform android
npx expo install --check
```

Expected: `tsc` — 0; `lint` — 0 ошибок и 0 warning; `export` — успешная сборка; `install --check` — совместимые версии.

- [ ] **Step 2: Повторить smoke-тесты**

```powershell
cd C:\Users\user\AppData\Local\Temp\opencode\lab8-sections
node --import ./ts-resolve.mjs --test ./sections-smoke.test.mjs
node --import ./ts-resolve.mjs --test ./errors-smoke.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Проверить чистоту**

```bash
git status --short
```

Expected: пусто, кроме ожидаемых скриншотов, если пользователь их уже прислал.

- [ ] **Step 4: Вставить скриншоты, когда пользователь их пришлёт**

- Положить 5 файлов в `docs/screenshots/`.
- Заменить список кадров в README на image-теги с подписями.
- Проверить, что все пять путей существуют.
- Закоммитить:

```bash
git add README.md docs/screenshots
git commit -m "docs: add app screenshots"
```

- [ ] **Step 5: Итоговый отчёт**

Сообщить пользователю:

- какие проверки пройдены и с каким результатом;
- что ручной прогон на устройстве не выполнялся;
- что EAS-сборка не выполнялась, в README только план;
- какие скриншоты ещё нужны и куда их положить.
