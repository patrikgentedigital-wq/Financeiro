import React from 'react';
import { ViewMode } from '../../types';
import { formatCurrencyBRL } from '../../data/categories';

interface CoupleBalanceCardProps {
  coupleBalance: {
    p1Name: string;
    p2Name: string;
    p1Paid: number;
    p2Paid: number;
    amountOwed: number;
    debtorName: string;
    creditorName: string;
    isSettled: boolean;
    hasNamesConfigured: boolean;
  };
  onNavigate: (view: ViewMode) => void;
  handleSettleBalance: () => void;
}

export const CoupleBalanceCard: React.FC<CoupleBalanceCardProps> = ({
  coupleBalance,
  onNavigate,
  handleSettleBalance,
}) => {
  return (
    <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-[#131024] to-[#1a1536] shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-purple-500/15 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
            <span className="material-symbols-outlined text-xl">handshake</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Acerto de Contas do Casal (50/50)</h3>
            <p className="text-xs text-purple-200/70">
              Divisão automática de despesas compartilhadas adiantadas por cada um
            </p>
          </div>
        </div>

        {coupleBalance.hasNamesConfigured && !coupleBalance.isSettled && (
          <button
            onClick={handleSettleBalance}
            className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>Quitar Saldo (R$ {coupleBalance.amountOwed.toFixed(2)})</span>
          </button>
        )}
      </div>

      {!coupleBalance.hasNamesConfigured ? (
        <div className="p-4 bg-[#1c1833] rounded-2xl border border-purple-500/10 flex items-center justify-between text-xs flex-wrap gap-3">
          <div className="flex items-center gap-2 text-amber-300">
            <span className="material-symbols-outlined text-lg">info</span>
            <span>Configure os nomes dos dois parceiros em Ajustes para ativar a apuração automática.</span>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="min-h-[44px] px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            Configurar Nomes
          </button>
        </div>
      ) : coupleBalance.isSettled ? (
        <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-300">
          <span className="material-symbols-outlined text-lg text-emerald-400">check_circle</span>
          <span>Contas do casal em dia! Nenhuma pendência financeira entre {coupleBalance.p1Name} e {coupleBalance.p2Name}.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#1c1833] rounded-2xl border border-purple-500/10 space-y-1">
            <p className="text-[11px] text-gray-400 font-semibold">{coupleBalance.p1Name} pagou adiantado:</p>
            <p className="text-lg font-bold text-purple-300">{formatCurrencyBRL(coupleBalance.p1Paid)}</p>
          </div>

          <div className="p-4 bg-[#1c1833] rounded-2xl border border-purple-500/10 space-y-1">
            <p className="text-[11px] text-gray-400 font-semibold">{coupleBalance.p2Name} pagou adiantado:</p>
            <p className="text-lg font-bold text-purple-300">{formatCurrencyBRL(coupleBalance.p2Paid)}</p>
          </div>

          <div className="p-4 bg-amber-950/40 rounded-2xl border border-amber-500/30 space-y-1 flex flex-col justify-center">
            <p className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Saldo Pendente:</p>
            <p className="text-base font-extrabold text-amber-200">
              <span className="text-white font-black">{coupleBalance.debtorName}</span> deve{' '}
              <span className="text-emerald-300 font-black">{formatCurrencyBRL(coupleBalance.amountOwed)}</span> a{' '}
              <span className="text-white font-black">{coupleBalance.creditorName}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
