import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { ALL_CATEGORIES, getCategoryEmoji, formatCurrencyBRL, formatDateBR } from '../data/categories';

interface TransactionsViewProps {
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  initialSearchQuery?: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onOpenNewTransaction,
  onDeleteTransaction,
  initialSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<'todos' | TransactionType>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [monthFilter, setMonthFilter] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

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
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || tx.description.toLowerCase().includes(query) || tx.category.toLowerCase().includes(query);

      // Type
      const matchType = typeFilter === 'todos' || tx.type === typeFilter;

      // Category
      const matchCategory = categoryFilter === 'todas' || tx.category.toLowerCase() === categoryFilter.toLowerCase();

      // Month
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

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Escopo', 'Responsável', 'Valor (R$)'];
    const rows = filteredTransactions.map((tx) => [
      formatDateBR(tx.date),
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.type,
      `"${tx.category}"`,
      tx.isShared ? 'Casal' : 'Individual',
      tx.paidBy || '',
      tx.amount.toFixed(2),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Financas_do_Casal_Export_${monthFilter !== 'todos' ? monthFilter : 'Geral'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            Listagem de Transações
          </h1>
          <p className="text-xs text-purple-200/70 font-medium mt-1">
            Histórico completo de receitas e despesas com filtros avançados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-200 font-bold text-xs rounded-2xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-900/40 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="glass-card rounded-3xl p-4 md:p-6 border border-purple-500/20 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Busca por Descrição */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 text-lg">
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
              className="w-full pl-10 pr-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-2xl text-xs text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Filtro por Mês/Ano */}
          <div>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-2xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
            >
              <option value="todos">📅 Todos os Meses</option>
              {monthOptions.map((m) => {
                const [yyyy, mm] = m.split('-');
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const monthLabel = `${monthNames[parseInt(mm, 10) - 1]} / ${yyyy}`;
                return (
                  <option key={m} value={m} className="bg-[#1c1833] text-white">
                    {monthLabel}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-2xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
            >
              <option value="todos">📊 Todos os Tipos</option>
              <option value="receita">🟢 Apenas Receitas (+)</option>
              <option value="despesa">🔴 Apenas Despesas (-)</option>
            </select>
          </div>

          {/* Filtro por Categoria */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-2xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
            >
              <option value="todas">🏷️ Todas as Categorias</option>
              {categoryOptions.map((cat) => (
                <option key={`${cat.type}-${cat.name}`} value={cat.name.toLowerCase()} className="bg-[#1c1833] text-white">
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="glass-card rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
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
                    {/* Data DD/MM/AAAA */}
                    <td className="px-6 py-4 font-semibold text-gray-300 whitespace-nowrap">
                      {formatDateBR(tx.date)}
                    </td>

                    {/* Descrição */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-base shrink-0">
                          {getCategoryEmoji(tx.category, tx.type)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{tx.description}</p>
                          {tx.paidBy && (
                            <p className="text-[10px] text-purple-300/70">Pago por: {tx.paidBy}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-900/40 text-purple-200 border border-purple-500/20">
                        {tx.category}
                      </span>
                    </td>

                    {/* Badge Casal vs Individual */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 w-fit ${
                          tx.isShared
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-gray-800 text-gray-300 border border-gray-700'
                        }`}
                      >
                        <span>{tx.isShared ? '👥' : '👤'}</span>
                        <span>{tx.isShared ? 'Casal' : 'Individual'}</span>
                      </span>
                    </td>

                    {/* Valor */}
                    <td className="px-6 py-4 text-right font-black text-sm whitespace-nowrap">
                      <span className={tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.type === 'receita' ? '+' : '-'} {formatCurrencyBRL(tx.amount)}
                      </span>
                    </td>

                    {/* Excluir Lançamento */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setDeletingTxId(tx.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                        title="Excluir lançamento"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-[#120f24] border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>
            Exibindo {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de{' '}
            {filteredTransactions.length} lançamentos
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-purple-500/20 disabled:opacity-30 cursor-pointer hover:bg-purple-500/10 text-white"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-8 h-8 rounded-xl font-bold text-xs cursor-pointer ${
                  currentPage === idx + 1
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'border border-purple-500/20 hover:bg-purple-500/10 text-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl border border-purple-500/20 disabled:opacity-30 cursor-pointer hover:bg-purple-500/10 text-white"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="glass-card bg-[#1c1833] border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <h3 className="text-lg font-bold text-white">Excluir Lançamento?</h3>
            <p className="text-xs text-gray-300">
              Esta ação removerá o registro do seu saldo e histórico. Deseja continuar?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTxId(null)}
                className="flex-1 py-2.5 rounded-xl border border-purple-500/20 text-xs font-bold text-gray-300 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deletingTxId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-900/40 hover:bg-rose-500"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
