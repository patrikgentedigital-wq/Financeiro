import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { ALL_CATEGORIES, getCategoryEmoji, formatCurrencyBRL, formatDateBR } from '../data/categories';
import { exportTransactionsToCSV } from '../utils/csvExport';
import { RecurringScopeModal } from './RecurringScopeModal';

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
            className="px-4 py-2.5 rounded-2xl bg-[#1c1833] hover:bg-purple-500/20 text-purple-200 border border-purple-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-900/40 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-3xl border border-purple-500/20 bg-[#131024]/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por descrição..."
              className="w-full pl-9 pr-4 py-2 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white placeholder-purple-300/40 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="flex bg-[#120f24] p-1 rounded-xl border border-purple-500/20 text-xs">
            <button
              onClick={() => { setTypeFilter('todos'); setCurrentPage(1); }}
              className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                typeFilter === 'todos' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => { setTypeFilter('receita'); setCurrentPage(1); }}
              className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                typeFilter === 'receita' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Receitas
            </button>
            <button
              onClick={() => { setTypeFilter('despesa'); setCurrentPage(1); }}
              className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                typeFilter === 'despesa' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Despesas
            </button>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
            >
              <option value="todos">Todos os Meses</option>
              {monthOptions.map((m) => (
                <option key={m} value={m} className="bg-[#120f24]">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
            >
              <option value="todas">Todas as Categorias</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.name} className="bg-[#120f24]">
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-[#120f24] border border-purple-500/20 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-purple-300">
                      {formatDateBR(tx.date)}
                    </span>
                    {tx.isRecurring && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">repeat</span>
                        <span>{tx.recurrenceFrequency || 'Recorrente'}</span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-black ${
                      tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'receita' ? '+' : '-'} {formatCurrencyBRL(tx.amount)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-lg shrink-0">
                    {getCategoryEmoji(tx.category, tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-xs truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-900/40 text-purple-200 border border-purple-500/20">
                        {tx.category}
                      </span>
                      {tx.paidBy && (
                        <span className="text-[10px] text-purple-300/70">
                          {tx.paidBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-xs">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      tx.isShared
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    <span>{tx.isShared ? '👥 Casal' : '👤 Indiv.'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {onEditTransaction && (
                      <button
                        onClick={() => handleEditClick(tx)}
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 flex items-center justify-center transition-colors cursor-pointer"
                        title="Editar lançamento"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(tx)}
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-colors cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#120f24] border-b border-purple-500/20 text-purple-200 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Âmbito</th>
                <th className="px-6 py-4 text-right">Valor (R$)</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10 text-xs">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Nenhuma transação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-purple-500/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-300 whitespace-nowrap">
                      {formatDateBR(tx.date)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-base shrink-0">
                          {getCategoryEmoji(tx.category, tx.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{tx.description}</p>
                            {tx.isRecurring && (
                              <span
                                title={`Recorrente (${tx.recurrenceFrequency || 'mensal'})`}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[12px]">repeat</span>
                                <span>{tx.recurrenceFrequency || 'mensal'}</span>
                              </span>
                            )}
                          </div>
                          {tx.paidBy && (
                            <p className="text-[11px] text-purple-300/60">
                              Pago por: <span className="font-medium text-purple-200">{tx.paidBy}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/30 text-purple-200 border border-purple-500/20">
                        {tx.category}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          tx.isShared
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-gray-800 text-gray-300 border border-gray-700'
                        }`}
                      >
                        {tx.isShared ? '👥 Casal' : '👤 Individual'}
                      </span>
                    </td>

                    <td
                      className={`px-6 py-4 text-right font-black text-sm whitespace-nowrap ${
                        tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'receita' ? '+' : '-'} {formatCurrencyBRL(tx.amount)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {onEditTransaction && (
                          <button
                            onClick={() => handleEditClick(tx)}
                            className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(tx)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                className="px-3 py-1.5 rounded-xl border border-purple-500/20 text-purple-200 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-purple-500/20 text-purple-200 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                className="px-4 py-2 rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-200 hover:bg-purple-500/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deletingTxId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-900/40 cursor-pointer"
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
