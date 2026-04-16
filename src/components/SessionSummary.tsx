import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import type { Set } from '../models/set';
import type { Exercise } from '../models/exercise';

interface SessionSummaryProps {
  sets: Set[];
  exercises: Map<string, Exercise>;
  startTime: string;
  onClose: () => void;
}

export default function SessionSummary({
  sets,
  exercises,
  startTime,
  onClose,
}: SessionSummaryProps) {
  const totalSets = sets.length;
  const totalVolume = sets.reduce(
    (sum, s) => sum + s.weight * s.reps,
    0,
  );
  const exerciseCount = new Set(sets.map((s) => s.exerciseId)).size;
  const now = new Date();
  const start = new Date(startTime);
  const durationMin = Math.round(
    (now.getTime() - start.getTime()) / 60000,
  );

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Workout Complete!</Text>

          <View style={styles.stats}>
            <StatItem label="Sets" value={String(totalSets)} />
            <StatItem
              label="Volume"
              value={`${totalVolume.toLocaleString()} kg`}
            />
            <StatItem label="Duration" value={`${durationMin} min`} />
            <StatItem
              label="Exercises"
              value={String(exerciseCount)}
            />
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: 320,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 24 },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    marginBottom: 24,
  },
  statItem: { alignItems: 'center', minWidth: 100 },
  statValue: { fontSize: 28, fontWeight: '700', color: '#2563eb' },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },
  doneButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 10,
  },
  doneButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
