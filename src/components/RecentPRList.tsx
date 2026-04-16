import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PersonalRecord } from '../services/pr-service';

interface Props {
  prs: PersonalRecord[];
}

function bucketLabel(pr: PersonalRecord): string {
  if (pr.repRange === '1rm') return 'Est. 1RM';
  if (pr.repRange === 10) return '10+ rep';
  return `${pr.repRange}-rep`;
}

export function RecentPRList({ prs }: Props) {
  if (prs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No new PRs in this range.</Text>
      </View>
    );
  }
  return (
    <View style={styles.list}>
      {prs.map((pr) => (
        <View key={`${pr.exerciseId}-${pr.repRange}-${pr.setId}`} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{pr.exerciseName ?? pr.exerciseId}</Text>
            <Text style={styles.meta}>
              {bucketLabel(pr)} · {new Date(pr.achievedOn).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.value}>
            {pr.weight} × {pr.reps}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  value: { fontSize: 15, fontWeight: '700', color: '#1e3a8a' },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#64748b' },
});
