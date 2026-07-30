import React from 'react';
import { UserProfile } from '../../types';

interface SavingsGoalsManagerProps {
  formData: UserProfile;
  newGoalTitle: string;
  setNewGoalTitle: (val: string) => void;
  newGoalDesc: string;
  setNewGoalDesc: (val: string) => void;
  newGoalTarget: string;
  setNewGoalTarget: (val: string) => void;
  newGoalCurrent: string;
  setNewGoalCurrent: (val: string) => void;
  handleAddSavingsGoal: () => void;
  handleRemoveSavingsGoal: (id: string) => void;
}

export const SavingsGoalsManager: React.FC<SavingsGoalsManagerProps> = ({
  formData,
  newGoalTitle,
  setNewGoalTitle,
  newGoalDesc,
  setNewGoalDesc,
  newGoalTarget,
  setNewGoalTarget,
  newGoalCurrent,
  setNewGoalCurrent,
  handleAddSavingsGoal,
  handleRemoveSavingsGoal,
}) => {
  return (
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
              placeholder="0,00"
              className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-purple-200/70 mb-1">Meta Final Objetivo (R$)</label>
            <input
              type="number"
              value={newGoalTarget}
              onChange={(e) => setNewGoalTarget(e.target.value)}
              placeholder="5.000,00"
              className="w-full px-3 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddSavingsGoal}
          className="px-4 py-2 min-h-[44px] bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
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
                    aria-label={`Excluir meta ${goal.title}`}
                    className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
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
  );
};
