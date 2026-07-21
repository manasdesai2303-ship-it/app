import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any>({ clients: [], orders: [], karigars: [], invoices: [] });

  const run = async (v: string) => {
    setQ(v);
    if (v.length < 1) return setRes({ clients: [], orders: [], karigars: [], invoices: [] });
    try { setRes(await api.search(v)); } catch {}
  };

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="search-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={theme.dark.onSurfaceTertiary} />
          <TextInput autoFocus value={q} onChangeText={run}
            placeholder="Search everything..."
            placeholderTextColor={theme.dark.onSurfaceTertiary}
            style={s.searchInput} testID="search-input" />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Section title="Clients" items={res.clients}
          render={(x) => x.name + ' · ' + (x.company || x.type)}
          onPress={(x) => router.push(`/client/${x.id}`)}
          testID="search-clients" />
        <Section title="Orders" items={res.orders}
          render={(x) => x.order_number + ' · ' + x.jewellery_type}
          onPress={(x) => router.push(`/order/${x.id}`)}
          testID="search-orders" />
        <Section title="Karigars" items={res.karigars}
          render={(x) => x.name + ' · ' + (x.speciality || '')}
          onPress={() => {}}
          testID="search-karigars" />
        <Section title="Invoices" items={res.invoices}
          render={(x) => x.invoice_number}
          onPress={() => {}}
          testID="search-invoices" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, items, render, onPress, testID }: any) {
  if (!items || items.length === 0) return null;
  return (
    <View style={{ marginBottom: 24 }} testID={testID}>
      <Text style={s.sectionTitle}>{title}</Text>
      {items.map((x: any) => (
        <Pressable key={x.id} style={s.row} onPress={() => onPress(x)}>
          <Text style={s.rowTxt}>{render(x)}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.dark.onSurfaceTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.dark.border },
  searchInput: { flex: 1, color: theme.dark.onSurface, paddingVertical: 10, fontSize: 14 },
  sectionTitle: { color: theme.dark.brand, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, marginBottom: 6, borderWidth: 1, borderColor: theme.dark.border },
  rowTxt: { color: theme.dark.onSurface, fontSize: 14 },
});
