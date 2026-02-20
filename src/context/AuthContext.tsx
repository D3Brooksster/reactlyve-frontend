import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, profileApi } from '../services/api';
import { User } from '../types/user';
import { API_BASE_URL } from '../components/constants/apiRoutes';

type OAuthProvider = 'google' | 'microsoft' | 'facebook' | 'twitter';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (provider?: OAuthProvider) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await profileApi.getProfileMe();
        setUser(response.data);
      } catch (err) {
        console.error('Authentication failed:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (provider: OAuthProvider = 'google') => {
    setIsLoading(true);
    const loginUrl = `${API_BASE_URL}/auth/${provider}`;
    try {
      const { hostname } = new URL(loginUrl);
      const allowedHosts = ['localhost', 'api.reactlyve.com'];
      if (!allowedHosts.includes(hostname)) {
        throw new Error('Untrusted redirect host');
      }
      window.location.href = loginUrl;
    } catch (err) {
      console.error('Invalid login redirect:', err);
      setError('Unable to start login process.');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
