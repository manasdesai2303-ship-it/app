import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormShell, Field, Picker } from '@/src/form';
import { api } from '@/src/api';

export default function CashNew() {
  const router = useRouter();
  const { client_id } = useLocalSearchParams<{ client_id: string }>();
  const [f, setF] = useState<any>({ type: 'payment', amount: '0', method: 'Cash', remarks: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!client_id) return; setSaving(true);
    try {
      await api.addCash({
        client_id,
        type: f.type,
        amount: Number(f.amount) || 0,
        method: f.method,
        remarks: f.remarks,
      });
      router.back();
    } finally { setSaving(false); }
  };
  return (
    <FormShell title="Add Cash Entry" onSubmit={submit} submitting={saving} testID="cash-new-screen">
      <Picker label="TYPE" value={f.type}
        options={[{ value: 'advance', label: 'Advance' }, { value: 'payment', label: 'Payment' }, { value: 'refund', label: 'Refund' }]}
        onChange={(v: string) => setF({ ...f, type: v })} testID="cash-type" />
      <Field label="AMOUNT (₹)" value={f.amount} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, amount: v })} testID="cash-amount" />
      <Picker label="METHOD" value={f.method}
        options={['Cash', 'Bank', 'UPI', 'Cheque']}
        onChange={(v: string) => setF({ ...f, method: v })} testID="cash-method" />
      <Field label="REMARKS" value={f.remarks} multiline
        onChangeText={(v: string) => setF({ ...f, remarks: v })} testID="cash-remarks" />
    </FormShell>
  );
}
