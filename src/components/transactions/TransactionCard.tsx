import React from 'react';
import { Transaction } from '../../types';
import { getCategoryEmoji, formatCurrencyBRL, formatDateBR } from '../../data/categories';

interface TransactionCardProps {
  tx: Transaction;
  handleEditClick: (tx: Transaction) => void;
  handleDeleteClick: (tx: Transaction) => void;
  onEditTransaction?: (tx: Transaction, scope?: 'single' | 'future') => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  tx,
  handleEditClick,
  handleDeleteClick,
  onEditTransaction,
}) => {
  return (
    <div
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
              aria-label="Editar transação"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
              title="Editar lançamento"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          )}
          <button
            onClick={() => handleDeleteClick(tx)}
            aria-label="Excluir transação"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
            title="Excluir lançamento"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
