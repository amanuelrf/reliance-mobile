import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing, BorderRadius } from '@/constants/theme';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';

export type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: IconSymbolName;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

export function StatCard({ title, value, subtitle, icon, iconColor, trend }: StatCardProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceColor = useThemeColor({}, 'surface');

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor || primaryColor}15` }]}>
          <IconSymbol name={icon} size={24} color={iconColor || primaryColor} />
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.isPositive ? `${successColor}15` : `${dangerColor}15` },
            ]}
          >
            <IconSymbol
              name={trend.isPositive ? 'arrow.up.right' : 'arrow.down.right'}
              size={12}
              color={trend.isPositive ? successColor : dangerColor}
            />
            <ThemedText
              style={[
                styles.trendText,
                { color: trend.isPositive ? successColor : dangerColor },
              ]}
            >
              {Math.abs(trend.value)}%
            </ThemedText>
          </View>
        )}
      </View>
      <ThemedText style={[styles.title, { color: textSecondary }]}>{title}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
      {subtitle && (
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>{subtitle}</ThemedText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
