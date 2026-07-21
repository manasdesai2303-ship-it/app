import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme, fmtDate } from '@/src/theme';

const FILTERS = ['All', 'In Progress', 'Delivered'];

export default function Orders() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const router = useRouter();

  const load = async () => {
    try {
      const status = filter === 'All' ? undefined : filter;
      const d = await api.orders({ status });
      setItems(d);
    } catch {}
  };
  useFocusEffect(useCallback(() => { load(); }, [filter]));

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="orders-screen">
      <View style={s.header}>
        <Text style={s.title}>Orders</Text>
        <Pressable style={s.addBtn} onPress={() => router.push('/order-new')} testID="orders-add-btn">
          <Ionicons name="add" size={20} color={theme.dark.onBrandPrimary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.chipsScroll}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 8, alignItems: 'center' }}>
        {FILTERS.map((t) => (
          <Pressable key={t} onPress={() => setFilter(t)}
            style={[s.chip, filter === t && s.chipActive, { flexShrink: 0 }]}
            testID={`orders-filter-${t.replace(' ', '-').toLowerCase()}`}>
            <Text style={[s.chipTxt, filter === t && s.chipTxtActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40, paddingTop: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={s.card}
            onPress={() => router.push(`/order/${item.id}`)}
            testID={`order-card-${item.id}`}>
            <View style={s.cardTop}>
              <View>
                <Text style={s.cardId}>{item.order_number}</Text>
                <Text style={s.cardTitle}>{item.jewellery_type} · {item.karat}</Text>
              </View>
              <View style={[s.statusPill, { backgroundColor: item.status === 'Delivered' ? theme.dark.brandTertiary : theme.dark.surfaceTertiary }]}>
                <Text style={[s.statusTxt, { color: item.status === 'Delivered' ? theme.dark.success : theme.dark.warning }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={s.cardClient}>{item.client_name}</Text>
            <View style={s.cardFooter}>
              <View style={s.stagePill}>
                <Ionicons name="ellipse" size={6} color={theme.dark.brand} />
                <Text style={s.stageTxt}>{item.current_stage}</Text>
              </View>
              <Text style={s.dateTxt}>Due {fmtDate(item.expected_delivery)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.empty}>No orders yet.</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg, paddingTop: theme.spacing.md },
  title: { color: theme.dark.onSurface, fontFamily: theme.font.display, fontSize: 30, fontWeight: '600' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.dark.brand, alignItems: 'center', justifyContent: 'center' },
  chipsScroll: { marginTop: theme.spacing.sm, maxHeight: 56 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.dark.border, backgroundColor: theme.dark.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: theme.dark.brand, borderColor: theme.dark.brand },
  chipTxt: { color: theme.dark.onSurfaceSecondary, fontSize: 12, fontWeight: '600' },
  chipTxtActive: { color: theme.dark.onBrandPrimary },
  card: { backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.dark.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardId: { color: theme.dark.onSurfaceTertiary, fontSize: 11, letterSpacing: 1 },
  cardTitle: { color: theme.dark.onSurface, fontSize: 16, fontWeight: '600', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  statusTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardClient: { color: theme.dark.onSurfaceSecondary, fontSize: 13, marginTop: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  stagePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.dark.brandTertiary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.pill },
  stageTxt: { color: theme.dark.onBrandTertiary, fontSize: 11, fontWeight: '600' },
  dateTxt: { color: theme.dark.onSurfaceTertiary, fontSize: 11 },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 40 },
});
