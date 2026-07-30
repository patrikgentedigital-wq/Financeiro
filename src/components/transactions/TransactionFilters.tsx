import React from 'react';
import { TransactionType } from '../../types';

interface TransactionFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  typeFilter: 'todos' | TransactionType;
  setTypeFilter: (val: 'todos' | TransactionType) => void;
  monthFilter: string;
  setMonthFilter: (val: string) => void;
  monthOptions: string[];
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  categoryOptions: Array<{ id: string; name: string; emoji: string }>;
  setCurrentPage: (page: number) => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  monthFilter,
  setMonthFilter,
  monthOptions,
  categoryFilter,
  setCategoryFilter,
  categoryOptions,
  setCurrentPage,
}) => {
  return (
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
            className={`flex-1 py-1 min-h-[44px] rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b] ${
              typeFilter === 'todos' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => { setTypeFilter('receita'); setCurrentPage(1); }}
            className={`flex-1 py-1 min-h-[44px] rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b] ${
              typeFilter === 'receita' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => { setTypeFilter('despesa'); setCurrentPage(1); }}
            className={`flex-1 py-1 min-h-[44px] rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b] ${
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
  );
};
