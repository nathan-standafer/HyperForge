import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import type { WorkoutTemplate } from '../models/template';

interface Props {
  template: WorkoutTemplate;
  exerciseCount: number;
  onPress: () => void;
}

export function TemplateCard({ template, exerciseCount, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{template.name}</Text>
        {template.styleTag && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{template.styleTag}</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>
        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  tag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: { fontSize: 12, color: '#3730a3', fontWeight: '500' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
