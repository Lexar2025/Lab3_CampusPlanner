import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppButton from '../ui/AppButton';
import AppInput from '../ui/AppInput';
import Screen from '../ui/Screen';
import { useTheme } from '../../hooks/useTheme';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../theme/priority';
import { spacing } from '../../theme/spacing';
import type { CreateTaskInput, Task, TaskPriority } from '../../types/task';
import { parseDateOnly } from '../../utils/task';

interface TaskFormProps {
  initial?: Task | CreateTaskInput;
  submitLabel: string;
  onSubmit: (input: CreateTaskInput) => void;
  onChange?: (input: CreateTaskInput) => void;
  submitting?: boolean;
  errorMessage?: string;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

function parseDueDate(raw: string): string | null | 'invalid' {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return parseDateOnly(trimmed) ? trimmed : 'invalid';
}

export default function TaskForm({
  initial,
  submitLabel,
  onSubmit,
  onChange,
  submitting = false,
  errorMessage,
}: TaskFormProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium');
  const [dueDateRaw, setDueDateRaw] = useState(
    initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
  );

  const [errors, setErrors] = useState<{
    title?: string;
    subject?: string;
    dueDate?: string;
  }>({});

  useEffect(() => {
    if (!onChange) return;
    const parsed = parseDueDate(dueDateRaw);
    const dueDate = parsed === 'invalid' ? null : parsed;
    onChange({
      title,
      subject,
      priority,
      dueDate,
    });
  }, [title, subject, priority, dueDateRaw, onChange]);

  const handleSubmit = () => {
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    const parsed = parseDueDate(dueDateRaw);

    const nextErrors: typeof errors = {};
    if (!cleanTitle) nextErrors.title = 'Название задачи не может быть пустым';
    if (!cleanSubject) nextErrors.subject = 'Предмет не может быть пустым';
    if (parsed === 'invalid') nextErrors.dueDate = 'Некорректная дата (пример: 2026-10-20)';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: CreateTaskInput = {
      title: cleanTitle,
      subject: cleanSubject,
      priority,
      dueDate: parsed === 'invalid' ? null : parsed,
    };
    onSubmit(input);
  };

  return (
    <Screen>
      <AppInput
        label="Название задачи"
        value={title}
        onChangeText={(v) => {
          setTitle(v);
          if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
        }}
        placeholder="Например: Лабораторная по мобильной разработке"
        error={errors.title}
        maxLength={120}
      />

      <AppInput
        label="Предмет"
        value={subject}
        onChangeText={(v) => {
          setSubject(v);
          if (errors.subject) setErrors((e) => ({ ...e, subject: undefined }));
        }}
        placeholder="Например: Мобильная разработка"
        error={errors.subject}
        maxLength={80}
        style={styles.fieldGap}
      />

      <Text style={[styles.label, { color: colors.text }]}>Приоритет</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => {
          const active = priority === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPriority(p)}
              style={[
                styles.priorityBtn,
                {
                  borderColor: PRIORITY_COLORS[p],
                  backgroundColor: active ? PRIORITY_COLORS[p] : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: active ? '#FFFFFF' : PRIORITY_COLORS[p] },
                ]}
              >
                {PRIORITY_LABELS[p]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AppInput
        label="Срок (необязательно)"
        value={dueDateRaw}
        onChangeText={(v) => {
          setDueDateRaw(v);
          if (errors.dueDate) setErrors((e) => ({ ...e, dueDate: undefined }));
        }}
        placeholder="ГГГГ-ММ-ДД, например 2026-10-20"
        error={errors.dueDate}
        autoCapitalize="none"
        style={styles.fieldGap}
      />

      {errorMessage ? (
        <Text style={[styles.formError, { color: colors.danger }]}>{errorMessage}</Text>
      ) : null}

      <AppButton
        label={submitting ? 'Сохранение…' : submitLabel}
        onPress={handleSubmit}
        disabled={submitting}
        style={styles.submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  fieldGap: { marginTop: spacing.md },
  priorityRow: { flexDirection: 'row', gap: spacing.sm },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityText: { fontSize: 14, fontWeight: '600' },
  formError: { fontSize: 13, marginTop: spacing.md, textAlign: 'center' },
  submit: { marginTop: spacing.lg },
});
