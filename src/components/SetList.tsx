import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import type { Set } from '../models/set';
import type { Exercise } from '../models/exercise';

interface SetListProps {
  sets: Set[];
  exercises: Map<string, Exercise>;
  onEdit?: (set: Set) => void;
  onDelete?: (setId: string) => void;
}

interface GroupedSets {
  exerciseId: string;
  exerciseName: string;
  sets: Set[];
}

function groupByExercise(
  sets: Set[],
  exercises: Map<string, Exercise>,
): GroupedSets[] {
  const groups = new Map<string, Set[]>();
  const order: string[] = [];

  for (const set of sets) {
    if (!groups.has(set.exerciseId)) {
      groups.set(set.exerciseId, []);
      order.push(set.exerciseId);
    }
    groups.get(set.exerciseId)!.push(set);
  }

  return order.map((exerciseId) => ({
    exerciseId,
    exerciseName:
      exercises.get(exerciseId)?.name ?? 'Unknown Exercise',
    sets: groups.get(exerciseId)!,
  }));
}

export default function SetList({
  sets,
  exercises,
  onEdit,
  onDelete,
}: SetListProps) {
  const grouped = groupByExercise(sets, exercises);

  if (sets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No sets logged yet. Select an exercise to get started.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={grouped}
      keyExtractor={(item) => item.exerciseId}
      renderItem={({ item: group }) => (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>{group.exerciseName}</Text>
          {group.sets.map((set) => (
            <View key={set.id} style={styles.setRow}>
              <Text style={styles.setNumber}>
                Set {set.setNumber}
              </Text>
              <Text style={styles.setDetail}>
                {set.weight === 0 ? 'BW' : `${set.weight} kg`} ×{' '}
                {set.reps}
                {set.rir !== null ? ` @ RIR ${set.rir}` : ''}
              </Text>
              {(onEdit || onDelete) && (
                <View style={styles.actions}>
                  {onEdit && (
                    <TouchableOpacity onPress={() => onEdit(set)}>
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity
                      onPress={() => onDelete(set.id)}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center' },
  group: { marginBottom: 16 },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  setNumber: {
    width: 56,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  setDetail: { flex: 1, fontSize: 16, color: '#0f172a' },
  actions: { flexDirection: 'row', gap: 12 },
  editText: { fontSize: 14, color: '#2563eb' },
  deleteText: { fontSize: 14, color: '#ef4444' },
});
