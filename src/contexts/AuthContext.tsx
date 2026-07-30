import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { INITIAL_USER } from '../data/initialData';
import { supabase, signOutUser } from '../lib/supabase';
import { useToast } from './ToastContext';

interface AuthContextType {
  isAuthChecking: boolean;
  isAuthenticated: boolean;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  handleLogin: (email: string, name?: string) => void;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('financas_casal_user');
    if (saved) {
      try {
        return { ...INITIAL_USER, ...JSON.parse(saved) };
      } catch (e) {
        return INITIAL_USER;
      }
    }
    return INITIAL_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (!supabase) {
      setIsAuthChecking(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        const meta = session.user.user_metadata || {};
        const userEmail = session.user.email || 'casal@financasdocasal.app';
        setUser((prev) => {
          const updatedUser: UserProfile = {
            ...prev,
            id: session.user.id,
            email: userEmail,
            name: meta.name || prev.name || 'Alex & Sam',
            subtitle: meta.subtitle || prev.subtitle || 'Planejamento Financeiro Juntos',
            partner1Name: meta.partner1Name || prev.partner1Name,
            partner2Name: meta.partner2Name || prev.partner2Name,
            avatarUrl: meta.avatarUrl || prev.avatarUrl,
            totalBudgetGoal: typeof meta.totalBudgetGoal === 'number' ? meta.totalBudgetGoal : prev.totalBudgetGoal,
            monthlyIncomeGoal: typeof meta.monthlyIncomeGoal === 'number' ? meta.monthlyIncomeGoal : prev.monthlyIncomeGoal,
          };
          localStorage.setItem('financas_casal_user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      } else {
        setIsAuthenticated(false);
      }
      setIsAuthChecking(false);
    }).catch(() => {
      setIsAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        const meta = session.user.user_metadata || {};
        const userEmail = session.user.email || 'casal@financasdocasal.app';
        setUser((prev) => {
          const updatedUser: UserProfile = {
            ...prev,
            id: session.user.id,
            email: userEmail,
            name: meta.name || prev.name || 'Alex & Sam',
            subtitle: meta.subtitle || prev.subtitle || 'Planejamento Financeiro Juntos',
            partner1Name: meta.partner1Name || prev.partner1Name,
            partner2Name: meta.partner2Name || prev.partner2Name,
            avatarUrl: meta.avatarUrl || prev.avatarUrl,
            totalBudgetGoal: typeof meta.totalBudgetGoal === 'number' ? meta.totalBudgetGoal : prev.totalBudgetGoal,
            monthlyIncomeGoal: typeof meta.monthlyIncomeGoal === 'number' ? meta.monthlyIncomeGoal : prev.monthlyIncomeGoal,
          };
          localStorage.setItem('financas_casal_user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        localStorage.removeItem('financas_casal_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('financas_casal_user', JSON.stringify(user));
    }
  }, [user, isAuthenticated]);

  const handleLogin = (email: string, name?: string) => {
    const updatedUser: UserProfile = {
      ...user,
      email,
      name: name || user.name || 'Nosso Casal',
    };
    setUser(updatedUser);
    setIsAuthenticated(true);
    localStorage.setItem('financas_casal_user', JSON.stringify(updatedUser));
    addToast('info', `Bem-vindo de volta, ${updatedUser.name}!`);
  };

  const handleLogout = async () => {
    await signOutUser();
    setIsAuthenticated(false);
    localStorage.removeItem('financas_casal_user');
    localStorage.removeItem('financas_casal_txs');
    localStorage.removeItem('financas_casal_theme');
    addToast('info', 'Sessão encerrada com sucesso.');
  };

  return (
    <AuthContext.Provider value={{ isAuthChecking, isAuthenticated, user, setUser, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
