import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { DAY_NAMES, type DayOfWeek } from '../models/program';

interface Props {
  dayOfWeek: DayOfWeek;
  templateName: string | null;
  onPress: () => void;
}

export function ProgramDayRow({ dayOfWeek, templateName, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.day}>{DAY_NAMES[dayOfWeek]}</Text>
      <Text style={[styles.template, !templateName && styles.rest]}>
        {templateName || 'Rest Day'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  day: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  template: { fontSize: 15, color: '#2563eb' },
  rest: { color: '#94a3b8', fontStyle: 'italic' },
});
