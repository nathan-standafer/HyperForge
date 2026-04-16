import { Link, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  listPrograms,
  setActiveProgram,
  clearActiveProgram,
  deleteProgram,
} from '../../services/program-service';
import type { Program } from '../../models/program';

export default function ProgramListScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listPrograms();
    setPrograms(list);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleToggleActive = async (program: Program) => {
    if (program.isActive) {
      await clearActiveProgram();
    } else {
      await setActiveProgram(program.id);
    }
    await load();
  };

  const handleDelete = (program: Program) => {
    Alert.alert('Delete Program', `Delete "${program.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteProgram(program.id);
          await load();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Programs' }} />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : programs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No programs yet</Text>
            <Text style={styles.emptyBody}>
              Create a program to get daily workout suggestions.
            </Text>
          </View>
        ) : (
          <FlatList
            data={programs}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Link href={`/programs/${item.id}`} asChild>
                  <Pressable style={styles.rowInfo}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    {item.isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </Pressable>
                </Link>
                <Pressable
                  style={styles.toggleBtn}
                  onPress={() => handleToggleActive(item)}
                >
                  <Text style={styles.toggleText}>
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.delBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.delText}>Del</Text>
                </Pressable>
              </View>
            )}
          />
        )}
        <Link href="/programs/create" asChild>
          <Pressable style={styles.fab}>
            <Text style={styles.fabText}>+ New Program</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: '#475569', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activeBadgeText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  toggleText: { fontSize: 13, color: '#2563eb', fontWeight: '500' },
  delBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  delText: { fontSize: 13, color: '#ef4444', fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
