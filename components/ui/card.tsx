import { StyleSheet, View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

export type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'outlined';
};

export function Card({ style, variant = 'default', children, ...otherProps }: CardProps) {
  const backgroundColor = useThemeColor({}, variant === 'elevated' ? 'surfaceElevated' : 'surface');
  const borderColor = useThemeColor({}, 'border');
  const shadowColor = useThemeColor({}, 'cardShadow');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor },
        variant === 'outlined' && { borderWidth: 1, borderColor },
        variant === 'elevated' && {
          shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
      {...otherProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
});
