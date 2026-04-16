import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as sessionService from '../../services/session-service';
import type { Session } from '../../models/session';

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const list = await sessionService.listSessions({ limit: 50 });
        setSessions(list);
        setLoading(false);
      })();
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          No completed workouts yet.{'\n'}Start a workout to see your
          history here.
        </Text>
      </View>
    );
  }

  const renderSession = ({ item }: { item: Session }) => {
    const date = new Date(item.startTime);
    const dateStr = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    let durationStr = '';
    if (item.endTime) {
      const mins = Math.round(
        (new Date(item.endTime).getTime() - date.getTime()) / 60000,
      );
      durationStr = `${mins} min`;
    }

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push(`/history/${item.id}`)}
      >
        <View>
          <Text style={styles.sessionDate}>{dateStr}</Text>
          <Text style={styles.sessionTime}>{timeStr}</Text>
        </View>
        {durationStr ? (
          <Text style={styles.duration}>{durationStr}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
      />
    </View>
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
  list: { padding: 16 },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sessionDate: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  sessionTime: { fontSize: 13, color: '#64748b', marginTop: 2 },
  duration: { fontSize: 14, color: '#2563eb', fontWeight: '500' },
});
