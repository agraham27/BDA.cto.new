export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin' | 'instructor';
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  confirmPassword: string;
}
