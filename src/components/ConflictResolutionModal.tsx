import React from 'react';
import { Transaction } from '../types';
import { formatCurrencyBRL } from '../data/categories';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  localTx: Transaction | null;
  serverTx: Transaction | null;
  onKeepLocal: () => void;
  onUseServer: () => void;
  onCancel: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  localTx,
  serverTx,
  onKeepLocal,
  onUseServer,
  onCancel,
}) => {
  if (!isOpen || !localTx || !serverTx) return null;

  const modalRef = useFocusTrap(isOpen);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-lg glass-card p-6 md:p-8 rounded-3xl border border-amber-500/30 bg-[#131024]/95 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <span className="material-symbols-outlined text-2xl">sync_problem</span>
          </div>
          <div className="space-y-1">
            <h2 id="modal-title" className="text-lg font-extrabold text-white tracking-tight">
              Conflito de Edição Simultânea (OCC)
            </h2>
            <p className="text-xs text-purple-200/70">
              Esta transação foi alterada pelo seu parceiro enquanto você a editava. Escolha qual versão deseja manter.
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Versão Local */}
          <div className="p-4 rounded-2xl bg-[#1a1630] border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300 pb-1 border-b border-purple-500/20">
              <span>Sua Edição Local</span>
              <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full font-mono">
                v{localTx.version || 1}
              </span>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-white truncate">{localTx.description}</p>
              <p className="text-amber-300 font-extrabold text-sm">
                {formatCurrencyBRL(localTx.amount)}
              </p>
              <p className="text-[11px] text-purple-200/60">Categoria: {localTx.category}</p>
              <p className="text-[11px] text-purple-200/60">Tipo: {localTx.type}</p>
            </div>
          </div>

          {/* Versão do Servidor */}
          <div className="p-4 rounded-2xl bg-[#1c142b] border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 pb-1 border-b border-amber-500/20">
              <span>Versão do Servidor</span>
              <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-mono text-amber-300">
                v{serverTx.version || 1}
              </span>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-white truncate">{serverTx.description}</p>
              <p className="text-emerald-400 font-extrabold text-sm">
                {formatCurrencyBRL(serverTx.amount)}
              </p>
              <p className="text-[11px] text-purple-200/60">Categoria: {serverTx.category}</p>
              <p className="text-[11px] text-purple-200/60">Tipo: {serverTx.type}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-200 hover:bg-purple-500/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onUseServer}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl bg-[#241e3d] text-amber-300 hover:bg-amber-500/20 text-xs font-bold border border-amber-500/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            Usar Versão do Servidor
          </button>
          <button
            type="button"
            onClick={onKeepLocal}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95 text-xs font-bold shadow-lg shadow-purple-900/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            Manter Minha Edição
          </button>
        </div>
      </div>
    </div>
  );
};
