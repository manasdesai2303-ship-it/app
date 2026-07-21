import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormShell, Field } from '@/src/form';
import { api } from '@/src/api';

export default function SilverNew() {
  const router = useRouter();
  const { client_id } = useLocalSearchParams<{ client_id: string }>();
  const [f, setF] = useState<any>({ purity: '92.5', weight: '10', received: '10', issued: '0', returned: '0', remarks: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!client_id) return; setSaving(true);
    try {
      await api.addSilver({
        client_id,
        purity: Number(f.purity) || 92.5,
        weight: Number(f.weight) || 0,
        received: Number(f.received) || 0,
        issued: Number(f.issued) || 0,
        returned: Number(f.returned) || 0,
        remarks: f.remarks,
      });
      router.back();
    } finally { setSaving(false); }
  };
  return (
    <FormShell title="Add Silver Entry" onSubmit={submit} submitting={saving} testID="silver-new-screen">
      <Field label="PURITY %" value={f.purity} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, purity: v })} testID="silver-purity" />
      <Field label="WEIGHT (g)" value={f.weight} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, weight: v })} testID="silver-weight" />
      <Field label="RECEIVED (g)" value={f.received} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, received: v })} testID="silver-received" />
      <Field label="ISSUED (g)" value={f.issued} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, issued: v })} testID="silver-issued" />
      <Field label="RETURNED (g)" value={f.returned} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, returned: v })} testID="silver-returned" />
      <Field label="REMARKS" value={f.remarks} multiline
        onChangeText={(v: string) => setF({ ...f, remarks: v })} testID="silver-remarks" />
    </FormShell>
  );
}
