import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { PRHistoryList } from '../../../components/PRHistoryList';
import {
  getExercisePrs,
  type PersonalRecord,
} from '../../../services/pr-service';
import { getExerciseById } from '../../../services/exercise-service';

export default function PRHistoryScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [title, setTitle] = useState('PRs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [exercise, records] = await Promise.all([
        getExerciseById(exerciseId),
        getExercisePrs(exerciseId),
      ]);
      if (cancelled) return;
      setTitle(exercise?.name ? `${exercise.name} PRs` : 'PRs');
      setPrs(records);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : (
          <PRHistoryList prs={prs} />
        )}
      </ScrollView>
    </>
  );
}
