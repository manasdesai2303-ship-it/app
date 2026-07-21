import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { FormShell, Field, Picker } from '@/src/form';
import { api } from '@/src/api';
import { JEWELLERY_TYPES, KARATS, theme } from '@/src/theme';

export default function OrderNew() {
  const router = useRouter();
  const [f, setF] = useState<any>({
    client_id: '', jewellery_type: 'Ring', karat: '22K',
    custom_purity: '', // optional purity %
    expected_weight: '10',
    stone_setting_charges: '0', other_charges: '0', labour_rate: '400',
    description: '', remarks: '', karigar_id: '', design_image: '',
  });
  const [clients, setClients] = useState<any[]>([]);
  const [karigars, setKarigars] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, k] = await Promise.all([api.clients(), api.karigars()]);
      setClients(c); setKarigars(k);
      if (c[0]) setF((x: any) => ({ ...x, client_id: c[0].id }));
      if (k[0]) setF((x: any) => ({ ...x, karigar_id: k[0].id }));
    })();
  }, []);

  const pickPhoto = async (from: 'camera' | 'library') => {
    const perm = from === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        Alert.alert('Permission needed',
          `Enable ${from === 'camera' ? 'camera' : 'photo library'} access in Settings.`,
          [{ text: 'Cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]);
      }
      return;
    }
    const res = from === 'camera'
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5, allowsEditing: true });
    if (!res.canceled && res.assets[0]?.base64) {
      setF((x: any) => ({ ...x, design_image: `data:image/jpeg;base64,${res.assets[0].base64}` }));
    }
  };

  const submit = async () => {
    if (!f.client_id) return;
    setSaving(true);
    try {
      await api.createOrder({
        ...f,
        expected_weight: Number(f.expected_weight) || 0,
        stone_setting_charges: Number(f.stone_setting_charges) || 0,
        other_charges: Number(f.other_charges) || 0,
        labour_rate: Number(f.labour_rate) || 0,
        custom_purity: f.custom_purity ? Number(f.custom_purity) : null,
      });
      router.back();
    } finally { setSaving(false); }
  };

  return (
    <FormShell title="New Order" onSubmit={submit} submitting={saving} testID="order-new-screen">
      <Picker label="CLIENT *" value={f.client_id}
        options={clients.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(v: string) => setF({ ...f, client_id: v })} testID="order-client" />

      {/* Design Photo */}
      <Text style={s.label}>DESIGN PHOTO</Text>
      {f.design_image ? (
        <View style={s.photoWrap} testID="order-photo-preview">
          <Image source={f.design_image} style={s.photo} contentFit="cover" />
          <Pressable style={s.photoRemove} onPress={() => setF({ ...f, design_image: '' })} testID="order-photo-remove">
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={s.photoActions}>
          <Pressable style={s.photoBtn} onPress={() => pickPhoto('camera')} testID="order-photo-camera">
            <Ionicons name="camera-outline" size={20} color={theme.dark.brand} />
            <Text style={s.photoBtnTxt}>Camera</Text>
          </Pressable>
          <Pressable style={s.photoBtn} onPress={() => pickPhoto('library')} testID="order-photo-library">
            <Ionicons name="images-outline" size={20} color={theme.dark.brand} />
            <Text style={s.photoBtnTxt}>Gallery</Text>
          </Pressable>
        </View>
      )}

      <Picker label="TYPE" value={f.jewellery_type} options={JEWELLERY_TYPES}
        onChange={(v: string) => setF({ ...f, jewellery_type: v })} testID="order-type" />
      <Picker label="KARAT" value={f.karat} options={KARATS}
        onChange={(v: string) => setF({ ...f, karat: v })} testID="order-karat" />

      {/* Custom purity override */}
      <Field label="CUSTOM PURITY % (optional — overrides karat)"
        value={f.custom_purity}
        keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, custom_purity: v })}
        testID="order-custom-purity" />

      <Field label="EXPECTED WEIGHT (g)" value={f.expected_weight} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, expected_weight: v })} testID="order-weight" />
      <Field label="LABOUR RATE (₹/g)" value={f.labour_rate} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, labour_rate: v })} testID="order-labour" />
      <Field label="STONE SETTING (₹)" value={f.stone_setting_charges} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, stone_setting_charges: v })} testID="order-stone" />
      <Field label="OTHER CHARGES (₹)" value={f.other_charges} keyboardType="decimal-pad"
        onChangeText={(v: string) => setF({ ...f, other_charges: v })} testID="order-other" />
      <Picker label="KARIGAR" value={f.karigar_id}
        options={karigars.map((k) => ({ value: k.id, label: k.name }))}
        onChange={(v: string) => setF({ ...f, karigar_id: v })} testID="order-karigar" />
      <Field label="DESCRIPTION" value={f.description} multiline
        onChangeText={(v: string) => setF({ ...f, description: v })} testID="order-desc" />
      <Field label="REMARKS" value={f.remarks} multiline
        onChangeText={(v: string) => setF({ ...f, remarks: v })} testID="order-remarks" />
    </FormShell>
  );
}

const s = StyleSheet.create({
  label: { color: theme.dark.onSurfaceTertiary, fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 22, borderRadius: theme.radius.md,
    borderWidth: 1, borderStyle: 'dashed', borderColor: theme.dark.brand,
    backgroundColor: theme.dark.brandTertiary,
  },
  photoBtnTxt: { color: theme.dark.brand, fontWeight: '600' },
  photoWrap: { position: 'relative', marginBottom: 14, borderRadius: theme.radius.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.dark.border },
  photo: { width: '100%', height: 200, backgroundColor: theme.dark.surfaceSecondary },
  photoRemove: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },
});
