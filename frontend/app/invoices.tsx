import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme, fmtMoney } from '@/src/theme';

export default function Invoices() {
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();
  useFocusEffect(useCallback(() => {
    (async () => { try { setItems(await api.invoices()); } catch {} })();
  }, []));

  const total = items.reduce((a, i) => a + (i.total || 0), 0);
  const due = items.reduce((a, i) => a + (i.balance || 0), 0);

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="invoices-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <Text style={s.title}>Invoices</Text>
        <View style={{ width: 26 }} />
      </View>
      <View style={s.summary}>
        <View style={s.sumCard}>
          <Text style={s.sumLabel}>Total Invoiced</Text>
          <Text style={s.sumVal}>{fmtMoney(total)}</Text>
        </View>
        <View style={s.sumCard}>
          <Text style={s.sumLabel}>Outstanding</Text>
          <Text style={[s.sumVal, { color: theme.dark.warning }]}>{fmtMoney(due)}</Text>
        </View>
      </View>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        renderItem={({ item }) => (
          <View style={s.row} testID={`inv-row-${item.id}`}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowNum}>{item.invoice_number}</Text>
              <Text style={s.rowSub}>{item.client_name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.rowTotal}>{fmtMoney(item.total)}</Text>
              <Text style={[s.rowStatus, { color: item.status === 'Paid' ? theme.dark.success : theme.dark.warning }]}>{item.status}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No invoices</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  title: { color: theme.dark.onSurface, fontSize: 18, fontWeight: '600' },
  summary: { flexDirection: 'row', gap: 12, padding: theme.spacing.lg, paddingBottom: 0 },
  sumCard: { flex: 1, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.dark.border },
  sumLabel: { color: theme.dark.onSurfaceSecondary, fontSize: 11, letterSpacing: 1 },
  sumVal: { color: theme.dark.brand, fontSize: 20, fontWeight: '700', fontFamily: theme.font.display, marginTop: 4 },
  row: { flexDirection: 'row', backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: 8, borderWidth: 1, borderColor: theme.dark.border, alignItems: 'center' },
  rowNum: { color: theme.dark.onSurface, fontWeight: '600' },
  rowSub: { color: theme.dark.onSurfaceSecondary, fontSize: 12, marginTop: 2 },
  rowTotal: { color: theme.dark.onSurface, fontWeight: '700', fontSize: 15 },
  rowStatus: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 40 },
});
