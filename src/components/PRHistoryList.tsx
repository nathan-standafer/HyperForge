import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PersonalRecord, PrRepRange } from '../services/pr-service';

interface Props {
  prs: PersonalRecord[];
}

const BUCKET_ORDER: PrRepRange[] = ['1rm', 1, 3, 5, 8, 10];

function bucketLabel(bucket: PrRepRange): string {
  if (bucket === '1rm') return 'Est. 1RM';
  if (bucket === 10) return '10+ rep';
  return `${bucket}-rep max`;
}

export function PRHistoryList({ prs }: Props) {
  if (prs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No PRs yet</Text>
        <Text style={styles.emptyBody}>
          Log more sets to establish records.
        </Text>
      </View>
    );
  }
  const byBucket = new Map<PrRepRange, PersonalRecord>();
  for (const pr of prs) byBucket.set(pr.repRange, pr);
  return (
    <View style={styles.list}>
      {BUCKET_ORDER.map((bucket) => {
        const pr = byBucket.get(bucket);
        return (
          <View key={String(bucket)} style={styles.row}>
            <Text style={styles.label}>{bucketLabel(bucket)}</Text>
            {pr ? (
              <View style={styles.valueBox}>
                <Text style={styles.value}>
                  {pr.weight} × {pr.reps}
                </Text>
                <Text style={styles.date}>
                  {new Date(pr.achievedOn).toLocaleDateString()}
                </Text>
              </View>
            ) : (
              <Text style={styles.none}>—</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: { fontSize: 15, color: '#334155', fontWeight: '500' },
  valueBox: { alignItems: 'flex-end' },
  value: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  date: { fontSize: 12, color: '#64748b', marginTop: 2 },
  none: { fontSize: 16, color: '#cbd5e1' },
  empty: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyBody: { color: '#475569', textAlign: 'center' },
});
