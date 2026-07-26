import { useState, useEffect, useMemo } from 'react';
import { ViewMode, Transaction, UserProfile, ToastNotification } from './types';
import { INITIAL_USER, INITIAL_TRANSACTIONS } from './data/initialData';
import {
  fetchTransactionsFromSupabase,
  saveTransactionToSupabase,
  deleteTransactionFromSupabase,
  subscribeToTransactionsRealtime,
  isSupabaseConfigured,
  supabase,
  signOutUser,
} from './lib/supabase';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { NewTransactionModal } from './components/NewTransactionModal';
import { ToastContainer } from './components/ToastContainer';
import { calculateSavingsGoalProgress } from './utils/calculations';

export function App() {
  // Load saved user profile or fallback
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

  // Persistent auth session check
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedUser = localStorage.getItem('financas_casal_user');
    return Boolean(savedUser);
  });

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('financas_casal_txs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TRANSACTIONS;
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('financas_casal_theme');
    return saved ? saved === 'dark' : true;
  });

  // Supabase Auth Session Listener & Initial Check
  useEffect(() => {
    if (!supabase) return;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        const userEmail = session.user.email || 'casal@financasdocasal.app';
        const userName = session.user.user_metadata?.name || 'Alex & Sam';
        const updatedUser = { ...user, email: userEmail, name: userName };
        setUser(updatedUser);
        localStorage.setItem('financas_casal_user', JSON.stringify(updatedUser));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        const userEmail = session.user.email || 'casal@financasdocasal.app';
        const userName = session.user.user_metadata?.name || 'Alex & Sam';
        const updatedUser = { ...user, email: userEmail, name: userName };
        setUser(updatedUser);
        localStorage.setItem('financas_casal_user', JSON.stringify(updatedUser));
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
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('financas_casal_theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('financas_casal_theme', 'light');
    }
  }, [isDarkMode]);

  // Persist local user & transactions
  useEffect(() => {
    localStorage.setItem('financas_casal_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('financas_casal_user', JSON.stringify(user));
    }
  }, [user, isAuthenticated]);

  // Attempt Supabase Sync on load & set up Realtime listener
  useEffect(() => {
    async function syncSupabase() {
      const cloudTxs = await fetchTransactionsFromSupabase();
      if (cloudTxs && cloudTxs.length > 0) {
        setTransactions(cloudTxs);
      }
    }

    if (isSupabaseConfigured) {
      syncSupabase();
      const unsubscribe = subscribeToTransactionsRealtime(() => {
        syncSupabase();
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Toast Helper
  const addToast = (type: 'success' | 'danger' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handle Login & Logout
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
    // Limpeza completa do localStorage no logout (Pontos 3 e 8)
    localStorage.removeItem('financas_casal_user');
    localStorage.removeItem('financas_casal_txs');
    localStorage.removeItem('financas_casal_theme');
    setTransactions([]);
    addToast('info', 'Sessão encerrada com sucesso.');
  };

  // Global search input
  const handleSearchChange = (query: string) => {
    setGlobalSearchQuery(query);
    if (query.trim().length > 0 && currentView !== 'transactions') {
      setCurrentView('transactions');
    }
  };

  // Add new transaction using Crypto.randomUUID() (Ponto 4)
  const handleAddTransaction = async (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      version: 1,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Save to Supabase if configured & check result
    const savedOnCloud = await saveTransactionToSupabase(newTx);
    const typeLabel = newTx.type === 'receita' ? 'Receita' : 'Despesa';

    if (isSupabaseConfigured && !savedOnCloud) {
      addToast('info', `✨ ${typeLabel} "${newTx.description}" salva localmente (falha na nuvem ou conflito).`);
    } else {
      addToast(
        'success',
        `✨ ${typeLabel} "${newTx.description}" de R$ ${newTx.amount.toFixed(2)} adicionada!`
      );
    }
  };

  // Edit existing transaction
  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));

    // Update in Supabase
    const savedOnCloud = await saveTransactionToSupabase(updatedTx);
    if (isSupabaseConfigured && !savedOnCloud) {
      addToast('info', `✏️ Transação "${updatedTx.description}" atualizada localmente.`);
    } else {
      addToast('success', `✏️ Transação "${updatedTx.description}" atualizada!`);
    }

    setEditingTransaction(null);
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Delete from Supabase if configured
    await deleteTransactionFromSupabase(id);

    addToast('danger', `🗑️ Transação "${txToDelete.description}" foi excluída.`);
  };

  // Reset data
  const handleResetData = () => {
    setUser(INITIAL_USER);
    setTransactions(INITIAL_TRANSACTIONS);
    localStorage.removeItem('financas_casal_txs');
    addToast('info', 'Dados restaurados para o padrão original.');
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsNewTxModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsNewTxModalOpen(false);
    setEditingTransaction(null);
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Dynamic user profile calculation with real savings goal progress (Ponto 7)
  const activeUser: UserProfile = useMemo(() => {
    if (!user.savingsGoal) return user;
    const dynamicCurrent = calculateSavingsGoalProgress(transactions);
    return {
      ...user,
      savingsGoal: {
        ...user.savingsGoal,
        currentAmount: dynamicCurrent,
      },
    };
  }, [user, transactions]);

  return (
    <div className="min-h-screen bg-[#0f0c1b] text-white selection:bg-purple-500 selection:text-white font-['Inter',sans-serif]">
      {/* Navigation Bar */}
      <Navigation
        currentView={currentView}
        onNavigate={setCurrentView}
        user={activeUser}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsNewTxModalOpen(true);
        }}
        globalSearchQuery={globalSearchQuery}
        onSearchChange={handleSearchChange}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Container */}
      <main className="pt-24 pb-20 md:pb-12 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {currentView === 'dashboard' && (
          <DashboardView
            user={activeUser}
            transactions={transactions}
            onNavigate={setCurrentView}
            onOpenNewTransaction={() => {
              setEditingTransaction(null);
              setIsNewTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleOpenEditModal}
          />
        )}

        {currentView === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onOpenNewTransaction={() => {
              setEditingTransaction(null);
              setIsNewTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleOpenEditModal}
            initialSearchQuery={globalSearchQuery}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView transactions={transactions} user={user} />
        )}

        {currentView === 'settings' && (
          <SettingsView
            user={user}
            onUpdateUser={setUser}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* New / Edit Transaction Modal */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={handleCloseModal}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        initialTx={editingTransaction}
        user={user}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
