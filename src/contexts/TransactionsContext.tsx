import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Transaction, UserProfile, OCCConflict } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_USER } from '../data/initialData';
import {
  fetchAllTransactionsFromSupabase,
  saveTransactionToSupabase,
  saveTransactionBatchToSupabase,
  deleteTransactionFromSupabase,
  deleteRecurringScopeFromSupabase,
  fetchCategoryBudgetsFromSupabase,
  subscribeToTransactionsRealtime,
  isSupabaseConfigured,
  RealtimePayload,
  mapSupabaseRowToTransaction,
} from '../lib/supabase';
import { generateRecurringOccurrences } from '../utils/recurring';
import { calculateSavingsGoalProgress } from '../utils/calculations';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface TransactionsContextType {
  transactions: Transaction[];
  activeUser: UserProfile;
  pendingSyncCount: number;
  isNewTxModalOpen: boolean;
  editingTransaction: Transaction | null;
  activeConflict: OCCConflict | null;
  handleAddTransaction: (newTxData: Omit<Transaction, 'id'>) => Promise<void>;
  handleUpdateTransaction: (updatedTx: Transaction, scope?: 'single' | 'future') => Promise<void>;
  handleDeleteTransaction: (id: string, scope?: 'single' | 'future') => Promise<void>;
  handleResetData: () => void;
  handleOpenEditModal: (tx: Transaction) => void;
  handleCloseModal: () => void;
  handleKeepLocalConflict: () => Promise<void>;
  handleUseServerConflict: () => void;
  handleCancelConflict: () => void;
  setIsNewTxModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const { user, setUser, isAuthenticated } = useAuth();

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

  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeConflict, setActiveConflict] = useState<OCCConflict | null>(null);

  // FILA OFFLINE OUTBOX
  const syncPendingOutbox = useCallback(async () => {
    if (!isSupabaseConfigured || !navigator.onLine) return;

    const pendingTxs = transactions.filter((t) => t.pendingSync);
    if (pendingTxs.length === 0) return;

    let syncedCount = 0;
    for (const tx of pendingTxs) {
      const res = await saveTransactionToSupabase(tx);
      if (res.success) {
        syncedCount++;
        setTransactions((prev) =>
          prev.map((t) => (t.id === tx.id ? { ...t, pendingSync: false } : t))
        );
      }
    }

    if (syncedCount > 0) {
      addToast(
        'success',
        `⚡ Sincronizados ${syncedCount} ${syncedCount === 1 ? 'lançamento offline' : 'lançamentos offline'} com a nuvem!`
      );
    }
  }, [transactions, addToast]);

  useEffect(() => {
    const handleOnline = () => {
      syncPendingOutbox();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncPendingOutbox]);

  useEffect(() => {
    localStorage.setItem('financas_casal_txs', JSON.stringify(transactions));
  }, [transactions]);

  // Handle logout side-effects for transactions manually if needed, 
  // but AuthContext handles `localStorage.removeItem('financas_casal_txs')`. 
  // To clear memory, we rely on App unmounting or reloading. 
  // Wait, in App.tsx handleLogout cleared transactions. Let's add an effect that clears transactions if user logs out.
  useEffect(() => {
    if (!isAuthenticated) {
      setTransactions([]);
    }
  }, [isAuthenticated]);

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

      const unsubscribe = subscribeToTransactionsRealtime((payload: RealtimePayload) => {
        if (payload.eventType === 'INSERT' && payload.newRecord) {
          const item = payload.newRecord;
          if (item.is_deleted) return;
          const newTx = mapSupabaseRowToTransaction(item);
          setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);
        } else if (payload.eventType === 'UPDATE' && payload.newRecord) {
          const item = payload.newRecord;
          if (item.is_deleted) {
            setTransactions((prev) => prev.filter((t) => t.id !== String(item.id)));
          } else {
            const updatedTx = mapSupabaseRowToTransaction(item);
            setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
          }
        } else if (payload.eventType === 'DELETE' && payload.oldRecord) {
          const oldId = payload.oldRecord?.id;
          if (oldId) {
            setTransactions((prev) => prev.filter((t) => t.id !== String(oldId)));
          }
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isAuthenticated, setUser]);

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

  const pendingSyncCount = useMemo(() => {
    return transactions.filter((t) => t.pendingSync).length;
  }, [transactions]);

  const handleAddTransaction = async (newTxData: Omit<Transaction, 'id'>) => {
    const mainTxId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    const newTx: Transaction = {
      ...newTxData,
      id: mainTxId,
      version: 1,
      pendingSync: !isOnline,
    };

    let allGeneratedTxs = [newTx];

    if (newTx.isRecurring) {
      const generatedOccurrences = generateRecurringOccurrences(newTx, transactions, 12);
      allGeneratedTxs = [newTx, ...generatedOccurrences.map((t) => ({ ...t, pendingSync: !isOnline }))];
    }

    setTransactions((prev) => [...allGeneratedTxs, ...prev]);

    const typeLabel = newTx.type === 'receita' ? 'Receita' : 'Despesa';

    if (!isOnline) {
      addToast('info', `📲 ${typeLabel} "${newTx.description}" salva offline (será sincronizada ao reconectar).`);
      return;
    }

    const res = await saveTransactionToSupabase(newTx);

    if (allGeneratedTxs.length > 1) {
      await saveTransactionBatchToSupabase(allGeneratedTxs.slice(1));
    }

    if (res.conflict && res.serverTx) {
      setActiveConflict({ localTx: newTx, serverTx: res.serverTx });
    } else if (isSupabaseConfigured && !res.success) {
      setTransactions((prev) => prev.map((t) => (t.id === newTx.id ? { ...t, pendingSync: true } : t)));
      addToast('info', `📲 ${typeLabel} "${newTx.description}" salva no dispositivo (pendente de nuvem).`);
    } else {
      const recLabel = newTx.isRecurring ? ` (com ${allGeneratedTxs.length - 1} repetições geradas)` : '';
      addToast(
        'success',
        `✨ ${typeLabel} "${newTx.description}" de R$ ${newTx.amount.toFixed(2)} adicionada!${recLabel}`
      );
    }
  };

  const handleUpdateTransaction = async (updatedTx: Transaction, scope: 'single' | 'future' = 'single') => {
    const parentId = updatedTx.recurrenceParentId || updatedTx.id;

    if (updatedTx.isRecurring && scope === 'future') {
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
      addToast('info', `✏️ Transação "${updatedTx.description}" salva localmente.`);
    } else {
      addToast('success', `✏️ Transação "${updatedTx.description}" atualizada!`);
    }

    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string, scope: 'single' | 'future' = 'single') => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    const parentId = txToDelete.recurrenceParentId || txToDelete.id;

    if (txToDelete.isRecurring && scope === 'future') {
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

  const handleCancelConflict = () => setActiveConflict(null);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        activeUser,
        pendingSyncCount,
        isNewTxModalOpen,
        editingTransaction,
        activeConflict,
        handleAddTransaction,
        handleUpdateTransaction,
        handleDeleteTransaction,
        handleResetData,
        handleOpenEditModal,
        handleCloseModal,
        handleKeepLocalConflict,
        handleUseServerConflict,
        handleCancelConflict,
        setIsNewTxModalOpen,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider');
  return ctx;
}
