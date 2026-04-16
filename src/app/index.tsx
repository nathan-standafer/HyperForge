import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SessionProvider, useSession } from '../context/SessionContext';
import type { Exercise } from '../models/exercise';
import * as exerciseService from '../services/exercise-service';
import SetLogForm from '../components/SetLogForm';
import SetList from '../components/SetList';
import ExercisePicker from '../components/ExercisePicker';
import SessionSummary from '../components/SessionSummary';

function HomeContent() {
  const { state, startSession, endSession, logSet, updateSet, deleteSet } =
    useSession();
  const [selectedExercise, setSelectedExercise] =
    useState<Exercise | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseMap, setExerciseMap] = useState<Map<string, Exercise>>(
    new Map(),
  );
  const [showSummary, setShowSummary] = useState(false);

  // Load exercise details for display
  useEffect(() => {
    (async () => {
      const exercises = await exerciseService.listExercises();
      const map = new Map<string, Exercise>();
      for (const e of exercises) {
        map.set(e.id, e);
      }
      setExerciseMap(map);
    })();
  }, []);

  if (state.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // No active session
  if (!state.activeSession) {
    return (
      <View style={styles.center}>
        <Text style={styles.heroText}>Ready to lift?</Text>
        <TouchableOpacity style={styles.startButton} onPress={startSession}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleEndSession = () => {
    Alert.alert('End Workout', 'Are you sure you want to end this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Workout',
        style: 'destructive',
        onPress: async () => {
          setShowSummary(true);
          await endSession();
        },
      },
    ]);
  };

  const handleLogSet = async (data: {
    weight: number;
    reps: number;
    rir?: number;
  }) => {
    if (!selectedExercise) return;
    await logSet({
      exerciseId: selectedExercise.id,
      ...data,
    });
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
    // Add to exercise map if not present
    if (!exerciseMap.has(exercise.id)) {
      setExerciseMap(new Map(exerciseMap).set(exercise.id, exercise));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Active session header */}
        <View style={styles.sessionHeader}>
          <View>
            <Text style={styles.sessionLabel}>Active Workout</Text>
            <Text style={styles.sessionTime}>
              Started{' '}
              {new Date(state.activeSession.startTime).toLocaleTimeString(
                [],
                { hour: '2-digit', minute: '2-digit' },
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndSession}
          >
            <Text style={styles.endButtonText}>End Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Set Log Form or Exercise Selection */}
        {selectedExercise ? (
          <SetLogForm
            exercise={selectedExercise}
            onLog={handleLogSet}
            onChangeExercise={() => setShowExercisePicker(true)}
          />
        ) : (
          <TouchableOpacity
            style={styles.selectExerciseButton}
            onPress={() => setShowExercisePicker(true)}
          >
            <Text style={styles.selectExerciseText}>
              Select an Exercise
            </Text>
          </TouchableOpacity>
        )}

        {/* Logged Sets */}
        <View style={styles.setsSection}>
          <Text style={styles.setsTitle}>
            Logged Sets ({state.sets.length})
          </Text>
          <SetList
            sets={state.sets}
            exercises={exerciseMap}
            onDelete={deleteSet}
          />
        </View>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        visible={showExercisePicker}
        onSelect={handleSelectExercise}
        onClose={() => setShowExercisePicker(false)}
      />

      {/* Session Summary Modal */}
      {showSummary && (
        <SessionSummary
          sets={state.sets}
          exercises={exerciseMap}
          startTime={state.activeSession?.startTime ?? ''}
          onClose={() => setShowSummary(false)}
        />
      )}
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  heroText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 14,
  },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  sessionLabel: { fontSize: 16, fontWeight: '700', color: '#1e40af' },
  sessionTime: { fontSize: 13, color: '#3b82f6', marginTop: 2 },
  endButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  endButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  selectExerciseButton: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  selectExerciseText: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  setsSection: { marginTop: 16 },
  setsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
