import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { TemplateExercise } from '../models/template';

interface Props {
  exercise: TemplateExercise & { exerciseName: string };
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function TemplateExerciseRow({
  exercise,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{exercise.exerciseName}</Text>
        <Text style={styles.targets}>
          {exercise.targetSets} sets x {exercise.targetReps} reps
          {exercise.targetWeight != null && exercise.targetWeight > 0
            ? ` @ ${exercise.targetWeight}`
            : ''}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onMoveUp}
          disabled={isFirst}
          style={[styles.btn, isFirst && styles.btnDisabled]}
          accessibilityLabel="Move up"
        >
          <Text style={styles.btnText}>↑</Text>
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={isLast}
          style={[styles.btn, isLast && styles.btnDisabled]}
          accessibilityLabel="Move down"
        >
          <Text style={styles.btnText}>↓</Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          style={[styles.btn, styles.btnRemove]}
          accessibilityLabel="Remove"
        >
          <Text style={[styles.btnText, { color: '#ef4444' }]}>X</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  targets: { fontSize: 13, color: '#64748b', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.3 },
  btnRemove: { backgroundColor: '#fef2f2' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#334155' },
});
