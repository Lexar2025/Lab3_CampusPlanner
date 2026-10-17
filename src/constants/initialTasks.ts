import type { Task } from '../types/task';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Дата относительно «сейчас»:
 *   daysFromNow(-3) — три дня назад
 *   daysFromNow( 2) — через два дня
 * Возвращает ISO-строку — тот же формат, что хранит createdAt.
 */
const daysFromNow = (days: number): string =>
  new Date(Date.now() + days * DAY_MS).toISOString();

/**
 * 5 демо-задач, покрывающих все ветки UI:
 *   - два разных статуса (active / completed)
 *   - все три приоритета
 *   - просроченная активная задача  → подсветка overdue
 *   - выполненная задача с прошедшим сроком → НЕ просрочена (демонстрация правила)
 *   - задача без dueDate              → опциональное поле работает
 *   - несколько будущих сроков        → видно «осталось N дней»
 */
export const INITIAL_TASKS: Task[] = [
  {
    id: 'seed-1',
    title: 'Лабораторная 3: архитектура и рефакторинг',
    subject: 'Мобильная разработка',
    priority: 'high',
    status: 'active',
    createdAt: daysFromNow(-6),
    dueDate: daysFromNow(2),
  },
  {
    id: 'seed-2',
    title: 'Конспект: дизайн-токены и чистые функции',
    subject: 'Мобильная разработка',
    priority: 'medium',
    status: 'completed',
    createdAt: daysFromNow(-5),
    dueDate: daysFromNow(-1),
  },
  {
    id: 'seed-3',
    title: 'Защита лабораторной 2: навигация и темы',
    subject: 'Мобильная разработка',
    priority: 'high',
    status: 'active',
    createdAt: daysFromNow(-4),
    dueDate: daysFromNow(-3),
  },
  {
    id: 'seed-4',
    title: 'Настроить Android Studio и эмулятор',
    subject: 'Инструменты разработки',
    priority: 'low',
    status: 'active',
    createdAt: daysFromNow(-2),
  },
  {
    id: 'seed-5',
    title: 'Отчёт по завершённым лабораторным',
    subject: 'Мобильная разработка',
    priority: 'medium',
    status: 'active',
    createdAt: daysFromNow(-1),
    dueDate: daysFromNow(7),
  },
];
