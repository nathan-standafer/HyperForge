import { Link, Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getRecentExercises } from '../../services/exercise-service';
import type { Exercise } from '../../models/exercise';

export default function ProgressHomeScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const recent = await getRecentExercises();
    setExercises(recent);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Stack.Screen options={{ title: 'Progress' }} />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : exercises.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyBody}>
              Log a few workouts to see your progress here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(e) => e.id}
            renderItem={({ item }) => (
              <Link href={`/progress/exercise/${item.id}`} asChild>
                <Pressable style={styles.row}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowMeta}>
                    {item.muscleGroup.replace('_', ' ')}
                  </Text>
                </Pressable>
              </Link>
            )}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: '#475569', textAlign: 'center' },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowName: { fontSize: 16, fontWeight: '500', color: '#0f172a' },
  rowMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
