import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormShell, Field } from '@/src/form';
import { api } from '@/src/api';

export default function DiamondNew() {
  const router = useRouter();
  const { client_id } = useLocalSearchParams<{ client_id: string }>();
  const [f, setF] = useState<any>({ diamond_type: 'Round', carat: '0.25', pieces: '1', weight: '0.05', received: '0.05', issued: '0', returned: '0', cost: '0', remarks: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!client_id) return; setSaving(true);
    try {
      await api.addDiamond({
        client_id,
        diamond_type: f.diamond_type,
        carat: Number(f.carat) || 0,
        pieces: Number(f.pieces) || 0,
        weight: Number(f.weight) || 0,
        received: Number(f.received) || 0,
        issued: Number(f.issued) || 0,
        returned: Number(f.returned) || 0,
        cost: Number(f.cost) || 0,
        remarks: f.remarks,
      });
      router.back();
    } finally { setSaving(false); }
  };
  return (
    <FormShell title="Add Diamond Entry" onSubmit={submit} submitting={saving} testID="diamond-new-screen">
      <Field label="TYPE" value={f.diamond_type}
        onChangeText={(v: string) => setF({ ...f, diamond_type: v })} testID="diamond-type" />
      <Field label="CARAT (per piece)" value={f.carat} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, carat: v })} testID="diamond-carat" />
      <Field label="PIECES" value={f.pieces} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, pieces: v })} testID="diamond-pieces" />
      <Field label="TOTAL WEIGHT (ct)" value={f.weight} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, weight: v })} testID="diamond-weight" />
      <Field label="RECEIVED (ct)" value={f.received} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, received: v })} testID="diamond-received" />
      <Field label="ISSUED (ct)" value={f.issued} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, issued: v })} testID="diamond-issued" />
      <Field label="RETURNED (ct)" value={f.returned} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, returned: v })} testID="diamond-returned" />
      <Field label="COST (₹)" value={f.cost} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, cost: v })} testID="diamond-cost" />
      <Field label="REMARKS" value={f.remarks} multiline
        onChangeText={(v: string) => setF({ ...f, remarks: v })} testID="diamond-remarks" />
    </FormShell>
  );
}
