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

// Avatares sugeridos pré-configurados
const PRESET_AVATARS = [
  { label: 'Casal Sorridente', url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=300' },
  { label: 'Casal Abraçado', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=300' },
  { label: 'Casal Pôr do Sol', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' },
  { label: 'Casal Viagem', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=300' },
];

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
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all cursor-pointer flex items-center gap-1.5"
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
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
          <h3 className="text-base font-bold text-white border-b border-purple-500/20 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">favorite</span>
            Perfil e Foto do Casal
          </h3>

          {/* Avatar Upload Section */}
          <div className="p-4 bg-[#120f24] rounded-2xl border border-purple-500/20 flex flex-col md:flex-row items-center gap-6">
            {/* Image Preview */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500/40 shadow-xl shadow-purple-900/30 bg-[#1c1833]">
                <img
                  src={formData.avatarUrl || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=300'}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <label
                htmlFor="avatar-file-input"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-90 border-2 border-[#120f24]"
                title="Alterar foto de perfil"
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
              />
            </div>

            {/* Avatar URL & Upload Controls */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-purple-400 text-sm">image</span>
                  <span>Foto de Perfil do Casal</span>
                </label>
                <label
                  htmlFor="avatar-file-input"
                  className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 text-xs font-bold rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  <span>Enviar Foto do Seu Dispositivo</span>
                </label>
              </div>

              <div>
                <input
                  type="text"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="Ou cole aqui um link (URL) da imagem..."
                  className="w-full px-4 py-2.5 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono text-[11px]"
                />
              </div>

              {/* Presets */}
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-semibold">Ou escolha uma foto sugerida:</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: preset.url })}
                      className={`flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        formData.avatarUrl === preset.url
                          ? 'border-purple-400 scale-105 shadow-md shadow-purple-500/50'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Nome de Exibição do Casal
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Alex & Sam"
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
                placeholder="Ex: Planejamento Financeiro Juntos"
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

        {/* CATEGORIAS CUSTOMIZADAS */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
          <div className="border-b border-purple-500/20 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400">category</span>
              <div>
                <h3 className="text-base font-bold text-white">Categorias Personalizadas</h3>
                <p className="text-xs text-purple-200/60">Crie novas categorias customizadas com ícones para os lançamentos</p>
              </div>
            </div>
          </div>

          {/* Form para adicionar nova categoria */}
          <div className="p-4 bg-[#120f24] rounded-2xl border border-purple-500/20 space-y-3">
            <h4 className="text-xs font-bold text-white">Nova Categoria Personalizada</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-purple-200/70 mb-1">Ícone / Emoji</label>
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="Ex: 🐱"
                  className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-purple-200/70 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Pets, Assinaturas..."
                  className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-200/70 mb-1">Tipo</label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as 'despesa' | 'receita')}
                  className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
                >
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCustomCategory}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Adicionar Categoria</span>
            </button>
          </div>

          {/* Lista de categorias customizadas criadas */}
          {formData.customCategories && formData.customCategories.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-purple-200">Suas Categorias Personalizadas:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {formData.customCategories.map((cat) => (
                  <div key={cat.id} className="p-3 bg-[#1c1833] rounded-2xl border border-purple-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{cat.name}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{cat.type}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomCategory(cat.id)}
                      className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Excluir categoria"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MÚLTIPLAS METAS DE POUPANÇA */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
          <div className="border-b border-purple-500/20 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400">savings</span>
              <div>
                <h3 className="text-base font-bold text-white">Múltiplas Metas de Poupança</h3>
                <p className="text-xs text-purple-200/60">Cadastre e acompanhe vários objetivos de economia em simultâneo</p>
              </div>
            </div>
          </div>

          {/* Form para adicionar nova meta */}
          <div className="p-4 bg-[#120f24] rounded-2xl border border-purple-500/20 space-y-3">
            <h4 className="text-xs font-bold text-white">Nova Meta de Poupança</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-purple-200/70 mb-1">Título da Meta</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Ex: Viagem de Férias, Carro Novo..."
                  className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-200/70 mb-1">Descrição</label>
                <input
                  type="text"
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  placeholder="Ex: Economia para Dezembro"
                  className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-200/70 mb-1">Valor Guardado Atual (R$)</label>
                <input
                  type="number"
                  value={newGoalCurrent}
                  onChange={(e) => setNewGoalCurrent(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-200/70 mb-1">Meta Final Objetivo (R$)</label>
                <input
                  type="number"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="5000.00"
                  className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSavingsGoal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Adicionar Meta</span>
            </button>
          </div>

          {/* Lista de Metas */}
          {formData.savingsGoals && formData.savingsGoals.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-purple-200">Suas Metas Cadastradas:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.savingsGoals.map((goal) => (
                  <div key={goal.id} className="p-4 bg-[#1c1833] rounded-2xl border border-purple-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">{goal.title}</h5>
                        <p className="text-[10px] text-gray-400">{goal.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSavingsGoal(goal.id)}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Excluir meta"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>

                    <div className="text-xs flex justify-between font-semibold text-purple-200">
                      <span>R$ {goal.currentAmount.toFixed(2)} de R$ {goal.targetAmount.toFixed(2)}</span>
                      <span className="text-emerald-400 font-bold">
                        {goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ORÇAMENTO POR CATEGORIA */}
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
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-900/40 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
