import { useLocalSearchParams, Stack, Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { TrendChart, type ChartMetric } from '../../../components/TrendChart';
import { TimeRangeFilter } from '../../../components/TimeRangeFilter';
import {
  getExerciseProgress,
  type ExerciseProgressSeries,
  type SessionPoint,
} from '../../../services/progress-service';
import { getExerciseById } from '../../../services/exercise-service';
import type { TimeRange } from '../../../lib/time-range';

const METRICS: { value: ChartMetric; label: string }[] = [
  { value: 'weight', label: 'Top Weight' },
  { value: '1rm', label: 'Est. 1RM' },
  { value: 'volume', label: 'Volume' },
];

export default function ExerciseProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exerciseName, setExerciseName] = useState<string>('');
  const [range, setRange] = useState<TimeRange>('3m');
  const [metric, setMetric] = useState<ChartMetric>('weight');
  const [series, setSeries] = useState<ExerciseProgressSeries | null>(null);
  const [selected, setSelected] = useState<SessionPoint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [exercise, result] = await Promise.all([
        getExerciseById(id),
        getExerciseProgress(id, range),
      ]);
      if (cancelled) return;
      setExerciseName(exercise?.name ?? 'Exercise');
      setSeries(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, range]);

  return (
    <>
      <Stack.Screen options={{ title: exerciseName || 'Progress' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <TimeRangeFilter value={range} onChange={setRange} />
        <View style={styles.metricRow}>
          {METRICS.map((m) => {
            const active = m.value === metric;
            return (
              <Pressable
                key={m.value}
                onPress={() => setMetric(m.value)}
                style={[styles.metricChip, active && styles.metricChipActive]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    active && styles.metricLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : (
          <TrendChart
            points={series?.points ?? []}
            metric={metric}
            onPointPress={setSelected}
          />
        )}
        {selected && (
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>
              {new Date(selected.date).toLocaleDateString()}
            </Text>
            <Text style={styles.detailLine}>
              Top set: {selected.topWeight} × {selected.topWeightReps}
            </Text>
            {selected.estimatedOneRm !== null && (
              <Text style={styles.detailLine}>
                Est. 1RM: {selected.estimatedOneRm}
              </Text>
            )}
            <Text style={styles.detailLine}>
              Volume: {selected.totalVolume.toFixed(0)}
            </Text>
            <Text style={styles.detailLine}>Sets: {selected.setCount}</Text>
          </View>
        )}
        {id && (
          <Link href={`/progress/prs/${id}`} asChild>
            <Pressable style={styles.prLink}>
              <Text style={styles.prLinkText}>View PRs →</Text>
            </Pressable>
          </Link>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 16, gap: 8 },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  metricChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  metricChipActive: {
    backgroundColor: '#0f172a',
  },
  metricLabel: { color: '#334155', fontWeight: '600' },
  metricLabelActive: { color: '#ffffff' },
  detail: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  detailTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  detailLine: { fontSize: 14, color: '#334155' },
  prLink: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
  },
  prLinkText: { color: '#1e3a8a', fontWeight: '600' },
});
