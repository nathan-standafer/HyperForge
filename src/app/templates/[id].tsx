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
import { TemplateForm } from '../../components/TemplateForm';
import {
  getTemplateDetail,
  updateTemplate,
  deleteTemplate,
  type CreateTemplateInput,
} from '../../services/template-service';
import type { TemplateDetail } from '../../models/template';
import { startSessionFromTemplate } from '../../services/session-template-service';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<TemplateDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const d = await getTemplateDetail(id);
      if (!cancelled) {
        setDetail(d);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Template', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) await deleteTemplate(id);
          router.back();
        },
      },
    ]);
  };

  const handleSaveEdit = async (input: CreateTemplateInput) => {
    if (!id) return;
    await updateTemplate(id, { name: input.name, styleTag: input.styleTag ?? null });
    const refreshed = await getTemplateDetail(id);
    setDetail(refreshed);
    setEditing(false);
  };

  if (loading || !detail) {
    return <ActivityIndicator style={{ marginTop: 32 }} />;
  }

  if (editing) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Template' }} />
        <TemplateForm
          initial={detail}
          onSave={handleSaveEdit}
          onCancel={() => setEditing(false)}
        />
      </>
    );
  }

  const canStart = detail.exercises.length > 0;

  return (
    <>
      <Stack.Screen options={{ title: detail.name }} />
      <ScrollView style={styles.container}>
        {detail.styleTag && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{detail.styleTag}</Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>
          Exercises ({detail.exercises.length})
        </Text>
        {detail.exercises.map((ex) => (
          <View key={ex.id} style={styles.exRow}>
            <Text style={styles.exName}>{ex.exerciseName}</Text>
            <Text style={styles.exTargets}>
              {ex.targetSets} x {ex.targetReps}
              {ex.targetWeight != null && ex.targetWeight > 0
                ? ` @ ${ex.targetWeight}`
                : ''}
            </Text>
          </View>
        ))}
        <View style={styles.actions}>
          <Pressable
            style={[styles.startBtn, !canStart && { opacity: 0.4 }]}
            disabled={!canStart}
            onPress={async () => {
              if (!id) return;
              await startSessionFromTemplate(id);
              router.navigate('/');
            }}
          >
            <Text style={styles.startBtnText}>
              {canStart ? 'Start Workout' : 'Add exercises first'}
            </Text>
          </Pressable>
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryBtn} onPress={() => setEditing(true)}>
              <Text style={styles.secondaryBtnText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={handleDelete}>
              <Text style={[styles.secondaryBtnText, { color: '#ef4444' }]}>
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 16,
  },
  tagText: { fontSize: 13, color: '#3730a3', fontWeight: '500' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  exRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  exName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  exTargets: { fontSize: 13, color: '#64748b', marginTop: 2 },
  actions: { marginTop: 24, gap: 12, marginBottom: 40 },
  startBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#334155' },
});
