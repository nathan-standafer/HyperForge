import React from 'react';
import { useRouter } from 'expo-router';
import ExercisePicker from '../components/ExercisePicker';
import type { Exercise } from '../models/exercise';

export default function ExerciseSelectScreen() {
  const router = useRouter();

  const handleSelect = (exercise: Exercise) => {
    router.back();
    // Pass exercise data back via params
    router.setParams({
      selectedExerciseId: exercise.id,
      selectedExerciseName: exercise.name,
    });
  };

  return (
    <ExercisePicker
      visible={true}
      onSelect={handleSelect}
      onClose={() => router.back()}
    />
  );
}
