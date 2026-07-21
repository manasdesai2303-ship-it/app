import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme, fmtWeight, fmtMoney } from '@/src/theme';

export default function Karigars() {
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();
  useFocusEffect(useCallback(() => {
    (async () => { try { setItems(await api.karigars()); } catch {} })();
  }, []));

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="karigars-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <Text style={s.title}>Karigars</Text>
        <Pressable style={s.addBtn} onPress={() => router.push('/karigar-new')} testID="karigars-add-btn">
          <Ionicons name="add" size={20} color={theme.dark.onBrandPrimary} />
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        renderItem={({ item }) => (
          <View style={s.card} testID={`karigar-${item.id}`}>
            <View style={s.top}>
              <View style={s.avatar}><Ionicons name="hammer" size={16} color={theme.dark.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.sub}>{item.speciality || '—'} · {item.phone || '—'}</Text>
              </View>
            </View>
            <View style={s.metrics}>
              <Metric label="Rate" value={fmtMoney(item.labour_rate) + '/g'} />
              <Metric label="Active" value={String(item.work_assigned || 0)} />
              <Metric label="Done" value={String(item.work_completed || 0)} />
              <Metric label="Balance" value={fmtWeight(item.material_balance || 0)} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No karigars</Text>}
      />
    </SafeAreaView>
  );
}

function Metric({ label, value }: any) {
  return (
    <View style={{ alignItems: 'flex-start', flex: 1 }}>
      <Text style={s.mLabel}>{label}</Text>
      <Text style={s.mVal}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  title: { color: theme.dark.onSurface, fontSize: 18, fontWeight: '600' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.dark.brand, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: 10, borderWidth: 1, borderColor: theme.dark.border },
  top: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.dark.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  name: { color: theme.dark.onSurface, fontSize: 15, fontWeight: '600' },
  sub: { color: theme.dark.onSurfaceSecondary, fontSize: 12, marginTop: 2 },
  metrics: { flexDirection: 'row', paddingTop: 8, borderTopWidth: 0.5, borderTopColor: theme.dark.divider },
  mLabel: { color: theme.dark.onSurfaceTertiary, fontSize: 10, letterSpacing: 1 },
  mVal: { color: theme.dark.brand, fontSize: 13, fontWeight: '600', marginTop: 2 },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 40 },
});
