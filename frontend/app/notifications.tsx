import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

const COLOR: Record<string, string> = {
  error: theme.dark.error, warning: theme.dark.warning, info: theme.dark.info,
};

export default function Notifications() {
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();
  useFocusEffect(useCallback(() => {
    (async () => { try { setItems(await api.notifications()); } catch {} })();
  }, []));

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="notifications-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={theme.dark.onSurface} /></Pressable>
        <Text style={s.title}>Notifications</Text>
        <View style={{ width: 26 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        renderItem={({ item }) => (
          <View style={s.row} testID={`notif-${item.id}`}>
            <View style={[s.dot, { backgroundColor: COLOR[item.severity] || theme.dark.info }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{item.title}</Text>
              <Text style={s.rowSub}>{item.message}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>All clear · no alerts</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.dark.border },
  title: { color: theme.dark.onSurface, fontSize: 18, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, marginBottom: 8, borderWidth: 1, borderColor: theme.dark.border, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  rowTitle: { color: theme.dark.onSurface, fontSize: 14, fontWeight: '600' },
  rowSub: { color: theme.dark.onSurfaceSecondary, fontSize: 12, marginTop: 4 },
  empty: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', padding: 40 },
});
