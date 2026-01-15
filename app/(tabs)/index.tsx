import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
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
    creditScore: 742,
    balance: 15250.00,
    fuelSaved: 1250.50,
    lastTransaction: 'Shell Station - $45.00',
  };

  const recentTransactions = [
    { id: 1, merchant: 'Shell Station', amount: -45.00, date: 'Today', type: 'fuel' },
    { id: 2, merchant: 'Account Credit', amount: 500.00, date: 'Yesterday', type: 'credit' },
    { id: 3, merchant: 'BP Gas', amount: -62.50, date: 'Jan 12', type: 'fuel' },
  ];

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
            title="Credit Score"
            value={userData.creditScore.toString()}
            icon="checkmark.shield.fill"
            iconColor={successColor}
            trend={{ value: 2.5, isPositive: true }}
          />
          <StatCard
            title="Balance"
            value={`$${userData.balance.toLocaleString()}`}
            icon="wallet.pass.fill"
            iconColor={primaryColor}
          />
        </View>

        {/* Fuel Savings Card */}
        <Card variant="elevated" style={styles.fuelCard}>
          <View style={[styles.fuelCardGradient, { backgroundColor: `${primaryColor}10` }]}>
            <View style={styles.fuelCardContent}>
              <View style={[styles.fuelIconContainer, { backgroundColor: `${accentColor}20` }]}>
                <IconSymbol name="fuelpump.fill" size={32} color={accentColor} />
              </View>
              <View style={styles.fuelCardText}>
                <ThemedText style={[styles.fuelLabel, { color: textSecondary }]}>
                  Total Fuel Savings
                </ThemedText>
                <ThemedText style={[styles.fuelValue, { color: primaryColor }]}>
                  ${userData.fuelSaved.toLocaleString()}
                </ThemedText>
              </View>
            </View>
            <Link href="/(tabs)/fuel" asChild>
              <Button title="View Details" variant="outline" size="sm" />
            </Link>
          </View>
        </Card>

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

        {/* Recent Transactions */}
        <View style={styles.transactionsHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          <ThemedText style={[styles.viewAll, { color: primaryColor }]}>View All</ThemedText>
        </View>
        <Card variant="elevated">
          {recentTransactions.map((transaction, index) => (
            <View
              key={transaction.id}
              style={[
                styles.transactionItem,
                index !== recentTransactions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        transaction.type === 'fuel' ? `${accentColor}15` : `${successColor}15`,
                    },
                  ]}
                >
                  <IconSymbol
                    name={transaction.type === 'fuel' ? 'fuelpump.fill' : 'plus.circle.fill'}
                    size={20}
                    color={transaction.type === 'fuel' ? accentColor : successColor}
                  />
                </View>
                <View>
                  <ThemedText style={styles.transactionMerchant}>
                    {transaction.merchant}
                  </ThemedText>
                  <ThemedText style={[styles.transactionDate, { color: textSecondary }]}>
                    {transaction.date}
                  </ThemedText>
                </View>
              </View>
              <ThemedText
                style={[
                  styles.transactionAmount,
                  { color: transaction.amount > 0 ? successColor : colors.text },
                ]}
              >
                {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </ThemedText>
            </View>
          ))}
        </Card>
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
  fuelCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  fuelCardGradient: {
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fuelCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fuelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelCardText: {
    gap: Spacing.xs,
  },
  fuelLabel: {
    fontSize: 14,
  },
  fuelValue: {
    fontSize: 24,
    fontWeight: '700',
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
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionMerchant: {
    fontSize: 15,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 13,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
