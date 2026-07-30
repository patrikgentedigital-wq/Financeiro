import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { ALL_CATEGORIES, getCategoryEmoji, formatCurrencyBRL, formatDateBR } from '../data/categories';
import { exportTransactionsToCSV } from '../utils/csvExport';
import { RecurringScopeModal } from './RecurringScopeModal';
import { TransactionFilters } from './transactions/TransactionFilters';
import { TransactionCard } from './transactions/TransactionCard';
import { TransactionTable } from './transactions/TransactionTable';

interface TransactionsViewProps {
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onDeleteTransaction: (id: string, scope?: 'single' | 'future') => void;
  onEditTransaction?: (tx: Transaction, scope?: 'single' | 'future') => void;
  initialSearchQuery?: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onOpenNewTransaction,
  onDeleteTransaction,
  onEditTransaction,
  initialSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<'todos' | TransactionType>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [monthFilter, setMonthFilter] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Estado para Modal de Escopo de Recorrência
  const [recurringTarget, setRecurringTarget] = useState<{
    tx: Transaction;
    action: 'edit' | 'delete';
  } | null>(null);

  const itemsPerPage = 8;

  // Extract available months for month filter dropdown
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Deduplicate category filter options
  const categoryOptions = useMemo(() => {
    const map = new Map<string, typeof ALL_CATEGORIES[0]>();
    ALL_CATEGORIES.forEach((cat) => {
      if (!map.has(cat.name.toLowerCase())) {
        map.set(cat.name.toLowerCase(), cat);
      }
    });
    return Array.from(map.values());
  }, []);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        tx.description.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query);

      const matchType = typeFilter === 'todos' || tx.type === typeFilter;
      const matchCategory =
        categoryFilter === 'todas' || tx.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchMonth = monthFilter === 'todos' || (tx.date && tx.date.startsWith(monthFilter));

      return matchSearch && matchType && matchCategory && matchMonth;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, monthFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Export CSV using shared utility
  const handleExportCSV = () => {
    const filename = `Financas_do_Casal_Export_${monthFilter !== 'todos' ? monthFilter : 'Geral'}.csv`;
    exportTransactionsToCSV(filteredTransactions, filename);
  };

  const handleEditClick = (tx: Transaction) => {
    if (tx.isRecurring && onEditTransaction) {
      setRecurringTarget({ tx, action: 'edit' });
    } else if (onEditTransaction) {
      onEditTransaction(tx);
    }
  };

  const handleDeleteClick = (tx: Transaction) => {
    if (tx.isRecurring) {
      setRecurringTarget({ tx, action: 'delete' });
    } else {
      setDeletingTxId(tx.id);
    }
  };

  const handleConfirmRecurringScope = (scope: 'single' | 'future') => {
    if (!recurringTarget) return;
    const { tx, action } = recurringTarget;
    if (action === 'delete') {
      onDeleteTransaction(tx.id, scope);
    } else if (action === 'edit' && onEditTransaction) {
      onEditTransaction(tx, scope);
    }
    setRecurringTarget(null);
  };

  const confirmDelete = (id: string) => {
    onDeleteTransaction(id);
    setDeletingTxId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-3xl">receipt_long</span>
            Transações do Casal
          </h1>
          <p className="text-xs text-purple-200/70 mt-1">
            Gerencie, filtre e acompanhe todas as movimentações financeiras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#1c1833] hover:bg-purple-500/20 text-purple-200 border border-purple-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-900/40 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <TransactionFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        monthOptions={monthOptions}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categoryOptions={categoryOptions}
        setCurrentPage={setCurrentPage}
      />

      {/* Transactions Container */}
      <div className="glass-card rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl">
        {/* Mobile Cards */}
        <div className="block md:hidden p-4 space-y-3">
          {paginatedTransactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              Nenhuma transação encontrada com os filtros selecionados.
            </div>
          ) : (
            paginatedTransactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                tx={tx}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
                onEditTransaction={onEditTransaction}
              />
            ))
          )}
        </div>

        {/* Desktop Table */}
        <TransactionTable
          paginatedTransactions={paginatedTransactions}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          onEditTransaction={onEditTransaction}
        />

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-[#120f24] border-t border-purple-500/20 text-xs">
            <span className="text-purple-200/70 font-medium">
              Página {currentPage} de {totalPages} ({filteredTransactions.length} registros)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 min-h-[44px] min-w-[44px] rounded-xl border border-purple-500/20 text-purple-200 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 min-h-[44px] min-w-[44px] rounded-xl border border-purple-500/20 text-purple-200 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for Non-recurring */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card p-6 rounded-3xl border border-rose-500/30 bg-[#131024]/95 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-white">Excluir Lançamento?</h3>
            <p className="text-xs text-purple-200/70">
              Esta ação removerá permanentemente o lançamento da sua conta.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTxId(null)}
                className="px-4 py-2 min-h-[44px] rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-200 hover:bg-purple-500/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deletingTxId)}
                className="px-5 py-2 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-900/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Scope Selection Modal */}
      <RecurringScopeModal
        isOpen={Boolean(recurringTarget)}
        actionType={recurringTarget?.action || 'delete'}
        transaction={recurringTarget?.tx || null}
        onConfirm={handleConfirmRecurringScope}
        onCancel={() => setRecurringTarget(null)}
      />
    </div>
  );
};
