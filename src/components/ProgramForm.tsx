import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { ProgramDayRow } from './ProgramDayRow';
import { listTemplates } from '../services/template-service';
import { DAY_NAMES, type DayOfWeek } from '../models/program';
import type { WorkoutTemplate } from '../models/template';
import type { CreateProgramInput } from '../services/program-service';

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

interface Props {
  onSave: (input: CreateProgramInput) => void;
  onCancel: () => void;
}

export function ProgramForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [assignments, setAssignments] = useState<
    Map<DayOfWeek, { templateId: string; templateName: string }>
  >(new Map());
  const [pickingDay, setPickingDay] = useState<DayOfWeek | null>(null);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    listTemplates().then(setTemplates);
  }, []);

  const handleAssign = (templateId: string, templateName: string) => {
    if (pickingDay === null) return;
    const next = new Map(assignments);
    next.set(pickingDay, { templateId, templateName });
    setAssignments(next);
    setPickingDay(null);
  };

  const handleUnassign = (day: DayOfWeek) => {
    const next = new Map(assignments);
    next.delete(day);
    setAssignments(next);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const days = Array.from(assignments.entries()).map(([d, t]) => ({
      dayOfWeek: d,
      templateId: t.templateId,
    }));
    onSave({ name: name.trim(), days });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Program Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., PPL 6-Day"
      />

      <Text style={styles.label}>Schedule</Text>
      {ALL_DAYS.map((d) => {
        const assignment = assignments.get(d);
        return (
          <ProgramDayRow
            key={d}
            dayOfWeek={d}
            templateName={assignment?.templateName ?? null}
            onPress={() => {
              if (assignment) {
                handleUnassign(d);
              } else {
                setPickingDay(d);
              }
            }}
          />
        );
      })}

      <View style={styles.footer}>
        <Pressable onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!name.trim()}
        >
          <Text style={styles.saveBtnText}>Save Program</Text>
        </Pressable>
      </View>

      <Modal visible={pickingDay !== null} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {pickingDay !== null
                ? `Pick template for ${DAY_NAMES[pickingDay]}`
                : ''}
            </Text>
            <Pressable onPress={() => setPickingDay(null)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          <FlatList
            data={templates}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.templateRow}
                onPress={() => handleAssign(item.id, item.name)}
              >
                <Text style={styles.templateRowName}>{item.name}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Create templates first.
              </Text>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  cancelText: { fontSize: 16, color: '#64748b' },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modal: { flex: 1, paddingTop: 60, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 16, color: '#2563eb' },
  templateRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  templateRowName: { fontSize: 16, fontWeight: '500', color: '#0f172a' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});
