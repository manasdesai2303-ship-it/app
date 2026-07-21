import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormShell, Field } from '@/src/form';
import { api } from '@/src/api';

export default function GemstoneNew() {
  const router = useRouter();
  const { client_id } = useLocalSearchParams<{ client_id: string }>();
  const [f, setF] = useState<any>({ stone_type: 'Emerald', pieces: '1', weight: '1', received: '1', issued: '0', returned: '0', cost: '0', remarks: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!client_id) return; setSaving(true);
    try {
      await api.addGemstone({
        client_id,
        stone_type: f.stone_type,
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
    <FormShell title="Add Gemstone Entry" onSubmit={submit} submitting={saving} testID="gemstone-new-screen">
      <Field label="TYPE" value={f.stone_type}
        onChangeText={(v: string) => setF({ ...f, stone_type: v })} testID="gemstone-type" />
      <Field label="PIECES" value={f.pieces} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, pieces: v })} testID="gemstone-pieces" />
      <Field label="WEIGHT (g)" value={f.weight} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, weight: v })} testID="gemstone-weight" />
      <Field label="RECEIVED" value={f.received} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, received: v })} testID="gemstone-received" />
      <Field label="ISSUED" value={f.issued} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, issued: v })} testID="gemstone-issued" />
      <Field label="RETURNED" value={f.returned} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, returned: v })} testID="gemstone-returned" />
      <Field label="COST (₹)" value={f.cost} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, cost: v })} testID="gemstone-cost" />
      <Field label="REMARKS" value={f.remarks} multiline
        onChangeText={(v: string) => setF({ ...f, remarks: v })} testID="gemstone-remarks" />
    </FormShell>
  );
}
