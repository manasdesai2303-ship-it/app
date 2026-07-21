import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme, fmtWeight, fmtMoney, fmtDate, KARATS } from '@/src/theme';

const TABS = ['Dashboard', 'Orders', 'Gold', 'Silver', 'Diamond', 'Gemstone', 'Cash', 'Invoices'];

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [tab, setTab] = useState('Dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [gold, setGold] = useState<any[]>([]);
  const [silver, setSilver] = useState<any[]>([]);
  const [diamond, setDiamond] = useState<any[]>([]);
  const [gem, setGem] = useState<any[]>([]);
  const [cash, setCash] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const load = async () => {
    if (!id) return;
    try {
      const [c, o, g, si, di, ge, ca, iv] = await Promise.all([
        api.client(id), api.orders({ client_id: id }),
        api.goldEntries(id), api.silverEntries(id), api.diamondEntries(id),
        api.gemstoneEntries(id), api.cashEntries(id), api.invoices(id),
      ]);
      setClient(c); setOrders(o); setGold(g); setSilver(si); setDiamond(di);
      setGem(ge); setCash(ca); setInvoices(iv);
    } catch {}
  };
  useFocusEffect(useCallback(() => { load(); }, [id]));

  if (!client) return <SafeAreaView style={s.container} edges={['top']}><Text style={s.empty}>Loading…</Text></SafeAreaView>;

  const totalGoldFine = gold.reduce((a, x) => a + (x.fine_gold || 0), 0);
  const totalCashPaid = cash.filter((c) => c.type !== 'invoice').reduce((a, x) => a + (x.amount || 0), 0);
  const totalInvoice = invoices.reduce((a, i) => a + (i.total || 0), 0);
  const balanceDue = invoices.reduce((a, i) => a + (i.balance || 0), 0);

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="client-detail-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()} testID="client-back-btn"><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{client.name}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView>
        <View style={s.profile}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{client.name[0]}</Text></View>
          <Text style={s.name}>{client.name}</Text>
          <Text style={s.sub}>{client.company || '—'} · {client.type}</Text>
          <View style={s.metaRow}>
            {client.phone ? <Meta icon="call-outline" text={client.phone} /> : null}
            {client.email ? <Meta icon="mail-outline" text={client.email} /> : null}
          </View>
          {client.gst ? <Text style={s.subFine}>GST: {client.gst}</Text> : null}
          {client.address ? <Text style={s.subFine}>{client.address}</Text> : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.tabsScroll}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 8, alignItems: 'center' }}>
          {TABS.map((t) => (
            <Pressable key={t} onPress={() => setTab(t)}
              style={[s.tab, tab === t && s.tabActive, { flexShrink: 0 }]}
              testID={`client-tab-${t.toLowerCase()}`}>
              <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ padding: theme.spacing.lg, paddingBottom: 60 }}>
          {tab === 'Dashboard' && (
            <View style={{ gap: 12 }}>
              <SumCard label="Fine Gold Total" value={fmtWeight(totalGoldFine)} testID="client-sum-gold" />
              <SumCard label="Total Invoiced" value={fmtMoney(totalInvoice)} testID="client-sum-invoice" />
              <SumCard label="Amount Paid" value={fmtMoney(totalCashPaid)} testID="client-sum-paid" />
              <SumCard label="Balance Due" value={fmtMoney(balanceDue)} highlight testID="client-sum-due" />
              <SumCard label="Active Orders" value={String(orders.filter((o: any) => o.status !== 'Delivered').length)} testID="client-sum-orders" />
            </View>
          )}
          {tab === 'Orders' && (
            <View style={{ gap: 8 }}>
              {orders.map((o: any) => (
                <Pressable key={o.id} style={s.row} onPress={() => router.push(`/order/${o.id}`)}
                  testID={`client-order-${o.id}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{o.jewellery_type} · {o.karat}</Text>
                    <Text style={s.rowSub}>{o.order_number} · {o.current_stage}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.dark.onSurfaceTertiary} />
                </Pressable>
              ))}
              {orders.length === 0 && <Text style={s.empty}>No orders</Text>}
            </View>
          )}
          {tab === 'Gold' && (
            <View>
              <Pressable style={s.addRow} onPress={() => router.push(`/gold-new?client_id=${id}`)} testID="client-add-gold">
                <Ionicons name="add-circle" size={20} color={theme.dark.brand} />
                <Text style={s.addRowTxt}>Add Gold Entry</Text>
              </Pressable>
              {KARATS.map((k) => {
                const rows = gold.filter((g: any) => g.karat === k);
                if (rows.length === 0) return null;
                const bal = rows.reduce((a: number, r: any) => a + (r.received - r.issued + r.returned), 0);
                const fine = rows.reduce((a: number, r: any) => a + (r.fine_gold || 0), 0);
                return (
                  <View key={k} style={s.karatBlock}>
                    <View style={s.karatHead}>
                      <View style={s.karatBadge}><Text style={s.karatBadgeTxt}>{k}</Text></View>
                      <Text style={s.karatBal}>{fmtWeight(bal)} · fine {fmtWeight(fine)}</Text>
                    </View>
                    {rows.map((r: any) => (
                      <View key={r.id} style={s.ledgerRow}>
                        <Text style={s.ledgerDate}>{fmtDate(r.created_at)}</Text>
                        <Text style={s.ledgerCol}>Gross {r.gross_weight.toFixed(3)}</Text>
                        <Text style={s.ledgerCol}>Net {r.net_weight?.toFixed(3)}</Text>
                        <Text style={[s.ledgerCol, { color: theme.dark.brand }]}>Fine {r.fine_gold?.toFixed(3)}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
              {gold.length === 0 && <Text style={s.empty}>No gold entries</Text>}
            </View>
          )}
          {tab === 'Silver' && (
            <LedgerList data={silver} testIDPrefix="silver"
              addPath={`/silver-new?client_id=${id}`}
              renderRow={(r) => `${fmtDate(r.created_at)} · ${r.purity}% · Wt ${r.weight.toFixed(3)}g · Rec ${r.received.toFixed(3)} / Iss ${r.issued.toFixed(3)}`} />
          )}
          {tab === 'Diamond' && (
            <LedgerList data={diamond} testIDPrefix="diamond"
              addPath={`/diamond-new?client_id=${id}`}
              renderRow={(r) => `${fmtDate(r.created_at)} · ${r.diamond_type} · ${r.carat}ct × ${r.pieces} pcs · ${fmtMoney(r.cost)}`} />
          )}
          {tab === 'Gemstone' && (
            <LedgerList data={gem} testIDPrefix="gemstone"
              addPath={`/gemstone-new?client_id=${id}`}
              renderRow={(r) => `${fmtDate(r.created_at)} · ${r.stone_type} · ${r.pieces} pcs · ${r.weight.toFixed(3)}g`} />
          )}
          {tab === 'Cash' && (
            <LedgerList data={cash} testIDPrefix="cash"
              addPath={`/cash-new?client_id=${id}`}
              renderRow={(r) => `${fmtDate(r.created_at)} · ${r.type.toUpperCase()} · ${fmtMoney(r.amount)} · ${r.method}`} />
          )}
          {tab === 'Invoices' && (
            <View style={{ gap: 8 }}>
              {invoices.map((iv: any) => (
                <View key={iv.id} style={s.row} testID={`invoice-${iv.id}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{iv.invoice_number}</Text>
                    <Text style={s.rowSub}>Total {fmtMoney(iv.total)} · Balance {fmtMoney(iv.balance)}</Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: iv.status === 'Paid' ? theme.dark.brandTertiary : theme.dark.surfaceTertiary }]}>
                    <Text style={[s.statusTxt, { color: iv.status === 'Paid' ? theme.dark.success : theme.dark.warning }]}>{iv.status}</Text>
                  </View>
                </View>
              ))}
              {invoices.length === 0 && <Text style={s.empty}>No invoices</Text>}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon, text }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={12} color={theme.dark.onSurfaceSecondary} />
      <Text style={{ color: theme.dark.onSurfaceSecondary, fontSize: 12 }}>{text}</Text>
    </View>
  );
}
function SumCard({ label, value, highlight, testID }: any) {
  return (
    <View style={[s.sumCard, highlight && { borderColor: theme.dark.brand }]} testID={testID}>
      <Text style={s.sumLabel}>{label}</Text>
      <Text style={[s.sumVal, highlight && { color: theme.dark.brand }]}>{value}</Text>
    </View>
  );
}
function LedgerList({ data, renderRow, testIDPrefix, addPath }: any) {
  const router = useRouter();
  return (
    <View>
      {addPath && (
        <Pressable style={s.addRow} onPress={() => router.push(addPath)} testID={`${testIDPrefix}-add`}>
          <Ionicons name="add-circle" size={20} color={theme.dark.brand} />
          <Text style={s.addRowTxt}>Add Entry</Text>
        </Pressable>
      )}
      {data.map((r: any) => (
        <View key={r.id} style={s.ledgerRowFull} testID={`${testIDPrefix}-row-${r.id}`}>
          <Text style={{ color: theme.dark.onSurface, fontSize: 13 }}>{renderRow(r)}</Text>
        </View>
      ))}
      {data.length === 0 && <Text style={s.empty}>No entries</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  headerTitle: { color: theme.dark.onSurface, fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  profile: { alignItems: 'center', padding: theme.spacing.xl, gap: 6 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.dark.brandTertiary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.dark.brand },
  avatarTxt: { color: theme.dark.brand, fontSize: 28, fontWeight: '700' },
  name: { color: theme.dark.onSurface, fontSize: 22, fontFamily: theme.font.display, fontWeight: '600', marginTop: 8 },
  sub: { color: theme.dark.onSurfaceSecondary, fontSize: 13 },
  subFine: { color: theme.dark.onSurfaceTertiary, fontSize: 12, textAlign: 'center' },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 6 },
  tabsScroll: { maxHeight: 56, borderTopWidth: 1, borderTopColor: theme.dark.border, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  tab: { paddingHorizontal: 14, height: 36, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.dark.border, backgroundColor: theme.dark.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: theme.dark.brand, borderColor: theme.dark.brand },
  tabTxt: { color: theme.dark.onSurfaceSecondary, fontSize: 12, fontWeight: '600' },
  tabTxtActive: { color: theme.dark.onBrandPrimary },
  sumCard: { padding: theme.spacing.lg, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.dark.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { color: theme.dark.onSurfaceSecondary, fontSize: 13 },
  sumVal: { color: theme.dark.onSurface, fontSize: 18, fontWeight: '700', fontFamily: theme.font.display },
  row: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.dark.border },
  rowTitle: { color: theme.dark.onSurface, fontWeight: '600' },
  rowSub: { color: theme.dark.onSurfaceSecondary, fontSize: 12, marginTop: 2 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.dark.brand, backgroundColor: theme.dark.brandTertiary, marginBottom: 10 },
  addRowTxt: { color: theme.dark.brand, fontWeight: '700' },
  karatBlock: { marginBottom: 14 },
  karatHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  karatBadge: { backgroundColor: theme.dark.brand, paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.radius.sm },
  karatBadgeTxt: { color: theme.dark.onBrandPrimary, fontWeight: '700', fontSize: 12 },
  karatBal: { color: theme.dark.onSurface, fontWeight: '600', fontSize: 13 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.dark.divider },
  ledgerDate: { color: theme.dark.onSurfaceSecondary, fontSize: 11, width: 78 },
  ledgerCol: { color: theme.dark.onSurface, fontSize: 12, flex: 1 },
  ledgerRowFull: { padding: theme.spacing.md, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.dark.border, marginBottom: 6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  statusTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 20 },
});
