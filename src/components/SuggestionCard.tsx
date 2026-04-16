import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { TodaySuggestion } from '../services/program-service';

interface Props {
  suggestion: TodaySuggestion;
  onStart: () => void;
}

export function SuggestionCard({ suggestion, onStart }: Props) {
  const { template, alreadyCompleted } = suggestion;
  return (
    <View style={[styles.card, alreadyCompleted && styles.cardDone]}>
      <Text style={styles.label}>Today's Workout</Text>
      <Text style={styles.name}>{template.name}</Text>
      <Text style={styles.meta}>
        {template.exercises.length} exercise
        {template.exercises.length !== 1 ? 's' : ''}
      </Text>
      {alreadyCompleted ? (
        <View style={styles.doneBadge}>
          <Text style={styles.doneBadgeText}>Completed</Text>
        </View>
      ) : (
        <Pressable style={styles.startBtn} onPress={onStart}>
          <Text style={styles.startBtnText}>Start Workout</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  cardDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  meta: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  startBtn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBadge: {
    marginTop: 16,
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneBadgeText: { color: '#16a34a', fontSize: 15, fontWeight: '600' },
});
