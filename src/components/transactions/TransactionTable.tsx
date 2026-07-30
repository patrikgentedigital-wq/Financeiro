import React from 'react';
import { Transaction } from '../../types';
import { getCategoryEmoji, formatCurrencyBRL, formatDateBR } from '../../data/categories';

interface TransactionTableProps {
  paginatedTransactions: Transaction[];
  handleEditClick: (tx: Transaction) => void;
  handleDeleteClick: (tx: Transaction) => void;
  onEditTransaction?: (tx: Transaction, scope?: 'single' | 'future') => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  paginatedTransactions,
  handleEditClick,
  handleDeleteClick,
  onEditTransaction,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-[#0f0c1b]">
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
                        aria-label="Editar transação"
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(tx)}
                      aria-label="Excluir transação"
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
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
  );
};
