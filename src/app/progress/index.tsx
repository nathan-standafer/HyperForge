import { Link, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { TimeRangeFilter } from '../../components/TimeRangeFilter';
import { DashboardSummary } from '../../components/DashboardSummary';
import { RecentPRList } from '../../components/RecentPRList';
import {
  getDashboardSummary,
  type DashboardSummary as DashboardData,
} from '../../services/dashboard-service';
import { getRecentExercises } from '../../services/exercise-service';
import type { Exercise } from '../../models/exercise';
import type { TimeRange } from '../../lib/time-range';

export default function ProgressHomeScreen() {
  const [range, setRange] = useState<TimeRange>('4w');
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [s, recent] = await Promise.all([
        getDashboardSummary(range),
        getRecentExercises(),
      ]);
      if (cancelled) return;
      setSummary(s);
      setExercises(recent);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <>
      <Stack.Screen options={{ title: 'Progress' }} />
      <ScrollView style={styles.container}>
        <TimeRangeFilter value={range} onChange={setRange} />
        {loading || !summary ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : (
          <>
            <DashboardSummary summary={summary} />
            <SectionHeader title="Recent PRs" />
            <RecentPRList prs={summary.recentPRs} />
            <SectionHeader title="Your Exercises" />
            {exercises.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  Log some sets to see per-exercise trends.
                </Text>
              </View>
            ) : (
              <View style={styles.exerciseList}>
                {exercises.map((ex) => (
                  <Link
                    key={ex.id}
                    href={`/progress/exercise/${ex.id}`}
                    asChild
                  >
                    <Pressable style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {ex.muscleGroup.replace('_', ' ')}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
  exerciseList: {
    paddingBottom: 24,
  },
  exerciseRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  exerciseName: { fontSize: 16, fontWeight: '500', color: '#0f172a' },
  exerciseMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
