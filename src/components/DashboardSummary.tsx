import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DashboardSummary as DashboardSummaryData } from '../services/dashboard-service';

interface Props {
  summary: DashboardSummaryData;
}

export function DashboardSummary({ summary }: Props) {
  if (summary.workoutCount === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No workouts yet</Text>
        <Text style={styles.emptyBody}>
          Log your first workout to see your dashboard come alive.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.grid}>
      <Card label="Workouts" value={summary.workoutCount.toString()} />
      <Card label="Volume" value={summary.totalVolume.toFixed(0)} />
      <Card label="Per Week" value={summary.workoutsPerWeek.toFixed(1)} />
      <Card
        label="Streak"
        value={`${summary.currentStreakWeeks}w`}
        emphasis={summary.currentStreakWeeks > 0}
      />
    </View>
  );
}

function Card({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={[styles.card, emphasis && styles.cardEmphasis]}>
      <Text style={[styles.cardValue, emphasis && styles.cardValueEmphasis]}>
        {value}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'flex-start',
  },
  cardEmphasis: {
    backgroundColor: '#e0e7ff',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardValueEmphasis: {
    color: '#1e3a8a',
  },
  cardLabel: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    margin: 16,
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyBody: {
    color: '#475569',
    textAlign: 'center',
  },
});
