import { useCallback, useState, useEffect, useRef } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
    FlatList,
    Pressable,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { creditApi, companiesApi, CompanyAutocompleteResponse } from '@/services/api';

type BrokerCheckStatus = 'Approved' | 'Review Required' | 'Denied';

type BrokerCheck = {
  broker: string;
  amount: number;
  status: BrokerCheckStatus;
  time: string;
};

const determineStatusFromRating = (rating?: string): BrokerCheckStatus => {
  if (!rating) return 'Review Required';
  const normalized = rating.toLowerCase();
  if (normalized === 'excellent' || normalized === 'good') {
    return 'Approved';
  }
  if (normalized === 'fair') {
    return 'Review Required';
  }
  return 'Denied';
};

export default function CreditCheckScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [brokerIdentifier, setBrokerIdentifier] = useState('');
  const [loadAmount, setLoadAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [recentChecks, setRecentChecks] = useState<BrokerCheck[]>([
    { broker: 'Broker B', amount: 2000, status: 'Approved', time: 'Just now' },
    { broker: 'Broker V Logistics', amount: 3500, status: 'Review Required', time: 'Yesterday' },
    { broker: 'Carrier X', amount: 1450, status: 'Denied', time: 'Jan 12' },
  ]);

  // Autocomplete state
  const [autocompleteResults, setAutocompleteResults] = useState<CompanyAutocompleteResponse[]>([]);
  const [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedMcNumber, setSelectedMcNumber] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const primaryColor = useThemeColor({}, 'primary');
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

  const getStatusColor = (status: BrokerCheckStatus) => {
    if (status === 'Approved') return successColor;
    if (status === 'Review Required') return warningColor;
    return dangerColor;
  };

  // Format display string for autocomplete results
  const formatCompanyDisplay = (company: CompanyAutocompleteResponse): string => {
    if (company.mc_number) {
      return `${company.name} - MC: ${company.mc_number}`;
    }
    return company.name;
  };

  // Handle autocomplete search with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }

    const query = brokerIdentifier.trim();

    // Don't search if query is too short or if we have a selected MC number
    if (query.length < 3 || selectedMcNumber !== null) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    // Debounce API call
    autocompleteTimeoutRef.current = setTimeout(async () => {
      setIsLoadingAutocomplete(true);
      setShowAutocomplete(true);

      const response = await companiesApi.autocomplete(query, 5);

      if (response.error || !response.data) {
        setAutocompleteResults([]);
        setIsLoadingAutocomplete(false);
        return;
      }

      setAutocompleteResults(response.data);
      setIsLoadingAutocomplete(false);
    }, 300);

    return () => {
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current);
      }
    };
  }, [brokerIdentifier, selectedMcNumber]);

  // Handle autocomplete item selection
  const handleSelectCompany = (company: CompanyAutocompleteResponse) => {
    const displayValue = formatCompanyDisplay(company);
    setBrokerIdentifier(displayValue);
    setSelectedMcNumber(company.mc_number);
    setShowAutocomplete(false);
    Keyboard.dismiss();
  };

  // Handle input change
  const handleBrokerIdentifierChange = (value: string) => {
    setBrokerIdentifier(value);
    // Clear selected MC number when user types
    if (selectedMcNumber !== null) {
      setSelectedMcNumber(null);
    }
  };

  const handleCreditCheck = async () => {
    const trimmedBroker = brokerIdentifier.trim();
    const parsedAmount = Number(loadAmount.replace(/[^0-9.]/g, ''));

    if (!trimmedBroker) {
      setFormError('Enter a broker name, MC number, or DOT number.');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Enter a valid load amount.');
      return;
    }

    setFormError(null);
    setIsChecking(true);
    setShowAutocomplete(false);

    // Use selected MC number if available, otherwise use broker identifier
    const response = await creditApi.checkScore({
      broker_name: selectedMcNumber ? selectedMcNumber.toString() : trimmedBroker,
      broker_mc_number: selectedMcNumber ? selectedMcNumber.toString() : undefined,
      load_amount: parsedAmount,
    });

    if (response.error || !response.data) {
      setFormError(response.error || 'Could not complete the credit check.');
      setIsChecking(false);
      return;
    }

    const { score } = response.data;
    const statusLabel = determineStatusFromRating(score?.rating);

    setRecentChecks((prev) =>
      [
        {
          broker: trimmedBroker,
          amount: parsedAmount,
          status: statusLabel,
          time: 'Just now',
        },
        ...prev,
      ].slice(0, 4)
    );

    setIsChecking(false);
    setBrokerIdentifier('');
    setLoadAmount('');
    setSelectedMcNumber(null);
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
        keyboardShouldPersistTaps="handled"
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

        <Card variant="elevated" style={styles.formCard}>
          <View style={styles.formField}>
            <ThemedText style={styles.formLabel}>Load Amount ($)</ThemedText>
            <TextInput
              value={loadAmount}
              onChangeText={(value) => setLoadAmount(value.replace(/[^0-9.]/g, ''))}
              placeholder="2000"
              placeholderTextColor={textSecondary}
              style={[styles.input, { backgroundColor: surfaceColor }]}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>
          <View style={styles.formField}>
            <ThemedText style={styles.formLabel}>Broker / MC / DOT</ThemedText>
            <View style={styles.autocompleteContainer}>
              <TextInput
                ref={inputRef}
                value={brokerIdentifier}
                onChangeText={handleBrokerIdentifierChange}
                onFocus={() => {
                  if (autocompleteResults.length > 0 || brokerIdentifier.length >= 3) {
                    setShowAutocomplete(true);
                  }
                }}
                onBlur={() => {
                  // Delay closing to allow item selection
                  setTimeout(() => {
                    setShowAutocomplete(false);
                  }, 200);
                }}
                placeholder="Enter broker name, MC, or DOT"
                placeholderTextColor={textSecondary}
                style={[styles.input, { backgroundColor: surfaceColor }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              {isLoadingAutocomplete && (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color={primaryColor} />
                </View>
              )}
              {showAutocomplete && (autocompleteResults.length > 0 || isLoadingAutocomplete) && (
                <View style={[styles.autocompleteDropdown, { backgroundColor: surfaceColor }]}>
                  {isLoadingAutocomplete ? (
                    <View style={styles.autocompleteItem}>
                      <ThemedText style={[styles.autocompleteText, { color: textSecondary }]}>
                        Searching...
                      </ThemedText>
                    </View>
                  ) : autocompleteResults.length === 0 ? (
                    <View style={styles.autocompleteItem}>
                      <ThemedText style={[styles.autocompleteText, { color: textSecondary }]}>
                        No results found
                      </ThemedText>
                    </View>
                  ) : (
                    <FlatList
                      data={autocompleteResults}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <Pressable
                          style={styles.autocompleteItem}
                          onPress={() => handleSelectCompany(item)}
                        >
                          <ThemedText style={styles.autocompleteText}>
                            {formatCompanyDisplay(item)}
                          </ThemedText>
                        </Pressable>
                      )}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                    />
                  )}
                </View>
              )}
            </View>
          </View>
          {formError && <ThemedText style={styles.errorText}>{formError}</ThemedText>}
          <Button
            title={isChecking ? 'Checking...' : 'Run Credit Check'}
            variant="primary"
            size="lg"
            loading={isChecking}
            onPress={handleCreditCheck}
          />
        </Card>

        <ThemedText style={styles.sectionTitle}>Recent Broker Checks</ThemedText>
        <Card variant="elevated" style={styles.recentCard}>
          {recentChecks.map((check, index) => (
            <View
              key={`${check.broker}-${check.time}`}
              style={[
                styles.recentItem,
                index !== recentChecks.length - 1 && styles.recentDivider,
              ]}
            >
              <View style={styles.recentLeft}>
                <ThemedText style={styles.recentBroker}>{check.broker}</ThemedText>
                <ThemedText style={[styles.recentAmount, { color: textSecondary }]}>
                  ${check.amount.toLocaleString()} • {check.time}
                </ThemedText>
              </View>
              <View style={styles.recentRight}>
                <ThemedText style={styles.recentScoreLabel}>Status</ThemedText>
                <ThemedText style={[styles.recentScoreValue, { color: getStatusColor(check.status) }]}>
                  {check.status}
                </ThemedText>
              </View>
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
  formCard: {
    marginBottom: Spacing.lg,
  },
  formField: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: Spacing.sm,
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
  checkButton: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  recentCard: {
    marginBottom: Spacing.lg,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  recentDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  recentLeft: {
    flex: 1,
  },
  recentBroker: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentAmount: {
    fontSize: 13,
    marginTop: 2,
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentScoreLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  recentScoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  autocompleteContainer: {
    position: 'relative',
  },
  loadingIndicator: {
    position: 'absolute',
    right: Spacing.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  autocompleteDropdown: {
    marginTop: 4,
    borderRadius: BorderRadius.md,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autocompleteItem: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  autocompleteText: {
    fontSize: 14,
  },
});
