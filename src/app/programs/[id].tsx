import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ProgramDayRow } from '../../components/ProgramDayRow';
import {
  getProgramDetail,
  setActiveProgram,
  clearActiveProgram,
  deleteProgram,
} from '../../services/program-service';
import { type DayOfWeek, type ProgramDetail } from '../../models/program';

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const d = await getProgramDetail(id);
      if (!cancelled) {
        setDetail(d);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleToggle = async () => {
    if (!id || !detail) return;
    if (detail.isActive) {
      await clearActiveProgram();
    } else {
      await setActiveProgram(id);
    }
    const refreshed = await getProgramDetail(id);
    setDetail(refreshed);
  };

  const handleDelete = () => {
    Alert.alert('Delete Program', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) await deleteProgram(id);
          router.back();
        },
      },
    ]);
  };

  if (loading || !detail) {
    return <ActivityIndicator style={{ marginTop: 32 }} />;
  }

  const dayMap = new Map(detail.days.map((d) => [d.dayOfWeek, d.templateName]));

  return (
    <>
      <Stack.Screen options={{ title: detail.name }} />
      <ScrollView style={styles.container}>
        {detail.isActive && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeText}>Active Program</Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>Schedule</Text>
        {ALL_DAYS.map((d) => (
          <ProgramDayRow
            key={d}
            dayOfWeek={d}
            templateName={dayMap.get(d) ?? null}
            onPress={() => {}}
          />
        ))}
        <View style={styles.actions}>
          <Pressable style={styles.toggleBtn} onPress={handleToggle}>
            <Text style={styles.toggleBtnText}>
              {detail.isActive ? 'Deactivate' : 'Set as Active'}
            </Text>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Program</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  activeBanner: {
    backgroundColor: '#dcfce7',
    padding: 12,
    alignItems: 'center',
  },
  activeText: { color: '#16a34a', fontWeight: '700' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  actions: { padding: 16, gap: 12, marginBottom: 40 },
  toggleBtn: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
  },
  toggleBtnText: { color: '#1e3a8a', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
