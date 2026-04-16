import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { TemplateExerciseRow } from './TemplateExerciseRow';
import ExercisePicker from './ExercisePicker';
import type { Exercise } from '../models/exercise';
import type { CreateTemplateInput } from '../services/template-service';
import type { TemplateDetail } from '../models/template';

const STYLE_SUGGESTIONS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'];

interface ExerciseEntry {
  key: string;
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
}

interface Props {
  initial?: TemplateDetail;
  onSave: (input: CreateTemplateInput) => void;
  onCancel: () => void;
}

export function TemplateForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [styleTag, setStyleTag] = useState(initial?.styleTag ?? '');
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    initial?.exercises.map((e, i) => ({
      key: e.id || `init-${i}`,
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      targetWeight: e.targetWeight,
    })) ?? [],
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleAddExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        targetSets: 3,
        targetReps: 10,
        targetWeight: null,
      },
    ]);
    setShowPicker(false);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= exercises.length) return;
    const next = [...exercises];
    [next[index], next[swap]] = [next[swap], next[index]];
    setExercises(next);
  };

  const handleRemove = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      styleTag: styleTag.trim() || undefined,
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetWeight: e.targetWeight ?? undefined,
      })),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Template Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Push Day"
      />

      <Text style={styles.label}>Training Style</Text>
      <View style={styles.tagRow}>
        {STYLE_SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            style={[styles.tagChip, styleTag === s && styles.tagChipActive]}
            onPress={() => setStyleTag(styleTag === s ? '' : s)}
          >
            <Text
              style={[
                styles.tagChipText,
                styleTag === s && styles.tagChipTextActive,
              ]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={styleTag}
        onChangeText={setStyleTag}
        placeholder="Or type a custom style..."
      />

      <Text style={styles.label}>
        Exercises ({exercises.length})
      </Text>
      {exercises.map((ex, i) => (
        <TemplateExerciseRow
          key={ex.key}
          exercise={{
            id: ex.key,
            templateId: '',
            exerciseId: ex.exerciseId,
            ordinal: i,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
            exerciseName: ex.exerciseName,
          }}
          isFirst={i === 0}
          isLast={i === exercises.length - 1}
          onMoveUp={() => handleMove(i, 'up')}
          onMoveDown={() => handleMove(i, 'down')}
          onRemove={() => handleRemove(i)}
        />
      ))}
      <Pressable
        style={styles.addBtn}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.addBtnText}>+ Add Exercise</Text>
      </Pressable>

      <View style={styles.footer}>
        <Pressable onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!name.trim()}
        >
          <Text style={styles.saveBtnText}>Save Template</Text>
        </Pressable>
      </View>

      <ExercisePicker
        visible={showPicker}
        onSelect={handleAddExercise}
        onClose={() => setShowPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  tagChipActive: { backgroundColor: '#2563eb' },
  tagChipText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  tagChipTextActive: { color: '#fff' },
  addBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addBtnText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    marginBottom: 40,
  },
  cancelText: { fontSize: 16, color: '#64748b' },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
