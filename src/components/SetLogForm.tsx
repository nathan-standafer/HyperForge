import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import type { Exercise } from '../models/exercise';
import WeightStepper from './WeightStepper';
import * as setService from '../services/set-service';

interface SetLogFormProps {
  exercise: Exercise;
  onLog: (data: {
    weight: number;
    reps: number;
    rir?: number;
  }) => void;
  onChangeExercise: () => void;
}

export default function SetLogForm({
  exercise,
  onLog,
  onChangeExercise,
}: SetLogFormProps) {
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(10);
  const [rir, setRir] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill from last session
  useEffect(() => {
    (async () => {
      const lastSet = await setService.getLastSetForExercise(
        exercise.id,
      );
      if (lastSet) {
        setWeight(lastSet.weight);
        setReps(lastSet.reps);
        if (lastSet.rir !== null) {
          setRir(String(lastSet.rir));
        }
        setPrefilled(true);
      } else {
        setWeight(0);
        setReps(10);
        setRir('');
        setPrefilled(false);
      }
    })();
  }, [exercise.id]);

  const handleLog = () => {
    const rirValue = rir.trim() ? parseInt(rir, 10) : undefined;
    onLog({
      weight,
      reps,
      rir:
        rirValue !== undefined && !isNaN(rirValue) ? rirValue : undefined,
    });
  };

  return (
    <View style={styles.container}>
      {/* Exercise Name */}
      <TouchableOpacity
        style={styles.exerciseHeader}
        onPress={onChangeExercise}
      >
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.changeText}>Change</Text>
      </TouchableOpacity>

      {prefilled && (
        <Text style={styles.prefillNote}>
          Pre-filled from last session
        </Text>
      )}

      {/* Weight */}
      <Text style={styles.label}>Weight</Text>
      <WeightStepper value={weight} onChange={setWeight} />

      {/* Reps */}
      <Text style={styles.label}>Reps</Text>
      <View style={styles.repsRow}>
        <TouchableOpacity
          style={styles.repsButton}
          onPress={() => setReps(Math.max(1, reps - 1))}
        >
          <Text style={styles.repsButtonText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.repsInput}
          value={String(reps)}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n >= 1) setReps(n);
          }}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <TouchableOpacity
          style={styles.repsButton}
          onPress={() => setReps(reps + 1)}
        >
          <Text style={styles.repsButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* RIR (optional) */}
      <Text style={styles.label}>RIR (optional)</Text>
      <TextInput
        style={styles.rirInput}
        value={rir}
        onChangeText={setRir}
        placeholder="0-10"
        keyboardType="number-pad"
        maxLength={2}
      />

      {/* Log Button */}
      <TouchableOpacity style={styles.logButton} onPress={handleLog}>
        <Text style={styles.logButtonText}>Log Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseName: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  changeText: { fontSize: 14, color: '#2563eb' },
  prefillNote: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  repsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  repsButton: {
    backgroundColor: '#e2e8f0',
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsButtonText: { fontSize: 20, fontWeight: '600', color: '#334155' },
  repsInput: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    width: 60,
    color: '#0f172a',
  },
  rirInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    width: 80,
  },
  logButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  logButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
