import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { FormShell, Field, Picker } from '@/src/form';
import { api } from '@/src/api';
import { CLIENT_TYPES } from '@/src/theme';

export default function ClientNew() {
  const router = useRouter();
  const [f, setF] = useState<any>({ name: '', type: 'Wholesaler', company: '', phone: '', email: '', address: '', gst: '', pan: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!f.name) return;
    setSaving(true);
    try { await api.createClient(f); router.back(); } finally { setSaving(false); }
  };
  return (
    <FormShell title="New Client" onSubmit={submit} submitting={saving} testID="client-new-screen">
      <Field label="NAME *" value={f.name} onChangeText={(v: string) => setF({ ...f, name: v })} testID="client-name" />
      <Picker label="TYPE" value={f.type} options={CLIENT_TYPES} onChange={(v: string) => setF({ ...f, type: v })} testID="client-type" />
      <Field label="COMPANY" value={f.company} onChangeText={(v: string) => setF({ ...f, company: v })} testID="client-company" />
      <Field label="PHONE" value={f.phone} onChangeText={(v: string) => setF({ ...f, phone: v })} keyboardType="phone-pad" testID="client-phone" />
      <Field label="EMAIL" value={f.email} onChangeText={(v: string) => setF({ ...f, email: v })} keyboardType="email-address" testID="client-email" />
      <Field label="ADDRESS" value={f.address} onChangeText={(v: string) => setF({ ...f, address: v })} multiline testID="client-address" />
      <Field label="GST" value={f.gst} onChangeText={(v: string) => setF({ ...f, gst: v })} testID="client-gst" />
      <Field label="PAN" value={f.pan} onChangeText={(v: string) => setF({ ...f, pan: v })} testID="client-pan" />
      <Field label="NOTES" value={f.notes} onChangeText={(v: string) => setF({ ...f, notes: v })} multiline testID="client-notes" />
    </FormShell>
  );
}
