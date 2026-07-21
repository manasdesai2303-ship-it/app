import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();
  useFocusEffect(useCallback(() => {
    (async () => { try { setItems(await api.inventory()); } catch {} })();
  }, []));

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="inventory-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <Text style={s.title}>Inventory</Text>
        <View style={{ width: 26 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        renderItem={({ item }) => (
          <View style={[s.row, item.low_stock && { borderColor: theme.dark.warning }]} testID={`inv-${item.id}`}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.sub}>{item.category}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.qty, item.low_stock && { color: theme.dark.warning }]}>{item.stock} {item.unit}</Text>
              {item.low_stock && <Text style={s.lowTxt}>LOW STOCK</Text>}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No stock items</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  title: { color: theme.dark.onSurface, fontSize: 18, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: 8, borderWidth: 1, borderColor: theme.dark.border },
  name: { color: theme.dark.onSurface, fontSize: 14, fontWeight: '600' },
  sub: { color: theme.dark.onSurfaceSecondary, fontSize: 11, marginTop: 2 },
  qty: { color: theme.dark.brand, fontSize: 15, fontWeight: '700', fontFamily: theme.font.display },
  lowTxt: { color: theme.dark.warning, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 1 },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 40 },
});
