'use client';

import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { apiClient, ApiResponse, extractApiError } from '@/lib/api/client';
import { clearSession, persistSession, persistUser, restoreSession, restoreUser } from '@/lib/auth/storage';
import { AuthState, AuthTokens, LoginCredentials, User } from '@/types/auth';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    try {
      const session = restoreSession();
      if (!session) return;

      const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
      const user = response.data.data.user;
      persistUser(user);
      setState((prev) => ({
        ...prev,
        user,
        tokens: session,
        isAuthenticated: true,
      }));
    } catch (error) {
      console.error('Failed to refresh user:', extractApiError(error));
      clearSession();
      setState((prev) => ({
        ...prev,
        user: null,
        tokens: null,
        isAuthenticated: false,
      }));
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const session = restoreSession();
      const user = restoreUser<User>();

      if (session && user) {
        setState({
          user,
          tokens: session,
          isAuthenticated: true,
          isLoading: false,
        });
        await refreshUser();
      } else {
        setState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initialize();
  }, [refreshUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', credentials);
      const { user, tokens } = response.data.data;

      persistSession(tokens);
      persistUser(user);

      setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      throw new Error(extractApiError(error));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSession();
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      refreshUser,
    }),
    [state, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
