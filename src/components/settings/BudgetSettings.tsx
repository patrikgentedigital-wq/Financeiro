import React from 'react';

interface BudgetSettingsProps {
  categoryBudgets: Record<string, string>;
  handleBudgetChange: (catName: string, val: string) => void;
  EXPENSE_CATEGORIES: any[];
}

export const BudgetSettings: React.FC<BudgetSettingsProps> = ({
  categoryBudgets,
  handleBudgetChange,
  EXPENSE_CATEGORIES,
}) => {
  return (
    <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
      <div className="border-b border-purple-500/20 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400">pie_chart</span>
          <div>
            <h3 className="text-base font-bold text-white">Orçamento por Categoria de Despesa</h3>
            <p className="text-xs text-purple-200/60">Defina o limite máximo mensal desejado para cada categoria</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {EXPENSE_CATEGORIES.map((cat) => (
          <div key={cat.id} className="p-3 bg-[#120f24] rounded-2xl border border-purple-500/20 space-y-1.5">
            <label className="block text-xs font-semibold text-purple-200 flex items-center gap-1.5">
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-purple-300/60 font-bold">
                R$
              </span>
              <input
                type="text"
                value={categoryBudgets[cat.name] || '0'}
                onChange={(e) => handleBudgetChange(cat.name, e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
