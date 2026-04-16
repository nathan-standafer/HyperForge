import { Link, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { TemplateCard } from '../../components/TemplateCard';
import {
  listTemplates,
  getTemplateDetail,
} from '../../services/template-service';
import type { WorkoutTemplate } from '../../models/template';

const STYLE_FILTERS = ['All', 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'];

export default function TemplateListScreen() {
  const [templates, setTemplates] = useState<
    (WorkoutTemplate & { exerciseCount: number })[]
  >([]);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const tag = filter === 'All' ? undefined : filter;
    const list = await listTemplates(tag);
    const withCount = await Promise.all(
      list.map(async (t) => {
        const detail = await getTemplateDetail(t.id);
        return { ...t, exerciseCount: detail.exercises.length };
      }),
    );
    setTemplates(withCount);
    setLoading(false);
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Templates' }} />
      <View style={styles.container}>
        <View style={styles.filterRow}>
          {STYLE_FILTERS.map((s) => (
            <Pressable
              key={s}
              style={[styles.chip, filter === s && styles.chipActive]}
              onPress={() => setFilter(s)}
            >
              <Text style={[styles.chipText, filter === s && styles.chipTextActive]}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : templates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No templates yet</Text>
            <Text style={styles.emptyBody}>
              Create your first template to speed up your workouts.
            </Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <Link href={`/templates/${item.id}`} asChild>
                <Pressable>
                  <TemplateCard
                    template={item}
                    exerciseCount={item.exerciseCount}
                    onPress={() => {}}
                  />
                </Pressable>
              </Link>
            )}
          />
        )}
        <Link href="/templates/create" asChild>
          <Pressable style={styles.fab}>
            <Text style={styles.fabText}>+ New Template</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: '#475569', textAlign: 'center' },
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
