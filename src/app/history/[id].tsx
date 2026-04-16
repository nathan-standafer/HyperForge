import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as sessionService from '../../services/session-service';
import * as exerciseService from '../../services/exercise-service';
import * as setService from '../../services/set-service';
import type { SessionDetail } from '../../models/session';
import type { Exercise } from '../../models/exercise';
import SetList from '../../components/SetList';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Map<string, Exercise>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [sessionDetail, exercises] = await Promise.all([
        sessionService.getSessionDetail(id),
        exerciseService.listExercises(),
      ]);
      const map = new Map<string, Exercise>();
      for (const e of exercises) map.set(e.id, e);
      setExerciseMap(map);
      setDetail(sessionDetail);
      setLoading(false);
    })();
  }, [id]);

  const handleDeleteSet = async (setId: string) => {
    await setService.deleteSet(setId);
    // Reload
    if (!id) return;
    const updated = await sessionService.getSessionDetail(id);
    setDetail(updated);
  };

  if (loading || !detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const date = new Date(detail.startTime);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>
          {date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.time}>
          {date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{detail.summary.totalSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {detail.summary.totalVolume.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Volume (kg)</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {detail.summary.duration}
          </Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {detail.summary.exerciseCount}
          </Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
      </View>

      {/* Sets grouped by exercise */}
      <SetList
        sets={detail.sets}
        exercises={exerciseMap}
        onDelete={handleDeleteSet}
      />
    </ScrollView>
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
  header: { padding: 16, paddingBottom: 8 },
  date: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  time: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    marginBottom: 16,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#2563eb' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
});
