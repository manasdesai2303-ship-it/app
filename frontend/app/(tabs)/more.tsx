import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { useAuth } from '@/src/auth';

const ITEMS: { icon: any; label: string; path: string; testID: string }[] = [
  { icon: 'hammer-outline', label: 'Karigars', path: '/karigars', testID: 'more-karigars' },
  { icon: 'cube-outline', label: 'Inventory', path: '/inventory', testID: 'more-inventory' },
  { icon: 'receipt-outline', label: 'Invoices', path: '/invoices', testID: 'more-invoices' },
  { icon: 'notifications-outline', label: 'Notifications', path: '/notifications', testID: 'more-notifications' },
  { icon: 'search-outline', label: 'Global Search', path: '/search', testID: 'more-search' },
  { icon: 'bar-chart-outline', label: 'Reports', path: '/reports', testID: 'more-reports' },
];

export default function More() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="more-screen">
      <ScrollView>
        <View style={s.profile}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{(user?.name || '?')[0]}</Text></View>
          <View>
            <Text style={s.name}>{user?.name}</Text>
            <Text style={s.role}>{user?.role} · {user?.email}</Text>
          </View>
        </View>

        <View style={s.grid}>
          {ITEMS.map((it) => (
            <Pressable key={it.path} onPress={() => router.push(it.path as any)}
              style={s.tile} testID={it.testID}>
              <View style={s.tileIcon}>
                <Ionicons name={it.icon} size={22} color={theme.dark.brand} />
              </View>
              <Text style={s.tileLabel}>{it.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={s.logout} onPress={logout} testID="more-logout">
          <Ionicons name="log-out-outline" size={18} color={theme.dark.error} />
          <Text style={s.logoutTxt}>Sign out</Text>
        </Pressable>

        <Text style={s.footer}>GoldSmith Pro ERP · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.dark.surface },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: theme.spacing.xl, paddingBottom: theme.spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.dark.brandTertiary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.dark.brand },
  avatarTxt: { color: theme.dark.brand, fontSize: 22, fontWeight: '700' },
  name: { color: theme.dark.onSurface, fontSize: 18, fontWeight: '600' },
  role: { color: theme.dark.onSurfaceSecondary, fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.spacing.md, gap: theme.spacing.md },
  tile: { width: '47%', flexGrow: 1, backgroundColor: theme.dark.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.dark.border, alignItems: 'flex-start' },
  tileIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.dark.brandTertiary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  tileLabel: { color: theme.dark.onSurface, fontSize: 14, fontWeight: '600' },
  logout: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: theme.spacing.lg, margin: theme.spacing.lg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.dark.border, backgroundColor: theme.dark.surfaceSecondary, justifyContent: 'center' },
  logoutTxt: { color: theme.dark.error, fontWeight: '600' },
  footer: { color: theme.dark.onSurfaceTertiary, textAlign: 'center', fontSize: 11, marginBottom: 30 },
});
