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

export default function CreditCheckScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const primaryColor = useThemeColor({}, 'primary');
  const accentColor = useThemeColor({}, 'accent');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const dangerColor = useThemeColor({}, 'danger');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleCreditCheck = () => {
    setIsChecking(true);
    setTimeout(() => setIsChecking(false), 2000);
  };

  // Mock data - will be replaced with API calls
  const creditData = {
    score: 742,
    maxScore: 850,
    rating: 'Good',
    lastUpdated: 'Jan 14, 2026',
    change: +12,
    factors: [
      { name: 'Payment History', score: 95, status: 'Excellent' },
      { name: 'Credit Utilization', score: 72, status: 'Good' },
      { name: 'Credit Age', score: 65, status: 'Fair' },
      { name: 'Credit Mix', score: 80, status: 'Good' },
      { name: 'New Credit', score: 88, status: 'Good' },
    ],
    history: [
      { month: 'Jan', score: 742 },
      { month: 'Dec', score: 730 },
      { month: 'Nov', score: 725 },
      { month: 'Oct', score: 718 },
      { month: 'Sep', score: 710 },
      { month: 'Aug', score: 705 },
    ],
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return successColor;
    if (score >= 650) return primaryColor;
    if (score >= 550) return warningColor;
    return dangerColor;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return successColor;
      case 'Good':
        return primaryColor;
      case 'Fair':
        return warningColor;
      default:
        return dangerColor;
    }
  };

  const scorePercentage = (creditData.score / creditData.maxScore) * 100;

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
            <ThemedText style={styles.pageTitle}>Credit Check</ThemedText>
            <ThemedText style={[styles.pageSubtitle, { color: textSecondary }]}>
              Monitor your credit health
            </ThemedText>
          </View>
          <View style={[styles.iconButton, { backgroundColor: surfaceColor }]}>
            <IconSymbol name="info.circle.fill" size={22} color={primaryColor} />
          </View>
        </View>

        {/* Credit Score Card */}
        <Card variant="elevated" style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View style={[styles.shieldIcon, { backgroundColor: `${successColor}15` }]}>
              <IconSymbol name="checkmark.shield.fill" size={32} color={successColor} />
            </View>
            <View style={styles.scoreInfo}>
              <ThemedText style={[styles.scoreLabel, { color: textSecondary }]}>
                Your Credit Score
              </ThemedText>
              <ThemedText style={[styles.lastUpdated, { color: textSecondary }]}>
                Last updated: {creditData.lastUpdated}
              </ThemedText>
            </View>
          </View>

          {/* Score Display */}
          <View style={styles.scoreDisplay}>
            <View style={styles.scoreCircleContainer}>
              <View style={[styles.scoreCircleBg, { borderColor: colors.border }]}>
                <View
                  style={[
                    styles.scoreCircleProgress,
                    {
                      borderColor: getScoreColor(creditData.score),
                      transform: [{ rotate: '-90deg' }],
                    },
                  ]}
                />
                <View style={styles.scoreTextContainer}>
                  <ThemedText style={[styles.scoreValue, { color: getScoreColor(creditData.score) }]}>
                    {creditData.score}
                  </ThemedText>
                  <ThemedText style={[styles.scoreMax, { color: textSecondary }]}>
                    / {creditData.maxScore}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.scoreDetails}>
              <View style={[styles.ratingBadge, { backgroundColor: `${getScoreColor(creditData.score)}15` }]}>
                <ThemedText style={[styles.ratingText, { color: getScoreColor(creditData.score) }]}>
                  {creditData.rating}
                </ThemedText>
              </View>
              <View style={styles.changeContainer}>
                <IconSymbol
                  name={creditData.change >= 0 ? 'arrow.up.right' : 'arrow.down.right'}
                  size={16}
                  color={creditData.change >= 0 ? successColor : dangerColor}
                />
                <ThemedText
                  style={[
                    styles.changeText,
                    { color: creditData.change >= 0 ? successColor : dangerColor },
                  ]}
                >
                  {creditData.change >= 0 ? '+' : ''}{creditData.change} pts this month
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>

        {/* Refresh Credit Score Button */}
        <Button
          title={isChecking ? 'Checking...' : 'Check Credit Score'}
          variant="primary"
          size="lg"
          loading={isChecking}
          icon={!isChecking ? <IconSymbol name="checkmark.shield.fill" size={20} color="#fff" /> : undefined}
          onPress={handleCreditCheck}
          style={styles.checkButton}
        />

        {/* Score Factors */}
        <ThemedText style={styles.sectionTitle}>Score Factors</ThemedText>
        <Card variant="elevated" style={styles.factorsCard}>
          {creditData.factors.map((factor, index) => (
            <View
              key={factor.name}
              style={[
                styles.factorItem,
                index !== creditData.factors.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.factorInfo}>
                <ThemedText style={styles.factorName}>{factor.name}</ThemedText>
                <View style={[styles.factorStatusBadge, { backgroundColor: `${getStatusColor(factor.status)}15` }]}>
                  <ThemedText style={[styles.factorStatus, { color: getStatusColor(factor.status) }]}>
                    {factor.status}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.factorScoreContainer}>
                <View style={[styles.factorProgressBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.factorProgressFill,
                      {
                        width: `${factor.score}%`,
                        backgroundColor: getStatusColor(factor.status),
                      },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.factorScore, { color: textSecondary }]}>
                  {factor.score}%
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        {/* Score History */}
        <ThemedText style={styles.sectionTitle}>Score History</ThemedText>
        <Card variant="elevated" style={styles.historyCard}>
          <View style={styles.historyChart}>
            {creditData.history.map((item, index) => {
              const heightPercent = ((item.score - 600) / 250) * 100;
              return (
                <View key={item.month} style={styles.historyBarContainer}>
                  <View style={styles.historyBarWrapper}>
                    <View
                      style={[
                        styles.historyBar,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: index === 0 ? primaryColor : `${primaryColor}40`,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.historyMonth, { color: textSecondary }]}>
                    {item.month}
                  </ThemedText>
                  <ThemedText style={[styles.historyScore, { color: index === 0 ? primaryColor : textSecondary }]}>
                    {item.score}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Tips Card */}
        <Card variant="outlined" style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <IconSymbol name="info.circle.fill" size={24} color={primaryColor} />
            <ThemedText style={styles.tipsTitle}>Tips to Improve Your Score</ThemedText>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: successColor }]} />
              <ThemedText style={[styles.tipText, { color: textSecondary }]}>
                Keep credit utilization below 30%
              </ThemedText>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: successColor }]} />
              <ThemedText style={[styles.tipText, { color: textSecondary }]}>
                Pay all bills on time, every time
              </ThemedText>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: successColor }]} />
              <ThemedText style={[styles.tipText, { color: textSecondary }]}>
                Avoid opening too many new accounts
              </ThemedText>
            </View>
          </View>
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
  scoreCard: {
    marginBottom: Spacing.lg,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  shieldIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 13,
    marginTop: 2,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircleContainer: {
    marginRight: Spacing.lg,
  },
  scoreCircleBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scoreCircleProgress: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  scoreTextContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 14,
  },
  scoreDetails: {
    flex: 1,
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkButton: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  factorsCard: {
    marginBottom: Spacing.lg,
  },
  factorItem: {
    paddingVertical: Spacing.md,
  },
  factorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  factorName: {
    fontSize: 15,
    fontWeight: '500',
  },
  factorStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  factorStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  factorScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  factorProgressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorScore: {
    fontSize: 13,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  historyCard: {
    marginBottom: Spacing.lg,
  },
  historyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  historyBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  historyBarWrapper: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
  },
  historyBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 20,
  },
  historyMonth: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  historyScore: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tipsCard: {
    marginBottom: Spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
});
