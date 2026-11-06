import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import AppInput from '../ui/AppInput';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../theme/priority';
import type { CreateTaskInput, TaskPriority } from '../../types/task';

interface Props {
  initial?: CreateTaskInput;
  submitLabel: string;
  onSubmit: (input: CreateTaskInput) => void;
  onChange?: (input: CreateTaskInput) => void;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export default function TaskForm({ initial, submitLabel, onSubmit, onChange }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium');

  useEffect(() => {
    onChange?.({ title, subject, description, dueDate, priority });
  }, [title, subject, description, dueDate, priority, onChange]);

  const handleSubmit = () => {
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    if (!cleanTitle) {
      Alert.alert('Ошибка валидации', 'Название задачи не может быть пустым');
      return;
    }
    if (!cleanSubject) {
      Alert.alert('Ошибка валидации', 'Предмет не может быть пустым');
      return;
    }
    onSubmit({
      title: cleanTitle,
      subject: cleanSubject,
      priority,
      description: description.trim() || undefined,
      dueDate: dueDate.trim() || undefined,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppInput label="Название задачи" value={title} onChangeText={setTitle} placeholder="Например: Лабораторная работа" />
      <AppInput label="Предмет" value={subject} onChangeText={setSubject} placeholder="Например: Мобильная разработка" />
      <AppInput
        label="Описание (необязательно)"
        value={description}
        onChangeText={setDescription}
        placeholder="Кратко о содержании задачи"
        multiline
      />
      <AppInput
        label="Срок (необязательно)"
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="ГГГГ-ММ-ДД"
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
              <Text style={[styles.priorityText, { color: active ? '#FFFFFF' : PRIORITY_COLORS[p] }]}>
                {PRIORITY_LABELS[p]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={handleSubmit} style={[styles.submit, { backgroundColor: colors.primary }]}>
        <Text style={[styles.submitText, { color: colors.onPrimary }]}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: spacing.md },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 2, alignItems: 'center' },
  priorityText: { fontSize: 14, fontWeight: '600' },
  submit: { marginTop: spacing.lg, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700' },
});