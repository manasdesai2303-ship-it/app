import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme, CLIENT_TYPES } from '@/src/theme';

export default function Clients() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [q, setQ] = useState('');
  const router = useRouter();

  const load = async () => {
    try {
      const type = filter === 'All' ? undefined : filter;
      const d = await api.clients(type, q);
      setItems(d);
    } catch {}
  };
  useFocusEffect(useCallback(() => { load(); }, [filter, q]));

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="clients-screen">
      <View style={s.header}>
        <Text style={s.title}>Clients</Text>
        <Pressable style={s.addBtn} onPress={() => router.push('/client-new')} testID="clients-add-btn">
          <Ionicons name="add" size={20} color={theme.dark.onBrandPrimary} />
        </Pressable>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={theme.dark.onSurfaceTertiary} />
        <TextInput
          testID="clients-search"
          value={q} onChangeText={setQ}
          placeholder="Search clients..."
          placeholderTextColor={theme.dark.onSurfaceTertiary}
          style={s.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.chipsScroll}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 8, alignItems: 'center' }}>
        {['All', ...CLIENT_TYPES].map((t) => (
          <Pressable
            key={t}
            onPress={() => setFilter(t)}
            style={[s.chip, filter === t && s.chipActive, { flexShrink: 0 }]}
            testID={`clients-filter-${t.toLowerCase()}`}
          >
            <Text style={[s.chipTxt, filter === t && s.chipTxtActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 40, paddingTop: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={s.row}
            onPress={() => router.push(`/client/${item.id}`)}
            testID={`client-row-${item.id}`}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{(item.name || '?')[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{item.name}</Text>
              <Text style={s.rowSub}>{item.company || item.phone || '—'}</Text>
            </View>
            <View style={s.typeTag}>
              <Text style={s.typeTxt}>{item.type}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.dark.onSurfaceTertiary} />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.empty}>No clients found.</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg, paddingTop: theme.spacing.md },
  title: { color: theme.dark.onSurface, fontFamily: theme.font.display, fontSize: 30, fontWeight: '600' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.dark.brand, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.dark.surfaceSecondary, marginHorizontal: theme.spacing.lg, borderRadius: theme.radius.md, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.dark.border },
  searchInput: { flex: 1, color: theme.dark.onSurface, paddingVertical: 10, fontSize: 14 },
  chipsScroll: { marginTop: theme.spacing.md, maxHeight: 56 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.dark.border, backgroundColor: theme.dark.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: theme.dark.brand, borderColor: theme.dark.brand },
  chipTxt: { color: theme.dark.onSurfaceSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  chipTxtActive: { color: theme.dark.onBrandPrimary },
  row: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, marginBottom: 8, borderWidth: 1, borderColor: theme.dark.border, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.dark.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: theme.dark.brand, fontWeight: '700' },
  rowTitle: { color: theme.dark.onSurface, fontSize: 14, fontWeight: '600' },
  rowSub: { color: theme.dark.onSurfaceSecondary, fontSize: 12, marginTop: 2 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.pill, backgroundColor: theme.dark.surfaceTertiary, borderWidth: 1, borderColor: theme.dark.border },
  typeTxt: { color: theme.dark.onSurfaceSecondary, fontSize: 10, fontWeight: '600' },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 40, fontSize: 13 },
});
