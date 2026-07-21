import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme, fmtMoney, fmtWeight } from '@/src/theme';

export default function Reports() {
  const [d, setD] = useState<any>(null);
  const router = useRouter();
  useFocusEffect(useCallback(() => {
    (async () => { try { setD(await api.dashboard()); } catch {} })();
  }, []));

  if (!d) return <SafeAreaView style={s.container} edges={['top']}><Text style={s.empty}>Loading…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="reports-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <Text style={s.title}>Reports</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: 12 }}>
        <Section title="Business Overview">
          <Row label="Total Clients" value={d.total_clients} />
          <Row label="Wholesalers" value={d.total_wholesalers} />
          <Row label="Suppliers" value={d.total_suppliers} />
          <Row label="Running Orders" value={d.running_orders} />
          <Row label="Completed Orders" value={d.completed_orders} />
          <Row label="Today's Jobs" value={d.today_jobs} />
        </Section>
        <Section title="Material Balance">
          <Row label="Gold Balance" value={fmtWeight(d.gold_balance)} />
          <Row label="Fine Gold" value={fmtWeight(d.fine_gold)} highlight />
          <Row label="Silver Balance" value={fmtWeight(d.silver_balance)} />
          <Row label="Diamond Balance" value={`${(d.diamond_balance || 0).toFixed(2)} ct`} />
        </Section>
        <Section title="Financial Report (This Month)">
          <Row label="Monthly Revenue" value={fmtMoney(d.monthly_revenue)} highlight />
          <Row label="Labour Income" value={fmtMoney(d.monthly_labour)} />
          <Row label="Pending Payments" value={fmtMoney(d.pending_payments)} />
          <Row label="Low Stock Items" value={d.low_stock_count} />
        </Section>
        <Text style={s.note}>Tip: PDF & Excel export available in next release.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
function Section({ title, children }: any) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Row({ label, value, highlight }: any) {
  return (
    <View style={s.row}>
      <Text style={s.rowL}>{label}</Text>
      <Text style={[s.rowV, highlight && { color: theme.dark.brand }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  title: { color: theme.dark.onSurface, fontSize: 18, fontWeight: '600' },
  section: { backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.dark.border },
  sectionTitle: { color: theme.dark.brand, fontSize: 12, letterSpacing: 2, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.dark.divider },
  rowL: { color: theme.dark.onSurfaceSecondary, fontSize: 13 },
  rowV: { color: theme.dark.onSurface, fontSize: 13, fontWeight: '600' },
  note: { color: theme.dark.onSurfaceTertiary, fontSize: 12, textAlign: 'center', marginTop: 16 },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 40 },
});
