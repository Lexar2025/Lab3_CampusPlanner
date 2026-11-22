# Дизайн ЛР №6: Авторизация, защищённые маршруты и безопасное хранение токена

**Проект:** `Lab3_CampusPlanner` (Expo SDK 57, Expo Router `~57.0.31`, React Native `0.86.3`, TypeScript)  
**Дата:** 2026-11-21  
**Источники требований:** `lab-06-auth-secure-storage.md`, `API.md`

---

## 1. Цель и зачем это делается

Добавить в существующее приложение Campus Planner полноценную пользовательскую сессию: вход по логину и паролю через учебный сервер (`Campus API`), безопасное хранение токена на устройстве, восстановление сессии при запуске через `/auth/me`, разделение публичных и защищённых экранов и выход.

### Цели
- Неавторизованный пользователь видит только экран входа `(auth)/login` и не может открыть экраны задач даже по прямому маршруту.
- После успешного входа открывается основной раздел `(app)` с прежними экранами задач.
- При перезапуске приложения токен читается из `expo-secure-store` и проверяется запросом `GET /auth/me` до принятия решения о маршрутизации.
- При выходе и при ответе `401` на защищённом запросе токен удаляется из `SecureStore` и памяти, а пользователь возвращается на экран входа.
- Реализовать дополнительное задание: общий помощник `authorizedFetch`, добавляющий `Authorization: Bearer <token>` и инициирующий сброс сессии только при `401`, но не при `5xx` или сетевой ошибке.

### Не-цели (остаётся на ЛР №7+)
- Перевод списка задач (`TasksContext`) на серверные запросы `/tasks` — задачи остаются локальными в памяти, весь функционал ЛР1–ЛР5 не меняется.
- Регистрация, смена пароля, refresh token — учебный `Campus API` их не поддерживает.
- Хранение паролей/токенов в `.env`, исходном коде, `AsyncStorage`, параметрах навигации или `console.*`.

### Анти-цели
- Редирект на `(auth)` до окончания проверки токена (мигание экрана входа при запуске).
- Сброс сохранённой сессии при временном отсутствии сети или ошибке `500`.
- Использование символов `@` или `/` в ключе `SecureStore` (ломается на Android/iOS).

---

## 2. Ограничения и контракт API

- **Базовый URL:** `EXPO_PUBLIC_API_URL=https://campus-api.mkseva.workers.dev` в файле `.env` (адрес не является секретом; в `.env` не помещаются логины, пароли или токены).
- **Эндпоинты авторизации (`API.md`):**
  - `POST /auth/login` — тело `{ login, password }`, ответ `200`: `{ accessToken, expiresIn, user: { id, login, name } }`; ошибки `400` / `401`: `{ error: string }`.
  - `GET /auth/me` — заголовок `Authorization: Bearer <accessToken>`, ответ `200`: `{ user: { id, login, name } }`; ошибка `401`: `{ error: string }`.
- **Ключ `expo-secure-store`:** `campus_planner.access_token` (разрешены только латиница, цифры, `.`, `-`, `_`).
- **Переиспользование UI:** экран входа использует существующие `Screen`, `AppInput` (добавляется проп `secureTextEntry`) и `AppButton`.

---

## 3. Подходы к защите маршрутов (Approaches)

Рассмотрены два варианта организации защиты маршрутов в `app/_layout.tsx`:

1. **Подход 1 — `<Stack.Protected>` (выбран)**  
   - Пока `isLoading === true`, корневой layout показывает экран загрузки (`ActivityIndicator`) и не монтирует стек групп.
   - После загрузки рендерится `<Stack screenOptions={{ headerShown: false }}>` с двумя защищёнными группами: `<Stack.Protected guard={isAuthenticated}><Stack.Screen name="(app)" /></Stack.Protected>` и `<Stack.Protected guard={!isAuthenticated}><Stack.Screen name="(auth)" /></Stack.Protected>`.
   - **Плюсы:** встроенный механизм Expo Router ~57; защищённый экран вообще не монтируется при попытке прямого перехода без сессии; при `signOut` или `401` стек сбрасывается автоматически.
   - **Минус:** использует новый декларативный API вместо императивного `router.replace`.
2. **Подход 2 — `useSegments()` + `router.replace()` в `useEffect` (отклонён)**  
   - Требует синхронизации с `useRootNavigationState()`, а при прямом переходе на защищённый маршрут экран успевает смонтироваться на один кадр до срабатывания эффекта.

Выбран **Подход 1** по согласованию с пользователем.

---

## 4. Архитектура и состав изменений

### Зависимости и конфигурация
- Установить `expo-secure-store` через `npx expo install expo-secure-store`.
- Создать `.env` с `EXPO_PUBLIC_API_URL=https://campus-api.mkseva.workers.dev` (и при желании `.env.example` с тем же публичным шаблоном без секретов).

### Слой типов и API
- `src/types/auth.ts` — типы `User`, `LoginInput`, `LoginResponse`, `UserResponse`, `ApiErrorResponse` строго по `API.md`. Существующий `src/types/task.ts` не изменяется.
- `src/api/http.ts` — базовый URL из `process.env.EXPO_PUBLIC_API_URL`, понятный класс ошибки `ApiError` (хранит `status` и `message`), общие помощники для парсинга JSON-ошибок (`{ error }`) и **доп. задание `authorizedFetch`**:
  - принимает `path`, `token`, опциональный `init?: RequestInit` и колбэк `onUnauthorized?: () => void | Promise<void>`;
  - выставляет `Authorization: Bearer <token>` (и `Content-Type: application/json`, если передано тело);
  - возвращает `Response` вызывающему коду, чтобы тот видел `response.status` и `response.ok`;
  - если `response.status === 401`, вызывает `onUnauthorized()` **только при `401`**; при `5xx`, `404`, `400` или сетевой ошибке `fetch` сброс сессии не происходит.
- `src/api/auth.ts`:
  - `signIn(credentials: LoginInput): Promise<LoginResponse>` — `POST /auth/login` (`trim()` для логина, без логирования пароля/токена); при `!response.ok` бросает `ApiError` с сообщением сервера (`data.error`) или понятным фолбэком; при сетевой ошибке бросает понятную ошибку подключения.
  - `getCurrentUser(token: string, onUnauthorized?: () => void | Promise<void>): Promise<User>` — `GET /auth/me` через `authorizedFetch`; возвращает `data.user`.

### Слой сессии (`src/auth/`, `src/hooks/`)
- `src/auth/authStorage.ts` — ключ `campus_planner.access_token` и функции `saveToken(token)`, `readToken()`, `removeToken()` поверх `SecureStore.setItemAsync`, `getItemAsync`, `deleteItemAsync` (без вывода токена в консоль).
- `src/auth/AuthContext.tsx` — предоставляет:
  - `user: User | null`
  - `accessToken: string | null` (только в памяти React-состояния)
  - `isLoading: boolean` (изначально `true`)
  - `isAuthenticated: boolean` (`Boolean(user && accessToken)`)
  - `authNotice: string | null` — разовое пояснение для экрана входа (например, после неудачной проверки сохранённой сессии из-за сети)
  - `signIn(credentials: LoginInput): Promise<void>`
  - `signOut(): Promise<void>`
  - Поведение при старте (`useEffect`): читает токен через `readToken()`; если токена нет — `isLoading = false`; если токен есть — вызывает `getCurrentUser(token, clearSessionOn401)`. При `401` токен удаляется из `SecureStore`, состояние очищается, `authNotice = null`; при сетевой ошибке/`5xx` токен в `SecureStore` сохраняется (согласно `API.md` и доп. заданию), в памяти `user = null`, `isLoading = false`, а `authNotice` получает текст «Не удалось проверить сохранённую сессию. Проверьте подключение и войдите снова.» — так пользователь понимает, почему оказался на экране входа, и токен не теряется для следующего запуска. `signIn` очищает `authNotice`.
  - Поведение `signIn`: вызывает `apiSignIn`, затем сохраняет токен через `saveToken`, затем устанавливает `accessToken` и `user` в state (ошибка пробрасывается в форму входа).
  - Поведение `signOut`: удаляет токен через `removeToken()` и сбрасывает `user` и `accessToken` в `null`.
- `src/hooks/useAuth.ts` — хук доступа к `AuthContext` с проверкой наличия провайдера (по аналогии с `useTasks.ts` и `useTheme.ts`).

### UI-компоненты и маршруты
- `src/components/ui/AppInput.tsx` — добавить опциональный проп `secureTextEntry?: boolean` (и `textContentType` / `returnKeyType` при необходимости, не ломая существующие вызовы).
- `app/(auth)/_layout.tsx` — `<Stack>` для публичной зоны (один экран `login`, заголовок скрыт или минималистичный в цветах темы).
- `app/(auth)/login.tsx` — экран входа на `Screen`, `AppInput`, `AppButton`:
  - если `authNotice` не `null`, над формой показывается нейтральный баннер с этим текстом;
  - поля «Логин» (`autoCapitalize="none"`) и «Пароль» (`secureTextEntry`, `autoCapitalize="none"`);
  - валидация пустых значений до запроса (ошибка под полем или общий баннер);
  - состояние отправки (`isSubmitting`): кнопка заблокирована, текст «Вход...», повторный сабмит невозможен;
  - отображение понятной ошибки при `401` («Неверный логин или пароль.») или ошибке сети;
  - очистка поля пароля при успехе.
- `app/(app)/` — перенос всех текущих экранов (`_layout.tsx`, `index.tsx`, `create.tsx`, `task/[id].tsx`, `edit/[id].tsx`, `settings.tsx`) с корректировкой относительных путей импортов на один уровень вверх (`../../src/...`, `../../../src/...` для вложенных папок `task/` и `edit/`).
  - `app/(app)/_layout.tsx` — переносит текущий `RootStack` из прежнего `app/_layout.tsx` (заголовки, цвета темы, модалки `create` и `edit/[id]`) и **оборачивает его в `TasksProvider`**. Задачи живут только внутри защищённой группы: при выходе или `401` группа размонтируется, и следующий пользователь получает чистый локальный список. Это осознанное изменение по сравнению с ЛР1–ЛР5 — данные не «переезжают» между сессиями.
  - `app/(app)/settings.tsx` — сохраняет переключатель темы и подсказку, добавляет карточку текущего пользователя (`user.name`, `@${user.login}`) и кнопку `AppButton` «Выйти» (`variant="danger"`), вызывающую `signOut()`.
- `app/_layout.tsx` — корневой контейнер:
  - `GestureHandlerRootView` → `ThemeProvider` → `AuthProvider` → `RootNavigator` (без `TasksProvider` — он переехал в `(app)`);
  - `RootNavigator`: пока `isLoading === true`, показывает центрированный `ActivityIndicator` на `colors.background`; затем `<Stack screenOptions={{ headerShown: false }}>` с `<Stack.Protected guard={isAuthenticated}>` на `(app)` и `<Stack.Protected guard={!isAuthenticated}>` на `(auth)`.

---

## 5. Решения, оставленные на план / реализацию

- Точное оформление карточки профиля и формы входа в стиле существующих `colors` и `spacing`.
- `onUnauthorized` передаётся в `authorizedFetch` напрямую из `getCurrentUser`; в `AuthContext` он вызывает `clearSessionOn401` (удаление токена + сброс состояния). Отдельная глобальная подписка не нужна: в ЛР6 единственный защищённый запрос — `/auth/me`; помощник останется готовым для ЛР7.
- Набор проверок: `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform android`, а также проверка API (`GET /health`, `POST /auth/login` с неверным и валидным тестовым логином, `GET /auth/me`) без сохранения учётных данных в файлах проекта.
