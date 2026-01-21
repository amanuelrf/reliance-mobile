/**
 * API Service for Reliance Factor App
 * Handles all communication with the Python FastAPI backend
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Update this to your Azure App Service URL when deployed
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api/v1'
  : 'https://your-app-name.azurewebsites.net/api/v1';

const AUTH_TOKEN_KEY = 'auth_token';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

interface RequestConfig {
  method?: HttpMethod;
  body?: object;
  headers?: Record<string, string>;
}

// Token storage - in production, use secure storage
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

/**
 * Persist auth token to secure storage
 */
export const persistAuthToken = async (token: string) => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      // Use SecureStore for native platforms
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    }
    setAuthToken(token);
  } catch (error) {
    console.error('Failed to persist auth token:', error);
    throw error;
  }
};

/**
 * Load auth token from secure storage
 */
export const loadAuthToken = async (): Promise<string | null> => {
  try {
    let token: string | null = null;
    if (Platform.OS === 'web') {
      token = localStorage.getItem(AUTH_TOKEN_KEY);
    } else {
      token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    }
    if (token) {
      setAuthToken(token);
    }
    return token;
  } catch (error) {
    console.error('Failed to load auth token:', error);
    return null;
  }
};

/**
 * Clear auth token from secure storage
 */
export const clearAuthToken = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }
    setAuthToken(null);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
};

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = config;

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data.detail || data.message || 'An error occurred',
        status: response.status,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// ============================================
// User & Authentication
// ============================================

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EmailCodeRequest {
  email: string;
}

export interface EmailCodeResponse {
  message: string;
}

export interface EmailCodeVerifyRequest {
  email: string;
  code: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: (credentials: LoginRequest) =>
    apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: credentials }),

  register: (data: { email: string; password: string; name: string }) =>
    apiRequest<User>('/auth/register', { method: 'POST', body: data }),

  sendEmailCode: (email: string) =>
    apiRequest<EmailCodeResponse>('/auth/send-code', { method: 'POST', body: { email } }),

  verifyEmailCode: (email: string, code: string) =>
    apiRequest<TokenResponse>('/auth/verify-code', { method: 'POST', body: { email, code } }),

  logout: async () => {
    await clearAuthToken();
    return Promise.resolve({ data: true, error: null, status: 200 });
  },

  getProfile: () => apiRequest<User>('/auth/profile'),
};

// ============================================
// Credit Check
// ============================================

export interface CreditScore {
  id: number;
  user_id: number;
  score: number;
  rating: string;
  checked_at: string;
  factors: CreditFactor[];
}

export interface CreditFactor {
  name: string;
  score: number;
  status: string;
}

export interface CreditHistory {
  month: string;
  score: number;
}

export interface CreditCheckRequest {
  load_amount: number;
  broker_name?: string;
  broker_mc_number?: string;
  broker_dot_number?: string;
  result?: string;
  factorcloud_uuid?: string;
  credit_check_uuid?: string;
  source?: string;
}

export interface CreditCheckResponse {
  score: CreditScore;
  change: number;
  message: string;
}

export const creditApi = {
  getCurrentScore: () => apiRequest<CreditScore>('/credit/score'),

  checkScore: (payload: CreditCheckRequest) =>
    apiRequest<CreditCheckResponse>('/credit/check', { method: 'POST', body: payload }),

  getHistory: (months: number = 6) =>
    apiRequest<CreditHistory[]>(`/credit/history?months=${months}`),

  getFactors: () => apiRequest<CreditFactor[]>('/credit/factors'),
};

// ============================================
// Fuel
// ============================================

export interface FuelPurchase {
  id: number;
  user_id: number;
  station: string;
  gallons: number;
  price_per_gallon: number;
  total: number;
  date: string;
}

export interface FuelSummary {
  total_spent: number;
  total_gallons: number;
  avg_price_per_gallon: number;
  savings: number;
  last_fill_up: FuelPurchase | null;
}

export interface CreateFuelPurchase {
  station: string;
  gallons: number;
  price_per_gallon: number;
  date?: string;
}

export const fuelApi = {
  getSummary: (period: 'week' | 'month' | 'year' = 'month') =>
    apiRequest<FuelSummary>(`/fuel/summary?period=${period}`),

  getHistory: (limit: number = 10, offset: number = 0) =>
    apiRequest<FuelPurchase[]>(`/fuel/history?limit=${limit}&offset=${offset}`),

  addPurchase: (data: CreateFuelPurchase) =>
    apiRequest<FuelPurchase>('/fuel/purchase', { method: 'POST', body: data }),

  deletePurchase: (id: number) =>
    apiRequest<void>(`/fuel/purchase/${id}`, { method: 'DELETE' }),
};

// ============================================
// Balance
// ============================================

export interface Balance {
  current_balance: number;
  available_credit: number;
  pending_transactions: number;
  monthly_spent: number;
  monthly_limit: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface TransferRequest {
  amount: number;
  to_account: string;
  description?: string;
}

export const balanceApi = {
  getBalance: () => apiRequest<Balance>('/balance'),

  getTransactions: (limit: number = 10, offset: number = 0) =>
    apiRequest<Transaction[]>(`/balance/transactions?limit=${limit}&offset=${offset}`),

  addFunds: (amount: number) =>
    apiRequest<Balance>('/balance/add-funds', { method: 'POST', body: { amount } }),

  transfer: (data: TransferRequest) =>
    apiRequest<Transaction>('/balance/transfer', { method: 'POST', body: data }),
};

// ============================================
// Dashboard / Home
// ============================================

export interface DashboardData {
  user: User;
  credit_score: number;
  balance: number;
  fuel_savings: number;
  recent_transactions: Transaction[];
}

export const dashboardApi = {
  getData: () => apiRequest<DashboardData>('/dashboard'),
};

// ============================================
// Companies
// ============================================

export interface CompanyAutocompleteResponse {
  id: number;
  name: string;
  legal_name: string | null;
  mc_number: number | null;
  dot_number: number | null;
}

export const companiesApi = {
  autocomplete: (query: string, limit: number = 5) =>
    apiRequest<CompanyAutocompleteResponse[]>(
      `/companies/autocomplete?query=${encodeURIComponent(query)}&limit=${limit}`
    ),
};

// Export all APIs
export const api = {
  auth: authApi,
  credit: creditApi,
  fuel: fuelApi,
  balance: balanceApi,
  dashboard: dashboardApi,
  companies: companiesApi,
};

export default api;
