import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { SessionTarget } from '../models/session-target';
import type { Set } from '../models/set';
import type { Exercise } from '../models/exercise';

interface Props {
  targets: SessionTarget[];
  loggedSets: Set[];
  exercises: Map<string, Exercise>;
  onSelectExercise: (exerciseId: string, prefillWeight: number, prefillReps: number) => void;
}

export function TemplateSessionView({
  targets,
  loggedSets,
  exercises,
  onSelectExercise,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Template Exercises</Text>
      {targets.map((t) => {
        const exercise = exercises.get(t.exerciseId);
        const setsForExercise = loggedSets.filter(
          (s) => s.exerciseId === t.exerciseId,
        );
        const done = setsForExercise.length;
        const allDone = done >= t.targetSets;

        return (
          <Pressable
            key={t.id}
            style={[styles.row, allDone && styles.rowDone]}
            onPress={() =>
              onSelectExercise(
                t.exerciseId,
                t.targetWeight ?? 0,
                t.targetReps,
              )
            }
          >
            <View style={styles.info}>
              <Text style={[styles.name, allDone && styles.nameDone]}>
                {exercise?.name ?? 'Unknown'}
              </Text>
              <Text style={styles.progress}>
                {done}/{t.targetSets} sets
                {t.targetWeight != null && t.targetWeight > 0
                  ? ` @ ${t.targetWeight}`
                  : ''}
                {' '}
                x {t.targetReps} reps
              </Text>
            </View>
            {allDone ? (
              <Text style={styles.check}>Done</Text>
            ) : (
              <Text style={styles.logHint}>Tap to log</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  header: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowDone: { opacity: 0.5 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  nameDone: { textDecorationLine: 'line-through' },
  progress: { fontSize: 13, color: '#64748b', marginTop: 2 },
  check: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  logHint: { fontSize: 13, color: '#2563eb', fontWeight: '500' },
});
