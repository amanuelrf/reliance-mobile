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

export default function FuelScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const primaryColor = useThemeColor({}, 'primary');
  const accentColor = useThemeColor({}, 'accent');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // Mock data - will be replaced with API calls
  const fuelData = {
    totalSpent: 524.50,
    totalGallons: 142.5,
    avgPricePerGallon: 3.68,
    savings: 48.25,
    lastFillUp: {
      station: 'Shell - Main St',
      gallons: 12.5,
      price: 45.99,
      date: 'Today, 10:30 AM',
    },
  };

  const fuelHistory = [
    { id: 1, station: 'Shell - Main St', gallons: 12.5, total: 45.99, date: 'Jan 14', pricePerGallon: 3.68 },
    { id: 2, station: 'BP - Oak Ave', gallons: 15.2, total: 56.24, date: 'Jan 10', pricePerGallon: 3.70 },
    { id: 3, station: 'Chevron - 5th St', gallons: 10.8, total: 39.96, date: 'Jan 7', pricePerGallon: 3.70 },
    { id: 4, station: 'Shell - Main St', gallons: 14.0, total: 50.40, date: 'Jan 3', pricePerGallon: 3.60 },
    { id: 5, station: 'Exxon - Highway 101', gallons: 18.2, total: 68.25, date: 'Dec 28', pricePerGallon: 3.75 },
  ];

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ] as const;

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
            <ThemedText style={styles.pageTitle}>Fuel Tracker</ThemedText>
            <ThemedText style={[styles.pageSubtitle, { color: textSecondary }]}>
              Monitor your fuel expenses
            </ThemedText>
          </View>
          <View style={[styles.iconButton, { backgroundColor: surfaceColor }]}>
            <IconSymbol name="line.3.horizontal.decrease" size={22} color={primaryColor} />
          </View>
        </View>

        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: surfaceColor }]}>
          {periods.map((period) => (
            <Pressable
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && { backgroundColor: primaryColor },
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <ThemedText
                style={[
                  styles.periodText,
                  { color: selectedPeriod === period.key ? '#fff' : textSecondary },
                ]}
              >
                {period.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: `${accentColor}15` }]}>
              <IconSymbol name="dollarsign.circle.fill" size={24} color={accentColor} />
            </View>
            <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Total Spent</ThemedText>
            <ThemedText style={styles.summaryValue}>${fuelData.totalSpent.toFixed(2)}</ThemedText>
          </Card>
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: `${primaryColor}15` }]}>
              <IconSymbol name="fuelpump.fill" size={24} color={primaryColor} />
            </View>
            <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Total Gallons</ThemedText>
            <ThemedText style={styles.summaryValue}>{fuelData.totalGallons.toFixed(1)}</ThemedText>
          </Card>
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: `${warningColor}15` }]}>
              <IconSymbol name="chart.bar.fill" size={24} color={warningColor} />
            </View>
            <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Avg Price/Gal</ThemedText>
            <ThemedText style={styles.summaryValue}>${fuelData.avgPricePerGallon.toFixed(2)}</ThemedText>
          </Card>
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: `${successColor}15` }]}>
              <IconSymbol name="percent" size={24} color={successColor} />
            </View>
            <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Savings</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: successColor }]}>
              +${fuelData.savings.toFixed(2)}
            </ThemedText>
          </Card>
        </View>

        {/* Last Fill-Up Card */}
        <Card variant="elevated" style={styles.lastFillCard}>
          <View style={styles.lastFillHeader}>
            <View style={[styles.lastFillIcon, { backgroundColor: `${accentColor}15` }]}>
              <IconSymbol name="fuelpump.fill" size={28} color={accentColor} />
            </View>
            <View style={styles.lastFillInfo}>
              <ThemedText style={[styles.lastFillLabel, { color: textSecondary }]}>
                Last Fill-Up
              </ThemedText>
              <ThemedText style={styles.lastFillStation}>
                {fuelData.lastFillUp.station}
              </ThemedText>
              <ThemedText style={[styles.lastFillDate, { color: textSecondary }]}>
                {fuelData.lastFillUp.date}
              </ThemedText>
            </View>
            <View style={styles.lastFillAmount}>
              <ThemedText style={styles.lastFillPrice}>
                ${fuelData.lastFillUp.price.toFixed(2)}
              </ThemedText>
              <ThemedText style={[styles.lastFillGallons, { color: textSecondary }]}>
                {fuelData.lastFillUp.gallons} gal
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Add Fuel Button */}
        <Button
          title="Request Fuel Card"
          variant="primary"
          size="lg"
          icon={<IconSymbol name="plus.circle.fill" size={20} color="#fff" />}
          style={styles.addButton}
        />

        {/* Fuel History */}
        <View style={styles.historyHeader}>
          <ThemedText style={styles.sectionTitle}>Fuel History</ThemedText>
          <ThemedText style={[styles.viewAll, { color: primaryColor }]}>Export</ThemedText>
        </View>
        <Card variant="elevated">
          {fuelHistory.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.historyItem,
                index !== fuelHistory.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.historyLeft}>
                <View style={[styles.historyIcon, { backgroundColor: `${accentColor}15` }]}>
                  <IconSymbol name="fuelpump.fill" size={18} color={accentColor} />
                </View>
                <View>
                  <ThemedText style={styles.historyStation}>{item.station}</ThemedText>
                  <ThemedText style={[styles.historyDetails, { color: textSecondary }]}>
                    {item.gallons} gal @ ${item.pricePerGallon}/gal
                  </ThemedText>
                </View>
              </View>
              <View style={styles.historyRight}>
                <ThemedText style={styles.historyTotal}>${item.total.toFixed(2)}</ThemedText>
                <ThemedText style={[styles.historyDate, { color: textSecondary }]}>
                  {item.date}
                </ThemedText>
              </View>
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
  periodSelector: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  lastFillCard: {
    marginBottom: Spacing.lg,
  },
  lastFillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastFillIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  lastFillInfo: {
    flex: 1,
  },
  lastFillLabel: {
    fontSize: 12,
  },
  lastFillStation: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 2,
  },
  lastFillDate: {
    fontSize: 12,
  },
  lastFillAmount: {
    alignItems: 'flex-end',
  },
  lastFillPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  lastFillGallons: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    marginBottom: Spacing.lg,
  },
  historyHeader: {
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
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyStation: {
    fontSize: 15,
    fontWeight: '500',
  },
  historyDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
});
