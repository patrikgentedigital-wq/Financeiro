import React, { useState, useEffect } from 'react';
import { UserProfile, CategoryBudget, CustomCategory, SavingsGoal } from '../types';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
  saveCategoryBudgetToSupabase,
  updateUserProfileInSupabase,
} from '../lib/supabase';
import { EXPENSE_CATEGORIES } from '../data/categories';
import { isPWAInstallable, promptPWAInstall, isStandalonePWA } from '../utils/pwa';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onResetData: () => void;
  pendingSyncCount?: number;
}

import { ProfileSettings } from './settings/ProfileSettings';
import { CustomCategoriesManager } from './settings/CustomCategoriesManager';
import { SavingsGoalsManager } from './settings/SavingsGoalsManager';
import { BudgetSettings } from './settings/BudgetSettings';

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onResetData,
  pendingSyncCount = 0,
}) => {
  const [formData, setFormData] = useState<UserProfile>({
    ...user,
    savingsGoals: user.savingsGoals?.length
      ? user.savingsGoals
      : user.savingsGoal
      ? [user.savingsGoal]
      : [
          {
            id: '1',
            title: 'Viagem em Casal',
            description: 'Férias do Casal',
            currentAmount: 3200,
            targetAmount: 5000,
          },
        ],
    customCategories: user.customCategories || [],
  });

  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      const existing = user.categoryBudgets?.find((b) => b.category.toLowerCase() === cat.name.toLowerCase());
      map[cat.name] = existing ? String(existing.limit) : '0';
    });
    return map;
  });

  // Novos campos para criar categoria customizada
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newCatType, setNewCatType] = useState<'despesa' | 'receita'>('despesa');

  // Novos campos para criar nova meta de poupança
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [canInstall, setCanInstall] = useState(isPWAInstallable());
  const [isStandalone, setIsStandalone] = useState(isStandalonePWA());

  useEffect(() => {
    setFormData({
      ...user,
      savingsGoals: user.savingsGoals?.length
        ? user.savingsGoals
        : user.savingsGoal
        ? [user.savingsGoal]
        : [
            {
              id: '1',
              title: 'Viagem em Casal',
              description: 'Férias do Casal',
              currentAmount: 3200,
              targetAmount: 5000,
            },
          ],
      customCategories: user.customCategories || [],
    });

    const map: Record<string, string> = {};
    EXPENSE_CATEGORIES.forEach((cat) => {
      const existing = user.categoryBudgets?.find((b) => b.category.toLowerCase() === cat.name.toLowerCase());
      map[cat.name] = existing ? String(existing.limit) : '0';
    });
    setCategoryBudgets(map);
    setCanInstall(isPWAInstallable());
    setIsStandalone(isStandalonePWA());
  }, [user]);

  const handleBudgetChange = (catName: string, val: string) => {
    setCategoryBudgets((prev) => ({ ...prev, [catName]: val }));
  };

  const handleInstallPWA = async () => {
    const res = await promptPWAInstall();
    if (res) {
      setIsStandalone(true);
    }
  };

  // Upload de Foto de Perfil Local do Dispositivo
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Por favor, escolha uma imagem com menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setFormData((prev) => ({ ...prev, avatarUrl: base64Url }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Adicionar Categoria Customizada
  const handleAddCustomCategory = () => {
    if (!newCatName.trim()) return;

    const newCat: CustomCategory = {
      id: `custom-cat-${Date.now()}`,
      name: newCatName.trim(),
      icon: newCatIcon.trim() || '🏷️',
      type: newCatType,
    };

    setFormData((prev) => ({
      ...prev,
      customCategories: [...(prev.customCategories || []), newCat],
    }));

    setNewCatName('');
    setNewCatIcon('🏷️');
  };

  // Remover Categoria Customizada
  const handleRemoveCustomCategory = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customCategories: (prev.customCategories || []).filter((c) => c.id !== id),
    }));
  };

  // Adicionar Nova Meta de Poupança
  const handleAddSavingsGoal = () => {
    if (!newGoalTitle.trim() || !newGoalTarget) return;

    const targetVal = Math.max(0, parseFloat(newGoalTarget) || 0);
    const currentVal = Math.max(0, parseFloat(newGoalCurrent) || 0);

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim() || 'Objetivo financeiro',
      targetAmount: targetVal,
      currentAmount: currentVal,
    };

    setFormData((prev) => ({
      ...prev,
      savingsGoals: [...(prev.savingsGoals || []), newGoal],
    }));

    setNewGoalTitle('');
    setNewGoalDesc('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
  };

  // Remover Meta de Poupança
  const handleRemoveSavingsGoal = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      savingsGoals: (prev.savingsGoals || []).filter((g) => g.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

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

    // 1. Salvar no Supabase Auth Metadata se estiver configurado
    if (isSupabaseConfigured) {
      await updateUserProfileInSupabase(updatedUser);
    }

    // 2. Atualizar estado local da aplicação e localStorage
    onUpdateUser(updatedUser);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400 text-3xl">settings</span>
          Configurações da Conta
        </h1>
        <p className="text-xs text-purple-200/70 font-medium mt-1">
          Ajustes do perfil do casal, categorias customizadas, metas de poupança e status PWA/offline
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 animate-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-lg text-emerald-400">check_circle</span>
          <span>Configurações, metas e categorias salvas com sucesso no Supabase e no dispositivo!</span>
        </div>
      )}

      {/* PWA App Status & Manual Install Card */}
      <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-[#120f24] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900/40 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <span className="material-symbols-outlined text-lg">install_mobile</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Aplicativo PWA e Modo Offline</h3>
              <p className="text-[11px] text-gray-400">
                {isStandalone
                  ? '📱 Executando em modo Aplicativo Standalone'
                  : '💻 Executando no Navegador Web'}
              </p>
            </div>
          </div>

          {canInstall && !isStandalone && (
            <button
              type="button"
              onClick={handleInstallPWA}
              className="px-4 py-2 min-h-[44px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Instalar App</span>
            </button>
          )}
        </div>

        {/* Fila Outbox status */}
        <div className="p-3.5 bg-[#1c1833] rounded-2xl border border-purple-500/10 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-base">sync</span>
            <span className="text-purple-200/90 font-medium">Fila Outbox Offline:</span>
          </div>
          {pendingSyncCount > 0 ? (
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⏳ {pendingSyncCount} {pendingSyncCount === 1 ? 'transação pendente' : 'transações pendentes'}
            </span>
          ) : (
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✅ Todos os lançamentos sincronizados
            </span>
          )}
        </div>
      </div>

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
        {/* Profile Card & Avatar Uploader */}
        <ProfileSettings
          formData={formData}
          setFormData={setFormData}
          handleImageFileUpload={handleImageFileUpload}
        />

        {/* CATEGORIAS CUSTOMIZADAS */}
        <CustomCategoriesManager
          formData={formData}
          newCatName={newCatName}
          setNewCatName={setNewCatName}
          newCatIcon={newCatIcon}
          setNewCatIcon={setNewCatIcon}
          newCatType={newCatType}
          setNewCatType={setNewCatType}
          handleAddCustomCategory={handleAddCustomCategory}
          handleRemoveCustomCategory={handleRemoveCustomCategory}
        />

        {/* MÚLTIPLAS METAS DE POUPANÇA */}
        <SavingsGoalsManager
          formData={formData}
          newGoalTitle={newGoalTitle}
          setNewGoalTitle={setNewGoalTitle}
          newGoalDesc={newGoalDesc}
          setNewGoalDesc={setNewGoalDesc}
          newGoalTarget={newGoalTarget}
          setNewGoalTarget={setNewGoalTarget}
          newGoalCurrent={newGoalCurrent}
          setNewGoalCurrent={setNewGoalCurrent}
          handleAddSavingsGoal={handleAddSavingsGoal}
          handleRemoveSavingsGoal={handleRemoveSavingsGoal}
        />

        {/* ORÇAMENTO POR CATEGORIA */}
        <BudgetSettings
          categoryBudgets={categoryBudgets}
          handleBudgetChange={handleBudgetChange}
          EXPENSE_CATEGORIES={EXPENSE_CATEGORIES}
        />

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
            className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            Restaurar Dados Originais
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 min-h-[44px] rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-900/40 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
