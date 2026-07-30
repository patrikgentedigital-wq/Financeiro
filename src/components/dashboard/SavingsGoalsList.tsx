import React from 'react';
import { SavingsGoal, ViewMode } from '../../types';
import { formatCurrencyBRL } from '../../data/categories';

interface SavingsGoalsListProps {
  savingsGoalsList: SavingsGoal[];
  onNavigate: (view: ViewMode) => void;
}

export const SavingsGoalsList: React.FC<SavingsGoalsListProps> = ({ savingsGoalsList, onNavigate }) => {
  return (
    <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 space-y-4">
      <div className="flex items-center justify-between border-b border-purple-500/15 pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400 text-2xl">savings</span>
          <div>
            <h3 className="text-base font-bold text-white">Metas de Poupança do Casal</h3>
            <p className="text-xs text-gray-400">Progresso dos objetivos de economia e investimentos</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="min-h-[44px] text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b] p-1 rounded"
        >
          <span>Gerenciar Metas</span>
          <span className="material-symbols-outlined text-sm">settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savingsGoalsList.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          return (
            <div key={goal.id} className="p-4 rounded-2xl bg-[#1c1833] border border-purple-500/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>{goal.title}</span>
                  </h4>
                  <p className="text-[11px] text-gray-400">{goal.description}</p>
                </div>
                <span className="font-extrabold text-emerald-400 text-sm">{percent}%</span>
              </div>

              <div className="w-full h-3 bg-[#0f0c1b] rounded-full overflow-hidden p-0.5 border border-purple-500/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-[11px] text-gray-300 font-medium">
                Guardado <span className="font-bold text-emerald-400">{formatCurrencyBRL(goal.currentAmount)}</span> de{' '}
                <span className="font-bold text-white">{formatCurrencyBRL(goal.targetAmount)}</span> pretendidos.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
