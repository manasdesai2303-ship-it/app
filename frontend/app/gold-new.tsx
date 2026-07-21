import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormShell, Field, Picker } from '@/src/form';
import { api } from '@/src/api';
import { KARATS } from '@/src/theme';

export default function GoldNew() {
  const router = useRouter();
  const { client_id } = useLocalSearchParams<{ client_id: string }>();
  const [f, setF] = useState<any>({
    karat: '22K', purity: '', gross_weight: '10', stone_weight: '0',
    received: '10', issued: '0', returned: '0', wastage: '0', recovery: '0', remarks: '',
  });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!client_id) return;
    setSaving(true);
    try {
      await api.addGold({
        client_id,
        karat: f.karat,
        purity: f.purity ? Number(f.purity) : null,
        gross_weight: Number(f.gross_weight) || 0,
        stone_weight: Number(f.stone_weight) || 0,
        received: Number(f.received) || 0,
        issued: Number(f.issued) || 0,
        returned: Number(f.returned) || 0,
        wastage: Number(f.wastage) || 0,
        recovery: Number(f.recovery) || 0,
        remarks: f.remarks,
      });
      router.back();
    } finally { setSaving(false); }
  };
  return (
    <FormShell title="Add Gold Entry" onSubmit={submit} submitting={saving} testID="gold-new-screen">
      <Picker label="KARAT" value={f.karat} options={KARATS}
        onChange={(v: string) => setF({ ...f, karat: v })} testID="gold-karat" />
      <Field label="CUSTOM PURITY % (optional, overrides karat)" value={f.purity} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, purity: v })} testID="gold-purity" />
      <Field label="GROSS WEIGHT (g)" value={f.gross_weight} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, gross_weight: v })} testID="gold-gross" />
      <Field label="STONE WEIGHT (g)" value={f.stone_weight} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, stone_weight: v })} testID="gold-stone" />
      <Field label="RECEIVED (g)" value={f.received} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, received: v })} testID="gold-received" />
      <Field label="ISSUED (g)" value={f.issued} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, issued: v })} testID="gold-issued" />
      <Field label="RETURNED (g)" value={f.returned} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, returned: v })} testID="gold-returned" />
      <Field label="WASTAGE (g)" value={f.wastage} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, wastage: v })} testID="gold-wastage" />
      <Field label="RECOVERY (g)" value={f.recovery} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, recovery: v })} testID="gold-recovery" />
      <Field label="REMARKS" value={f.remarks} multiline
        onChangeText={(v: string) => setF({ ...f, remarks: v })} testID="gold-remarks" />
    </FormShell>
  );
}
