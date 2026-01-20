import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const primaryColor = useThemeColor({}, 'primary');
  const accentColor = useThemeColor({}, 'accent');
  const successColor = useThemeColor({}, 'success');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // Mock data - will be replaced with API calls
  const userData = {
    name: 'John',
    cashReserve: 12600.0,
    balance: 15250.0,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={[styles.greeting, { color: textSecondary }]}>
              Good morning,
            </ThemedText>
            <ThemedText style={styles.userName}>{userData.name} 👋</ThemedText>
          </View>
          <View style={[styles.notificationBadge, { backgroundColor: colors.surface }]}>
            <IconSymbol name="bell.fill" size={24} color={primaryColor} />
            <View style={[styles.badgeDot, { backgroundColor: accentColor }]} />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard
            title="Cash Reserve"
            value={`$${userData.cashReserve.toLocaleString()}`}
            icon="dollarsign.circle.fill"
            iconColor={successColor}
            trend={{ value: 4.2, isPositive: true }}
          />
          <StatCard
            title="Total A/R"
            value={`$${userData.balance.toLocaleString()}`}
            icon="wallet.pass.fill"
            iconColor={primaryColor}
          />
        </View>

        {/* Quick Actions */}
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsGrid}>
          <Link href="/(tabs)/credit-check" asChild>
            <Card style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: `${successColor}15` }]}>
                <IconSymbol name="checkmark.shield.fill" size={24} color={successColor} />
              </View>
              <ThemedText style={styles.actionText}>Credit Check</ThemedText>
            </Card>
          </Link>
          <Link href="/(tabs)/fuel" asChild>
            <Card style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: `${accentColor}15` }]}>
                <IconSymbol name="fuelpump.fill" size={24} color={accentColor} />
              </View>
              <ThemedText style={styles.actionText}>Fuel</ThemedText>
            </Card>
          </Link>
          <Link href="/(tabs)/balance" asChild>
            <Card style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: `${primaryColor}15` }]}>
                <IconSymbol name="wallet.pass.fill" size={24} color={primaryColor} />
              </View>
              <ThemedText style={styles.actionText}>Balance</ThemedText>
            </Card>
          </Link>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.icon}15` }]}>
              <IconSymbol name="gear" size={24} color={colors.icon} />
            </View>
            <ThemedText style={styles.actionText}>Settings</ThemedText>
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  notificationBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
