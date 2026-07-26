import React, { useState } from 'react';
import { UserProfile } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../lib/supabase';

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
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
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
          Ajustes de perfil do casal, metas e integração com banco de dados Supabase
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
          <p className="text-[11px] text-gray-400">
            Para sincronizar seus dados online no Supabase, configure a variável de ambiente ou edite <code className="text-purple-300 font-mono">/src/lib/supabase.ts</code>.
          </p>
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
                Nome do Casal
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                E-mail do Casal
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
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

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Subtítulo do Aplicativo
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
                URL da Foto de Perfil (Avatar)
              </label>
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Goals & Budget Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
          <h3 className="text-base font-bold text-white border-b border-purple-500/20 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">flag</span>
            Metas e Orçamento Mensal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Orçamento Teto de Despesas do Mês (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totalBudgetGoal}
                onChange={(e) => setFormData({ ...formData, totalBudgetGoal: Math.abs(parseFloat(e.target.value) || 0) })}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Limite máximo planejado para gastos no mês</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Meta de Receita Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monthlyIncomeGoal}
                onChange={(e) => setFormData({ ...formData, monthlyIncomeGoal: Math.abs(parseFloat(e.target.value) || 0) })}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Meta conjunta de entradas de receitas</p>
            </div>
          </div>
        </div>

        {/* Savings Goal Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
          <h3 className="text-base font-bold text-white border-b border-purple-500/20 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">savings</span>
            Meta de Economia em Dupla
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Título da Meta de Economia
              </label>
              <input
                type="text"
                value={formData.savingsGoal?.title || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    savingsGoal: {
                      id: formData.savingsGoal?.id || '1',
                      description: formData.savingsGoal?.description || 'Objetivo do Casal',
                      currentAmount: formData.savingsGoal?.currentAmount || 0,
                      title: e.target.value,
                      targetAmount: formData.savingsGoal?.targetAmount || 5000,
                    },
                  })
                }
                placeholder="Ex: Viagem de Férias, Reserva da Casa"
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Valor Alvo da Meta (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.savingsGoal?.targetAmount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    savingsGoal: {
                      id: formData.savingsGoal?.id || '1',
                      title: formData.savingsGoal?.title || 'Meta do Casal',
                      description: formData.savingsGoal?.description || 'Objetivo do Casal',
                      currentAmount: formData.savingsGoal?.currentAmount || 0,
                      targetAmount: Math.abs(parseFloat(e.target.value) || 0),
                    },
                  })
                }
                placeholder="Ex: 5000"
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja restaurar todos os dados iniciais do Finanças do Casal?')) {
                onResetData();
              }
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 font-bold text-xs hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            Restaurar Dados Iniciais
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-900/40 hover:opacity-95 transition-all cursor-pointer active:scale-95"
          >
            Salvar Perfil
          </button>
        </div>
      </form>
    </div>
  );
};
