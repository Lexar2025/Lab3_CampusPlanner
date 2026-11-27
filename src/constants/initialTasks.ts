import type { Task } from '../types/task';

const DAY_MS = 24 * 60 * 60 * 1000;

const daysFromNow = (days: number): string =>
  new Date(Date.now() + days * DAY_MS).toISOString();

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
