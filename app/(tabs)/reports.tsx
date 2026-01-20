import { StyleSheet, ScrollView, View, RefreshControl, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const primaryColor = useThemeColor({}, 'primary');
  const accentColor = useThemeColor({}, 'accent');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // Mock data - will be replaced with API calls
  const balanceData = {
    currentBalance: 15250.00,
    availableCredit: 8750.00,
    pendingTransactions: 125.50,
    monthlySpent: 2450.00,
    monthlyLimit: 5000.00,
  };

  const transactions = [
    { id: 1, type: 'debit', description: 'Shell Station', amount: -45.00, date: 'Today, 10:30 AM', category: 'fuel' },
    { id: 2, type: 'credit', description: 'Account Credit', amount: 500.00, date: 'Yesterday', category: 'deposit' },
    { id: 3, type: 'debit', description: 'BP Gas', amount: -62.50, date: 'Jan 12', category: 'fuel' },
    { id: 4, type: 'debit', description: 'Walmart', amount: -156.78, date: 'Jan 11', category: 'shopping' },
    { id: 5, type: 'credit', description: 'Paycheck Deposit', amount: 2500.00, date: 'Jan 10', category: 'deposit' },
    { id: 6, type: 'debit', description: 'Amazon', amount: -89.99, date: 'Jan 8', category: 'shopping' },
  ];

  const spentPercentage = (balanceData.monthlySpent / balanceData.monthlyLimit) * 100;

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
            <ThemedText style={styles.pageTitle}>Reports</ThemedText>
            <ThemedText style={[styles.pageSubtitle, { color: textSecondary }]}>
              Track your cash and credit reports
            </ThemedText>
          </View>
          <View style={[styles.iconButton, { backgroundColor: surfaceColor }]}>
            <IconSymbol name="chart.bar.fill" size={22} color={primaryColor} />
          </View>
        </View>

        {/* Report Summary Card */}
        <Card variant="elevated" style={[styles.balanceCard, { backgroundColor: primaryColor }]}>
          <View style={styles.balanceHeader}>
            <ThemedText style={styles.balanceLabel}>Current Balance</ThemedText>
            <Pressable onPress={() => setShowBalance(!showBalance)}>
              <IconSymbol
                name={showBalance ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                size={24}
                color="rgba(255,255,255,0.8)"
              />
            </Pressable>
          </View>
          <ThemedText style={styles.balanceAmount}>
            {showBalance ? `$${balanceData.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
          </ThemedText>
          <View style={styles.balanceDetails}>
            <View style={styles.balanceDetailItem}>
              <ThemedText style={styles.balanceDetailLabel}>Available Credit</ThemedText>
              <ThemedText style={styles.balanceDetailValue}>
                ${balanceData.availableCredit.toLocaleString()}
              </ThemedText>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceDetailItem}>
              <ThemedText style={styles.balanceDetailLabel}>Pending</ThemedText>
              <ThemedText style={styles.balanceDetailValue}>
                ${balanceData.pendingTransactions.toFixed(2)}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={[styles.quickAction, { backgroundColor: surfaceColor }]}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${successColor}15` }]}>
              <IconSymbol name="plus.circle.fill" size={24} color={successColor} />
            </View>
            <ThemedText style={styles.quickActionText}>Add Funds</ThemedText>
          </Pressable>
          <Pressable style={[styles.quickAction, { backgroundColor: surfaceColor }]}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${primaryColor}15` }]}>
              <IconSymbol name="arrow.right" size={24} color={primaryColor} />
            </View>
            <ThemedText style={styles.quickActionText}>Transfer</ThemedText>
          </Pressable>
          <Pressable style={[styles.quickAction, { backgroundColor: surfaceColor }]}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${accentColor}15` }]}>
              <IconSymbol name="doc.text.fill" size={24} color={accentColor} />
            </View>
            <ThemedText style={styles.quickActionText}>Statement</ThemedText>
          </Pressable>
        </View>

        {/* Monthly Spending Progress */}
        <Card variant="elevated" style={styles.spendingCard}>
          <View style={styles.spendingHeader}>
            <View>
              <ThemedText style={[styles.spendingLabel, { color: textSecondary }]}>
                Monthly Spending
              </ThemedText>
              <ThemedText style={styles.spendingAmount}>
                ${balanceData.monthlySpent.toLocaleString()} 
                <ThemedText style={[styles.spendingLimit, { color: textSecondary }]}>
                  {' '}/ ${balanceData.monthlyLimit.toLocaleString()}
                </ThemedText>
              </ThemedText>
            </View>
            <View style={[styles.percentBadge, { backgroundColor: spentPercentage > 80 ? `${dangerColor}15` : `${successColor}15` }]}>
              <ThemedText style={[styles.percentText, { color: spentPercentage > 80 ? dangerColor : successColor }]}>
                {spentPercentage.toFixed(0)}%
              </ThemedText>
            </View>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(spentPercentage, 100)}%`,
                  backgroundColor: spentPercentage > 80 ? dangerColor : primaryColor,
                },
              ]}
            />
          </View>
          <ThemedText style={[styles.spendingNote, { color: textSecondary }]}>
            ${(balanceData.monthlyLimit - balanceData.monthlySpent).toLocaleString()} remaining this month
          </ThemedText>
        </Card>

        {/* Transactions */}
        <View style={styles.transactionsHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Transactions</ThemedText>
          <ThemedText style={[styles.viewAll, { color: primaryColor }]}>See All</ThemedText>
        </View>
        <Card variant="elevated">
          {transactions.map((transaction, index) => (
            <View
              key={transaction.id}
              style={[
                styles.transactionItem,
                index !== transactions.length - 1 && {
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
                        transaction.type === 'credit' ? `${successColor}15` : `${accentColor}15`,
                    },
                  ]}
                >
                  <IconSymbol
                    name={transaction.type === 'credit' ? 'plus.circle.fill' : 'minus.circle.fill'}
                    size={20}
                    color={transaction.type === 'credit' ? successColor : accentColor}
                  />
                </View>
                <View>
                  <ThemedText style={styles.transactionDesc}>{transaction.description}</ThemedText>
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
                {transaction.amount > 0 ? '+' : ''}
                ${Math.abs(transaction.amount).toFixed(2)}
              </ThemedText>
            </View>
          ))}
        </Card>

        {/* Bottom Spacing */}
        <View style={{ height: Spacing.lg }} />
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    marginBottom: Spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: Spacing.lg,
  },
  balanceDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  balanceDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: Spacing.md,
  },
  balanceDetailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  balanceDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  spendingCard: {
    marginBottom: Spacing.lg,
  },
  spendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  spendingLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  spendingAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  spendingLimit: {
    fontSize: 16,
    fontWeight: '400',
  },
  percentBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  spendingNote: {
    fontSize: 13,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionDesc: {
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
