import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme, fmtMoney, fmtWeight } from '@/src/theme';
import { useAuth } from '@/src/auth';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const load = async () => {
    try { const d = await api.dashboard(); setData(d); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ActivityIndicator color={theme.dark.brand} style={{ marginTop: 40 }} />
    </SafeAreaView>
  );

  const maxRev = Math.max(...(data?.revenue_chart || [{ value: 1 }]).map((c: any) => c.value), 1);

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="dashboard-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={theme.dark.brand}
          onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.hello}>Namaste,</Text>
            <Text style={s.name} testID="dashboard-user-name">{user?.name || 'Owner'}</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={s.iconBtn} testID="dashboard-notifications-btn">
            <Ionicons name="notifications-outline" size={22} color={theme.dark.onSurface} />
          </Pressable>
        </View>

        {/* Hero Gold Balance */}
        <View style={s.hero} testID="dashboard-gold-hero">
          <LinearGradient
            colors={[theme.dark.brandTertiary, 'rgba(212,175,55,0.05)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.heroInner}>
            <Text style={s.heroLabel}>TOTAL GOLD BALANCE</Text>
            <Text style={s.heroValue}>{fmtWeight(data?.gold_balance || 0)}</Text>
            <View style={s.heroRow}>
              <View>
                <Text style={s.miniLabel}>Fine Gold</Text>
                <Text style={s.miniVal}>{fmtWeight(data?.fine_gold || 0)}</Text>
              </View>
              <View style={s.divider} />
              <View>
                <Text style={s.miniLabel}>Silver</Text>
                <Text style={s.miniVal}>{fmtWeight(data?.silver_balance || 0)}</Text>
              </View>
              <View style={s.divider} />
              <View>
                <Text style={s.miniLabel}>Diamond</Text>
                <Text style={s.miniVal}>{(data?.diamond_balance || 0).toFixed(2)} ct</Text>
              </View>
            </View>
          </View>
        </View>

        {/* KPI Grid */}
        <View style={s.grid}>
          <Kpi icon="cube-outline" label="Running Orders" value={data?.running_orders} testID="kpi-running-orders" />
          <Kpi icon="checkmark-done-outline" label="Completed" value={data?.completed_orders} testID="kpi-completed" />
          <Kpi icon="people-outline" label="Clients" value={data?.total_clients} testID="kpi-clients" />
          <Kpi icon="calendar-outline" label="Today's Jobs" value={data?.today_jobs} testID="kpi-today-jobs" />
          <Kpi icon="cash-outline" label="Monthly Revenue" value={fmtMoney(data?.monthly_revenue || 0)} big testID="kpi-monthly-revenue" />
          <Kpi icon="hammer-outline" label="Labour Income" value={fmtMoney(data?.monthly_labour || 0)} big testID="kpi-labour" />
        </View>

        {/* Revenue chart */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Monthly Revenue</Text>
          <View style={s.chartRow}>
            {(data?.revenue_chart || []).map((c: any, i: number) => (
              <View key={i} style={s.chartBarWrap}>
                <View style={[s.chartBar, { height: 8 + (c.value / maxRev) * 120, backgroundColor: theme.dark.brand }]} />
                <Text style={s.chartLabel}>{c.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pending Payments */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Pending Payments</Text>
            <Text style={[s.sectionTitle, { color: theme.dark.warning }]}>{fmtMoney(data?.pending_payments || 0)}</Text>
          </View>
        </View>

        {/* Pending Deliveries */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pending Deliveries</Text>
          {(data?.pending_deliveries || []).slice(0, 5).map((o: any) => (
            <Pressable key={o.id} style={s.listRow}
              onPress={() => router.push(`/order/${o.id}`)}
              testID={`pending-delivery-${o.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={s.listTitle}>{o.jewellery_type} · {o.karat}</Text>
                <Text style={s.listSub}>{o.client_name} · {o.order_number}</Text>
              </View>
              <View style={s.stagePill}>
                <Text style={s.stageTxt}>{o.current_stage}</Text>
              </View>
            </Pressable>
          ))}
          {(!data?.pending_deliveries || data.pending_deliveries.length === 0) && (
            <Text style={s.empty}>No pending deliveries</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Kpi({ icon, label, value, big, testID }: any) {
  return (
    <View style={[s.kpi, big && s.kpiBig]} testID={testID}>
      <Ionicons name={icon} size={18} color={theme.dark.brand} />
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiVal, big && { fontSize: 20 }]}>{value ?? '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg, paddingTop: theme.spacing.md },
  hello: { color: theme.dark.onSurfaceSecondary, fontSize: 13 },
  name: { color: theme.dark.onSurface, fontSize: 22, fontFamily: theme.font.display, fontWeight: '600' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.dark.surfaceSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.dark.border },
  hero: { marginHorizontal: theme.spacing.lg, borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.dark.border },
  heroInner: { padding: theme.spacing.xl },
  heroLabel: { color: theme.dark.onBrandTertiary, fontSize: 11, letterSpacing: 2 },
  heroValue: { color: theme.dark.brand, fontFamily: theme.font.display, fontSize: 44, fontWeight: '600', marginTop: 8 },
  heroRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  miniLabel: { color: theme.dark.onSurfaceSecondary, fontSize: 11, letterSpacing: 1 },
  miniVal: { color: theme.dark.onSurface, fontSize: 15, fontWeight: '600', marginTop: 2 },
  divider: { width: 1, height: 32, backgroundColor: theme.dark.border, marginHorizontal: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: theme.spacing.md, gap: theme.spacing.md },
  kpi: { width: '47%', flexGrow: 1, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.dark.border },
  kpiBig: { width: '100%' },
  kpiLabel: { color: theme.dark.onSurfaceSecondary, fontSize: 11, letterSpacing: 1.5, marginTop: 8 },
  kpiVal: { color: theme.dark.onSurface, fontSize: 24, fontWeight: '700', marginTop: 4, fontFamily: theme.font.display },
  section: { padding: theme.spacing.lg, paddingTop: theme.spacing.md },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: theme.dark.onSurface, fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, height: 140, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.dark.border },
  chartBarWrap: { alignItems: 'center', flex: 1 },
  chartBar: { width: 20, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  chartLabel: { color: theme.dark.onSurfaceTertiary, fontSize: 10, marginTop: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, marginTop: 8, borderWidth: 1, borderColor: theme.dark.border },
  listTitle: { color: theme.dark.onSurface, fontSize: 14, fontWeight: '600' },
  listSub: { color: theme.dark.onSurfaceSecondary, fontSize: 12, marginTop: 2 },
  stagePill: { backgroundColor: theme.dark.brandTertiary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.pill },
  stageTxt: { color: theme.dark.onBrandTertiary, fontSize: 11, fontWeight: '600' },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 20, fontSize: 13 },
});
