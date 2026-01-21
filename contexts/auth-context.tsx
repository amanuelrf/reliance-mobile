import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, loadAuthToken, persistAuthToken, clearAuthToken } from '@/services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  sendCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = await loadAuthToken();
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Validate token by fetching user profile
      const response = await authApi.getProfile();
      
      if (response.error || !response.data) {
        // Token is invalid, clear it
        await clearAuthToken();
        setIsAuthenticated(false);
        setUser(null);
      } else {
        setIsAuthenticated(true);
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await clearAuthToken();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendCode = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.sendEmailCode(email);
      
      if (response.error || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to send code',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  };

  const verifyCode = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.verifyEmailCode(email, code);
      
      if (response.error || !response.data) {
        return {
          success: false,
          error: response.error || 'Invalid or expired code',
        };
      }

      // Store token and update state
      await persistAuthToken(response.data.access_token);
      setIsAuthenticated(true);
      setUser(response.data.user);
      setIsLoading(false);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  };

  const logout = async () => {
    await clearAuthToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        sendCode,
        verifyCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
