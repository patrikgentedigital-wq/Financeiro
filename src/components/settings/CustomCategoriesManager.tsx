import React from 'react';
import { UserProfile } from '../../types';

interface CustomCategoriesManagerProps {
  formData: UserProfile;
  newCatName: string;
  setNewCatName: (val: string) => void;
  newCatIcon: string;
  setNewCatIcon: (val: string) => void;
  newCatType: 'despesa' | 'receita';
  setNewCatType: (val: 'despesa' | 'receita') => void;
  handleAddCustomCategory: () => void;
  handleRemoveCustomCategory: (id: string) => void;
}

export const CustomCategoriesManager: React.FC<CustomCategoriesManagerProps> = ({
  formData,
  newCatName,
  setNewCatName,
  newCatIcon,
  setNewCatIcon,
  newCatType,
  setNewCatType,
  handleAddCustomCategory,
  handleRemoveCustomCategory,
}) => {
  return (
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
          className="px-4 py-2 min-h-[44px] bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
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
                  aria-label={`Excluir categoria ${cat.name}`}
                  className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
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
  );
};
