import { useState, useEffect, useMemo } from 'react';
import { ViewMode, Transaction, UserProfile, ToastNotification, OCCConflict } from './types';
import { INITIAL_USER, INITIAL_TRANSACTIONS } from './data/initialData';
import {
  fetchAllTransactionsFromSupabase,
  saveTransactionToSupabase,
  saveTransactionBatchToSupabase,
  deleteTransactionFromSupabase,
  deleteRecurringScopeFromSupabase,
  fetchCategoryBudgetsFromSupabase,
  subscribeToTransactionsRealtime,
  isSupabaseConfigured,
  supabase,
  signOutUser,
  RealtimePayload,
} from './lib/supabase';
import { generateRecurringOccurrences } from './utils/recurring';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { NewTransactionModal } from './components/NewTransactionModal';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { calculateSavingsGoalProgress } from './utils/calculations';

export function App() {
  // Blocking Auth checking state (Item 2)
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // User Profile
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

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

  // OCC Conflict State (Item 4)
  const [activeConflict, setActiveConflict] = useState<OCCConflict | null>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('financas_casal_theme');
    return saved ? saved === 'dark' : true;
  });

  // Supabase Auth Session Listener & Blocking Check
  useEffect(() => {
    if (!supabase) {
      setIsAuthChecking(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        const userEmail = session.user.email || 'casal@financasdocasal.app';
        const userName = session.user.user_metadata?.name || 'Alex & Sam';
        const updatedUser = { ...user, id: session.user.id, email: userEmail, name: userName };
        setUser(updatedUser);
        localStorage.setItem('financas_casal_user', JSON.stringify(updatedUser));
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
        const userEmail = session.user.email || 'casal@financasdocasal.app';
        const userName = session.user.user_metadata?.name || 'Alex & Sam';
        const updatedUser = { ...user, id: session.user.id, email: userEmail, name: userName };
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

  // Supabase Paginated Sync & Category Budgets Sync
  useEffect(() => {
    async function syncSupabase() {
      const cloudTxs = await fetchAllTransactionsFromSupabase();
      if (cloudTxs && cloudTxs.length > 0) {
        setTransactions(cloudTxs);
      }

      const cloudBudgets = await fetchCategoryBudgetsFromSupabase();
      if (cloudBudgets && cloudBudgets.length > 0) {
        setUser((prev) => ({ ...prev, categoryBudgets: cloudBudgets }));
      }
    }

    if (isSupabaseConfigured && isAuthenticated) {
      syncSupabase();

      // Incremental Realtime updates
      const unsubscribe = subscribeToTransactionsRealtime((payload: RealtimePayload) => {
        if (payload.eventType === 'INSERT' && payload.newRecord) {
          const item = payload.newRecord;
          if (item.is_deleted) return;
          const newTx: Transaction = {
            id: String(item.id),
            date: item.date,
            description: item.description,
            amount: Math.abs(Number(item.amount)),
            type: item.type === 'income' || item.type === 'receita' ? 'receita' : 'despesa',
            category: item.category || 'Outros',
            isShared: item.is_shared ?? true,
            paidBy: item.paid_by || 'Casal',
            version: Number(item.version) || 1,
            isRecurring: Boolean(item.is_recurring),
            recurrenceFrequency: item.recurrence_frequency,
            recurrenceEndDate: item.recurrence_end_date,
            recurrenceParentId: item.recurrence_parent_id,
          };
          setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);
        } else if (payload.eventType === 'UPDATE' && payload.newRecord) {
          const item = payload.newRecord;
          if (item.is_deleted) {
            setTransactions((prev) => prev.filter((t) => t.id !== String(item.id)));
          } else {
            const updatedTx: Transaction = {
              id: String(item.id),
              date: item.date,
              description: item.description,
              amount: Math.abs(Number(item.amount)),
              type: item.type === 'income' || item.type === 'receita' ? 'receita' : 'despesa',
              category: item.category || 'Outros',
              isShared: item.is_shared ?? true,
              paidBy: item.paid_by || 'Casal',
              version: Number(item.version) || 1,
              isRecurring: Boolean(item.is_recurring),
              recurrenceFrequency: item.recurrence_frequency,
              recurrenceEndDate: item.recurrence_end_date,
              recurrenceParentId: item.recurrence_parent_id,
            };
            setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
          }
        } else if (payload.eventType === 'DELETE' && payload.oldRecord) {
          setTransactions((prev) => prev.filter((t) => t.id !== String(payload.oldRecord.id)));
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isAuthenticated]);

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
    setTransactions([]);
    addToast('info', 'Sessão encerrada com sucesso.');
  };

  const handleSearchChange = (query: string) => {
    setGlobalSearchQuery(query);
    if (query.trim().length > 0 && currentView !== 'transactions') {
      setCurrentView('transactions');
    }
  };

  // Add new transaction with RECURRENCE GENERATION
  const handleAddTransaction = async (newTxData: Omit<Transaction, 'id'>) => {
    const mainTxId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTx: Transaction = {
      ...newTxData,
      id: mainTxId,
      version: 1,
    };

    let allGeneratedTxs = [newTx];

    // Se for recorrente, gerar próximas ocorrências no futuro
    if (newTx.isRecurring) {
      const generatedOccurrences = generateRecurringOccurrences(newTx, transactions, 12);
      allGeneratedTxs = [newTx, ...generatedOccurrences];
    }

    setTransactions((prev) => [...allGeneratedTxs, ...prev]);

    // Save main transaction
    const res = await saveTransactionToSupabase(newTx);
    const typeLabel = newTx.type === 'receita' ? 'Receita' : 'Despesa';

    if (allGeneratedTxs.length > 1) {
      await saveTransactionBatchToSupabase(allGeneratedTxs.slice(1));
    }

    if (res.conflict && res.serverTx) {
      setActiveConflict({ localTx: newTx, serverTx: res.serverTx });
    } else if (isSupabaseConfigured && !res.success) {
      addToast('info', `✨ ${typeLabel} "${newTx.description}" salva localmente (${res.error || 'nuvem'}).`);
    } else {
      const recLabel = newTx.isRecurring ? ` (com ${allGeneratedTxs.length - 1} repetições geradas)` : '';
      addToast(
        'success',
        `✨ ${typeLabel} "${newTx.description}" de R$ ${newTx.amount.toFixed(2)} adicionada!${recLabel}`
      );
    }
  };

  // Edit existing transaction
  const handleUpdateTransaction = async (updatedTx: Transaction, scope: 'single' | 'future' = 'single') => {
    const parentId = updatedTx.recurrenceParentId || updatedTx.id;

    if (updatedTx.isRecurring && scope === 'future') {
      // Atualizar esta e as futuras
      setTransactions((prev) =>
        prev.map((t) => {
          if ((t.id === parentId || t.recurrenceParentId === parentId) && t.date >= updatedTx.date) {
            return {
              ...updatedTx,
              id: t.id,
              date: t.date,
              version: (t.version || 1) + 1,
            };
          }
          return t;
        })
      );
    } else {
      setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
    }

    const res = await saveTransactionToSupabase(updatedTx);

    if (res.conflict && res.serverTx) {
      setActiveConflict({ localTx: updatedTx, serverTx: res.serverTx });
    } else if (isSupabaseConfigured && !res.success) {
      addToast('info', `✏️ Transação "${updatedTx.description}" salva localmente (${res.error || 'nuvem'}).`);
    } else {
      addToast('success', `✏️ Transação "${updatedTx.description}" atualizada!`);
    }

    setEditingTransaction(null);
  };

  const handleKeepLocalConflict = async () => {
    if (!activeConflict) return;
    const { localTx } = activeConflict;
    await saveTransactionToSupabase(localTx, true);
    setActiveConflict(null);
    addToast('info', `Sua versão da transação "${localTx.description}" foi mantida.`);
  };

  const handleUseServerConflict = () => {
    if (!activeConflict) return;
    const { serverTx } = activeConflict;
    setTransactions((prev) => prev.map((t) => (t.id === serverTx.id ? serverTx : t)));
    setActiveConflict(null);
    addToast('info', `Atualizado para a versão mais recente do servidor.`);
  };

  // Delete transaction with Recurring Scope support
  const handleDeleteTransaction = async (id: string, scope: 'single' | 'future' = 'single') => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    const parentId = txToDelete.recurrenceParentId || txToDelete.id;

    if (txToDelete.isRecurring && scope === 'future') {
      // Excluir esta e as futuras
      setTransactions((prev) =>
        prev.filter((t) => {
          if ((t.id === parentId || t.recurrenceParentId === parentId) && t.date >= txToDelete.date) {
            return false;
          }
          return true;
        })
      );
      await deleteRecurringScopeFromSupabase(parentId, txToDelete.date, 'future');
      addToast('danger', `🗑️ Transações futuras de "${txToDelete.description}" foram excluídas.`);
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      await deleteTransactionFromSupabase(id);
      addToast('danger', `🗑️ Transação "${txToDelete.description}" foi excluída.`);
    }
  };

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

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0f0c1b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-purple-300">
          <span className="material-symbols-outlined text-4xl animate-spin text-purple-400">
            progress_activity
          </span>
          <p className="text-xs font-semibold tracking-wide">Validando sessão do casal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

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
        transactions={transactions}
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
        <ErrorBoundary>
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
            <ReportsView transactions={transactions} user={activeUser} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              user={activeUser}
              onUpdateUser={setUser}
              onResetData={handleResetData}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* New / Edit Transaction Modal */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={handleCloseModal}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        initialTx={editingTransaction}
        user={activeUser}
      />

      {/* OCC Concurrency Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={Boolean(activeConflict)}
        localTx={activeConflict?.localTx || null}
        serverTx={activeConflict?.serverTx || null}
        onKeepLocal={handleKeepLocalConflict}
        onUseServer={handleUseServerConflict}
        onCancel={() => setActiveConflict(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
