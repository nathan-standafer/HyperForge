import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import type { Exercise, MuscleGroup } from '../models/exercise';
import { MUSCLE_GROUPS } from '../models/exercise';
import * as exerciseService from '../services/exercise-service';

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  visible: boolean;
}

type Tab = 'recent' | 'all';

export default function ExercisePicker({
  onSelect,
  onClose,
  visible,
}: ExercisePickerProps) {
  const [tab, setTab] = useState<Tab>('recent');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] =
    useState<MuscleGroup>('chest');

  useEffect(() => {
    if (visible) {
      loadExercises();
    }
  }, [visible, tab, searchQuery, selectedGroup]);

  const loadExercises = async () => {
    if (tab === 'recent') {
      const recent = await exerciseService.getRecentExercises();
      setRecentExercises(recent);
      // Also load favorites for the recent tab
      const favs = await exerciseService.listExercises({
        favoritesOnly: true,
      });
      // Merge: recent first, then favorites not already in recent
      const recentIds = new Set(recent.map((e) => e.id));
      const merged = [
        ...recent,
        ...favs.filter((f) => !recentIds.has(f.id)),
      ];
      setRecentExercises(merged);
    } else {
      const list = await exerciseService.listExercises({
        muscleGroup: selectedGroup ?? undefined,
        searchQuery: searchQuery || undefined,
      });
      setExercises(list);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await exerciseService.createExercise({
      name: newName.trim(),
      muscleGroup: newMuscleGroup,
    });
    setShowCreateForm(false);
    setNewName('');
    onSelect(created);
  };

  const formatGroupLabel = (group: string) =>
    group.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => onSelect(item)}
    >
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.muscleGroup}>
        {formatGroupLabel(item.muscleGroup)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Exercise</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'recent' && styles.activeTab]}
            onPress={() => setTab('recent')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'recent' && styles.activeTabText,
              ]}
            >
              Recent / Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'all' && styles.activeTab]}
            onPress={() => setTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'all' && styles.activeTabText,
              ]}
            >
              All Exercises
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search + Muscle Group Filter (All tab only) */}
        {tab === 'all' && (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            <FlatList
              horizontal
              data={[null, ...MUSCLE_GROUPS]}
              keyExtractor={(item) => item ?? 'all'}
              showsHorizontalScrollIndicator={false}
              style={styles.groupFilter}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.groupChip,
                    selectedGroup === item && styles.activeGroupChip,
                    item === null &&
                      selectedGroup === null &&
                      styles.activeGroupChip,
                  ]}
                  onPress={() => setSelectedGroup(item)}
                >
                  <Text
                    style={[
                      styles.groupChipText,
                      (selectedGroup === item ||
                        (item === null && selectedGroup === null)) &&
                        styles.activeGroupChipText,
                    ]}
                  >
                    {item ? formatGroupLabel(item) : 'All'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* Exercise List */}
        <FlatList
          data={tab === 'recent' ? recentExercises : exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {tab === 'recent'
                ? 'No recent exercises. Browse all exercises or create one.'
                : 'No exercises found.'}
            </Text>
          }
        />

        {/* Create Custom Exercise */}
        {!showCreateForm ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Text style={styles.addButtonText}>+ Add Exercise</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.createForm}>
            <TextInput
              style={styles.createInput}
              placeholder="Exercise name"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <FlatList
              horizontal
              data={[...MUSCLE_GROUPS]}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              style={styles.groupFilter}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.groupChip,
                    newMuscleGroup === item && styles.activeGroupChip,
                  ]}
                  onPress={() => setNewMuscleGroup(item)}
                >
                  <Text
                    style={[
                      styles.groupChipText,
                      newMuscleGroup === item &&
                        styles.activeGroupChipText,
                    ]}
                  >
                    {formatGroupLabel(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.createButtons}>
              <TouchableOpacity
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createSubmit}
                onPress={handleCreate}
              >
                <Text style={styles.createSubmitText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700' },
  closeButton: { fontSize: 16, color: '#2563eb' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  activeTab: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  activeTabText: { color: '#fff' },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    fontSize: 16,
  },
  groupFilter: { marginTop: 8, paddingHorizontal: 12, maxHeight: 44 },
  groupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  activeGroupChip: { backgroundColor: '#2563eb' },
  groupChipText: { fontSize: 13, color: '#64748b' },
  activeGroupChipText: { color: '#fff' },
  list: { flex: 1, marginTop: 8 },
  exerciseItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  exerciseName: { fontSize: 16, fontWeight: '500', color: '#0f172a' },
  muscleGroup: { fontSize: 13, color: '#64748b', marginTop: 2 },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
    fontSize: 15,
  },
  addButton: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addButtonText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  createForm: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  createInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  createButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, color: '#64748b' },
  createSubmit: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createSubmitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
