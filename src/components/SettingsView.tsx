import React, { useState, useEffect } from 'react';
import { UserProfile, CategoryBudget } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured, saveCategoryBudgetToSupabase } from '../lib/supabase';
import { EXPENSE_CATEGORIES } from '../data/categories';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onResetData,
}) => {
  const [formData, setFormData] = useState<UserProfile>({
    ...user,
    savingsGoal: user.savingsGoal || {
      id: '1',
      title: 'Viagem em Casal',
      description: 'Férias do Casal',
      currentAmount: 3200,
      targetAmount: 5000,
    },
  });

  // State for Category Budgets
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      const existing = user.categoryBudgets?.find((b) => b.category.toLowerCase() === cat.name.toLowerCase());
      map[cat.name] = existing ? String(existing.limit) : '0';
    });
    return map;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData({
      ...user,
      savingsGoal: user.savingsGoal || {
        id: '1',
        title: 'Viagem em Casal',
        description: 'Férias do Casal',
        currentAmount: 3200,
        targetAmount: 5000,
      },
    });

    const map: Record<string, string> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      const existing = user.categoryBudgets?.find((b) => b.category.toLowerCase() === cat.name.toLowerCase());
      map[cat.name] = existing ? String(existing.limit) : '0';
    });
    setCategoryBudgets(map);
  }, [user]);

  const handleBudgetChange = (catName: string, val: string) => {
    setCategoryBudgets((prev) => ({ ...prev, [catName]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Map Category Budgets to list
    const updatedBudgetsList: CategoryBudget[] = [];
    for (const cat of EXPENSE_CATEGORIES) {
      const limitVal = Math.max(0, parseFloat((categoryBudgets[cat.name] || '0').replace(',', '.')) || 0);
      if (limitVal > 0) {
        updatedBudgetsList.push({ category: cat.name, limit: limitVal });
        if (isSupabaseConfigured) {
          await saveCategoryBudgetToSupabase(cat.name, limitVal);
        }
      }
    }

    const updatedUser: UserProfile = {
      ...formData,
      categoryBudgets: updatedBudgetsList,
    };

    onUpdateUser(updatedUser);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400 text-3xl">settings</span>
          Configurações da Conta
        </h1>
        <p className="text-xs text-purple-200/70 font-medium mt-1">
          Ajustes de perfil do casal, limites por categoria e integração com Supabase
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Alterações salvas com sucesso!</span>
        </div>
      )}

      {/* Supabase Integration Info Card */}
      <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-[#120f24] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900/40 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <span className="material-symbols-outlined text-lg">database</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Integração Supabase</h3>
              <p className="text-[11px] text-gray-400">
                {isSupabaseConfigured
                  ? '🟢 Sincronização em nuvem ativa'
                  : '🟡 Operando em modo de armazenamento local'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
              isSupabaseConfigured
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
            }`}
          >
            {isSupabaseConfigured ? 'Conectado' : 'Local Fallback'}
          </span>
        </div>

        <div className="p-3.5 bg-[#1c1833] rounded-2xl border border-purple-500/10 text-xs text-purple-200/80 space-y-2">
          <p className="font-semibold text-purple-300">Constantes de conexão configuradas:</p>
          <div className="font-mono text-[11px] space-y-1 bg-[#0f0c1b] p-3 rounded-xl border border-purple-500/10 text-gray-300 overflow-x-auto">
            <div><span className="text-purple-400 font-bold">SUPABASE_URL</span> = '{SUPABASE_URL}'</div>
            <div><span className="text-purple-400 font-bold">SUPABASE_ANON_KEY</span> = '{SUPABASE_ANON_KEY !== 'SUA_ANON_KEY_AQUI' ? '••••••••••••••••' : SUPABASE_ANON_KEY}'</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
          <h3 className="text-base font-bold text-white border-b border-purple-500/20 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">favorite</span>
            Perfil do Casal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Nome de Exibição do Casal
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Subtítulo do Perfil
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Nome do Parceiro 1
              </label>
              <input
                type="text"
                value={formData.partner1Name || ''}
                onChange={(e) => setFormData({ ...formData, partner1Name: e.target.value })}
                placeholder="Ex: Alex"
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Nome do Parceiro 2
              </label>
              <input
                type="text"
                value={formData.partner2Name || ''}
                onChange={(e) => setFormData({ ...formData, partner2Name: e.target.value })}
                placeholder="Ex: Sam"
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ORÇAMENTO POR CATEGORIA (Novo painel) */}
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
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Goals Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
          <h3 className="text-base font-bold text-white border-b border-purple-500/20 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">flag</span>
            Metas Globais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Orçamento de Despesas Global (R$)
              </label>
              <input
                type="number"
                value={formData.totalBudgetGoal}
                onChange={(e) => setFormData({ ...formData, totalBudgetGoal: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Meta de Receita Mensal (R$)
              </label>
              <input
                type="number"
                value={formData.monthlyIncomeGoal}
                onChange={(e) => setFormData({ ...formData, monthlyIncomeGoal: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onResetData}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
          >
            Restaurar Dados Originais
          </button>

          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-900/40 hover:opacity-95 transition-all cursor-pointer"
          >
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};
