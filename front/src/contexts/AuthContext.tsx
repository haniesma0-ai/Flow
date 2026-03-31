import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState } from '@/types';
import { authService } from '@/services/auth';
import { invalidateDeliveriesCache } from '@/services/deliveries';
import { toast } from 'sonner';

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  },
  login: async () => false,
  logout: async () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 🔐 Vérification de l'authentification au chargement
  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        // Restore token for API interceptor
        if (parsed.token) {
          localStorage.setItem('token', parsed.token);
        }
        setAuth(() => ({ ...parsed, isLoading: false }));
      } catch {
        localStorage.removeItem('auth');
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuth(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // 🔑 Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      const newAuth = {
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      };
      localStorage.setItem('auth', JSON.stringify(newAuth));
      localStorage.setItem('token', response.token); // for API interceptor
      setAuth(newAuth);
      toast.success('Connexion réussie');
      return true;
    } catch {
      toast.error('Erreur de connexion');
      return false;
    }
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      // Clear module-level service caches so a subsequent login never
      // briefly shows the previous user's data.
      invalidateDeliveriesCache();
      setAuth({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      toast.success('Déconnexion réussie');
    }
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
