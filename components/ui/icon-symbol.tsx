// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  
  // App specific
  'fuelpump.fill': 'local-gas-station',
  'creditcard.fill': 'credit-card',
  'wallet.pass.fill': 'account-balance-wallet',
  'checkmark.shield.fill': 'verified-user',
  
  // Actions & Status
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'plus.circle.fill': 'add-circle',
  'minus.circle.fill': 'remove-circle',
  'clock.fill': 'schedule',
  'calendar': 'calendar-today',
  'bell.fill': 'notifications',
  'person.fill': 'person',
  'gear': 'settings',
  'info.circle.fill': 'info',
  'exclamationmark.triangle.fill': 'warning',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'arrow.right': 'arrow-forward',
  'arrow.left': 'arrow-back',
  'magnifyingglass': 'search',
  'line.3.horizontal.decrease': 'filter-list',
  'doc.text.fill': 'description',
  'chart.bar.fill': 'bar-chart',
  'percent': 'percent',
  'dollarsign.circle.fill': 'attach-money',
} as IconMapping;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
