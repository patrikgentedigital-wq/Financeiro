import React from 'react';
import { Transaction, ViewMode } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../data/categories';

interface RecentTransactionsListProps {
  scopedTransactions: Transaction[];
  onNavigate: (view: ViewMode) => void;
  onOpenNewTransaction: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  setDeletingTxId: (id: string) => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  scopedTransactions,
  onNavigate,
  onOpenNewTransaction,
  onEditTransaction,
  setDeletingTxId,
}) => {
  return (
    <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between border-b border-purple-500/15 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400">history</span>
          Últimas Transações
        </h3>
        <button
          onClick={() => onNavigate('transactions')}
          className="min-h-[44px] text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b] p-1 rounded"
        >
          <span>Ver Todas ({scopedTransactions.length})</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {scopedTransactions.slice(0, 5).map((tx) => (
          <div
            key={tx.id}
            className="p-3.5 bg-[#1c1833] hover:bg-[#231e42] rounded-2xl border border-purple-500/10 flex items-center justify-between gap-3 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${
                  tx.type === 'receita'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}
              >
                <span>{tx.type === 'receita' ? '💰' : '💸'}</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-white truncate">{tx.description}</p>
                  {tx.isRecurring && (
                    <span className="text-[10px]" title="Transação Recorrente">
                      🔁
                    </span>
                  )}
                  {tx.isShared && (
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Casal
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  {formatDateBR(tx.date)} • {tx.category} {tx.paidBy ? `• ${tx.paidBy}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <p
                className={`text-xs md:text-sm font-black ${
                  tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {tx.type === 'receita' ? '+' : '-'} {formatCurrencyBRL(tx.amount)}
              </p>

              <div className="flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                {onEditTransaction && (
                  <button
                    onClick={() => onEditTransaction(tx)}
                    aria-label="Editar transação"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-purple-500/20 text-purple-300 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
                    title="Editar transação"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                )}
                <button
                  onClick={() => setDeletingTxId(tx.id)}
                  aria-label="Excluir transação"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
                  title="Excluir transação"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {scopedTransactions.length === 0 && (
          <div className="p-8 text-center bg-[#1c1833] rounded-2xl border border-purple-500/10 text-xs text-purple-300/60 space-y-2">
            <span className="material-symbols-outlined text-4xl text-purple-400">receipt_long</span>
            <p>Nenhuma transação encontrada.</p>
            <button
              onClick={onOpenNewTransaction}
              className="min-h-[44px] px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
            >
              Adicionar Primeira Transação
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
