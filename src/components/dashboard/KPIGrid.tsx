import React from 'react';
import { UserProfile } from '../../types';
import { formatCurrencyBRL } from '../../data/categories';

interface KPIGridProps {
  currentMonthTotals: {
    income: number;
    expenses: number;
    balance: number;
    savingsRate: number;
  };
  user: UserProfile;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ currentMonthTotals, user }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Total Renda */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-[#16122c] to-[#120f24] hover:border-purple-500/40 transition-all shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-200/70 tracking-wide uppercase">Receita Total</span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <span className="material-symbols-outlined text-xl">arrow_upward</span>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight break-words">
            {formatCurrencyBRL(currentMonthTotals.income)}
          </p>
          <p className="text-[11px] text-purple-200/70 mt-1">
            Meta Mensal: <span className="font-bold text-white">{formatCurrencyBRL(user.monthlyIncomeGoal || 8000)}</span>
          </p>
        </div>
      </div>

      {/* Total Despesas */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-[#16122c] to-[#120f24] hover:border-purple-500/40 transition-all shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-200/70 tracking-wide uppercase">Despesas Totais</span>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <span className="material-symbols-outlined text-xl">arrow_downward</span>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl md:text-3xl font-black text-rose-400 tracking-tight break-words">
            {formatCurrencyBRL(currentMonthTotals.expenses)}
          </p>
          <p className="text-[11px] text-purple-200/70 mt-1">
            Teto de Orçamento: <span className="font-bold text-white">{formatCurrencyBRL(user.totalBudgetGoal || 5000)}</span>
          </p>
        </div>
      </div>

      {/* Saldo Geral */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-[#16122c] to-[#120f24] hover:border-purple-500/40 transition-all shadow-lg sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-200/70 tracking-wide uppercase">Saldo Líquido</span>
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              currentMonthTotals.balance >= 0
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {currentMonthTotals.balance >= 0 ? 'trending_up' : 'trending_down'}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <p
            className={`text-2xl md:text-3xl font-black tracking-tight break-words ${
              currentMonthTotals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrencyBRL(currentMonthTotals.balance)}
          </p>
          <p className="text-[11px] text-purple-200/70 mt-1">
            Taxa de Economia: <span className="font-bold text-white">{currentMonthTotals.savingsRate}%</span>
          </p>
        </div>
      </div>
    </div>
  );
};
