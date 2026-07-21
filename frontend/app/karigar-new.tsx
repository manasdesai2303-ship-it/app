import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { FormShell, Field } from '@/src/form';
import { api } from '@/src/api';

export default function KarigarNew() {
  const router = useRouter();
  const [f, setF] = useState<any>({ name: '', phone: '', address: '', speciality: '', labour_rate: '400' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!f.name) return; setSaving(true);
    try { await api.createKarigar({ ...f, labour_rate: Number(f.labour_rate) || 0 }); router.back(); }
    finally { setSaving(false); }
  };
  return (
    <FormShell title="New Karigar" onSubmit={submit} submitting={saving} testID="karigar-new-screen">
      <Field label="NAME *" value={f.name} onChangeText={(v: string) => setF({ ...f, name: v })} testID="karigar-name" />
      <Field label="PHONE" value={f.phone} onChangeText={(v: string) => setF({ ...f, phone: v })} keyboardType="phone-pad" testID="karigar-phone" />
      <Field label="ADDRESS" value={f.address} onChangeText={(v: string) => setF({ ...f, address: v })} multiline testID="karigar-address" />
      <Field label="SPECIALITY" value={f.speciality} onChangeText={(v: string) => setF({ ...f, speciality: v })} testID="karigar-speciality" />
      <Field label="LABOUR RATE (₹/g)" value={f.labour_rate} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, labour_rate: v })} testID="karigar-rate" />
    </FormShell>
  );
}
