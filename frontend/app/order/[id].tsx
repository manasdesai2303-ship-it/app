import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme, fmtDate, fmtWeight, fmtMoney, STAGES } from '@/src/theme';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [advancing, setAdvancing] = useState(false);

  const load = async () => {
    if (!id) return;
    try { const o = await api.order(id); setOrder(o); } catch {}
  };
  useFocusEffect(useCallback(() => { load(); }, [id]));

  if (!order) return <SafeAreaView style={s.container} edges={['top']}><Text style={s.empty}>Loading…</Text></SafeAreaView>;

  const currentIdx = STAGES.indexOf(order.current_stage);
  const advance = async () => {
    if (currentIdx >= STAGES.length - 1) return;
    setAdvancing(true);
    try {
      await api.advanceStage(id!, { stage: STAGES[currentIdx + 1], karigar_id: order.karigar_id, remarks: '' });
      await load();
    } finally { setAdvancing(false); }
  };

  const labour = order.expected_weight * order.labour_rate;
  const subtotal = labour + order.stone_setting_charges + order.other_charges;
  const gst = subtotal * 0.03;
  const total = subtotal + gst;

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="order-detail-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()} testID="order-back-btn"><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <Text style={s.headerTitle}>{order.order_number}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={s.hero}>
          <Text style={s.type}>{order.jewellery_type}</Text>
          <Text style={s.karat}>{order.karat} · {fmtWeight(order.expected_weight)}</Text>
          <Text style={s.clientName}>{order.client?.name}</Text>
          <View style={s.miniRow}>
            <Text style={s.mini}>Due {fmtDate(order.expected_delivery)}</Text>
            <View style={s.statusPill}>
              <Text style={s.statusTxt}>{order.status}</Text>
            </View>
          </View>
        </View>

        {order.design_image ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Design Photo</Text>
            <Image
              source={order.design_image}
              style={{ width: '100%', height: 240, borderRadius: theme.radius.md, marginTop: 10, backgroundColor: theme.dark.surfaceSecondary }}
              contentFit="cover"
              testID="order-design-photo"
            />
          </View>
        ) : null}

        {/* Job Card */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Job Card</Text>
          <View style={s.jobCard}>
            <Row label="Order #" value={order.order_number} />
            <Row label="Client" value={order.client?.name} />
            <Row label="Item" value={`${order.jewellery_type} · ${order.karat}`} />
            <Row label="Weight" value={fmtWeight(order.expected_weight)} />
            <Row label="Karigar" value={order.karigar?.name || '—'} />
            <Row label="Delivery" value={fmtDate(order.expected_delivery)} />
            {order.remarks ? <Row label="Notes" value={order.remarks} /> : null}
          </View>
        </View>

        {/* Stage Timeline */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Manufacturing Stages</Text>
          <View style={{ marginTop: 12 }}>
            {STAGES.map((st, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              const histEntry = order.stage_history?.find((h: any) => h.stage === st);
              return (
                <View key={st} style={s.stageRow} testID={`stage-${st.replace(/ /g, '-').toLowerCase()}`}>
                  <View style={s.stageCol}>
                    <View style={[s.stageDot,
                      done && { backgroundColor: theme.dark.success, borderColor: theme.dark.success },
                      active && { backgroundColor: theme.dark.brand, borderColor: theme.dark.brand }]}>
                      {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    {i < STAGES.length - 1 && <View style={[s.stageLine, (done || active) && { backgroundColor: done ? theme.dark.success : theme.dark.brand }]} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 14 }}>
                    <Text style={[s.stageName, (active || done) && { color: theme.dark.onSurface }]}>{st}</Text>
                    {histEntry?.completed_at && <Text style={s.stageDate}>{fmtDate(histEntry.completed_at)}</Text>}
                    {active && <Text style={[s.stageDate, { color: theme.dark.brand }]}>In progress</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Cost summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Cost Summary (Client-supplied gold not charged)</Text>
          <View style={s.jobCard}>
            <Row label="Labour" value={fmtMoney(labour)} />
            <Row label="Stone Setting" value={fmtMoney(order.stone_setting_charges)} />
            <Row label="Other Charges" value={fmtMoney(order.other_charges)} />
            <Row label="GST 3%" value={fmtMoney(gst)} />
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL</Text>
              <Text style={s.totalVal}>{fmtMoney(total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {order.status !== 'Delivered' && (
        <Pressable style={s.bottomBtn} onPress={advance} disabled={advancing} testID="advance-stage-btn">
          <Text style={s.bottomBtnTxt}>
            {advancing ? 'Updating…' : `Advance to: ${STAGES[Math.min(currentIdx + 1, STAGES.length - 1)]}`}
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: any) {
  return (
    <View style={s.kv}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvVal}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  headerTitle: { color: theme.dark.onSurface, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'center', letterSpacing: 1 },
  hero: { padding: theme.spacing.xl, backgroundColor: theme.dark.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  type: { color: theme.dark.onSurface, fontSize: 30, fontFamily: theme.font.display, fontWeight: '600' },
  karat: { color: theme.dark.brand, fontSize: 15, marginTop: 4, fontWeight: '600' },
  clientName: { color: theme.dark.onSurfaceSecondary, fontSize: 14, marginTop: 6 },
  miniRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  mini: { color: theme.dark.onSurfaceTertiary, fontSize: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.pill, backgroundColor: theme.dark.brandTertiary },
  statusTxt: { color: theme.dark.brand, fontSize: 11, fontWeight: '700' },
  section: { padding: theme.spacing.lg },
  sectionTitle: { color: theme.dark.onSurface, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  jobCard: { backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.dark.border, padding: theme.spacing.lg, marginTop: 10 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: theme.dark.divider },
  kvLabel: { color: theme.dark.onSurfaceSecondary, fontSize: 13 },
  kvVal: { color: theme.dark.onSurface, fontSize: 13, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: theme.dark.brand },
  totalLabel: { color: theme.dark.brand, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  totalVal: { color: theme.dark.brand, fontSize: 20, fontWeight: '700', fontFamily: theme.font.display },
  stageRow: { flexDirection: 'row', gap: 12 },
  stageCol: { alignItems: 'center', width: 24 },
  stageDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.dark.border, backgroundColor: theme.dark.surface, alignItems: 'center', justifyContent: 'center' },
  stageLine: { width: 2, flex: 1, backgroundColor: theme.dark.border, minHeight: 20 },
  stageName: { color: theme.dark.onSurfaceSecondary, fontSize: 14, fontWeight: '600' },
  stageDate: { color: theme.dark.onSurfaceTertiary, fontSize: 11, marginTop: 2 },
  bottomBtn: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: theme.dark.brand, borderRadius: theme.radius.md, paddingVertical: 16, alignItems: 'center' },
  bottomBtnTxt: { color: theme.dark.onBrandPrimary, fontWeight: '700', letterSpacing: 0.5 },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 40 },
});
