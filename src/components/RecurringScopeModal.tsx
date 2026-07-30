import React from 'react';
import { Transaction } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface RecurringScopeModalProps {
  isOpen: boolean;
  actionType: 'edit' | 'delete';
  transaction: Transaction | null;
  onConfirm: (scope: 'single' | 'future') => void;
  onCancel: () => void;
}

export const RecurringScopeModal: React.FC<RecurringScopeModalProps> = ({
  isOpen,
  actionType,
  transaction,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !transaction) return null;

  const modalRef = useFocusTrap(isOpen);

  const isDelete = actionType === 'delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-md glass-card p-6 md:p-8 rounded-3xl border border-purple-500/30 bg-[#131024]/95 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDelete
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {isDelete ? 'delete_sweep' : 'update'}
            </span>
          </div>
          <div className="space-y-1">
            <h2 id="modal-title" className="text-lg font-extrabold text-white tracking-tight">
              {isDelete ? 'Excluir Transação Recorrente' : 'Editar Transação Recorrente'}
            </h2>
            <p className="text-xs text-purple-200/70">
              "{transaction.description}" é uma transação recorrente. Como deseja aplicar esta alteração?
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onConfirm('single')}
            className="w-full p-4 min-h-[44px] rounded-2xl bg-[#1a1630] hover:bg-purple-500/20 border border-purple-500/20 text-left transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-purple-200">
                {isDelete ? 'Excluir apenas esta ocorrência' : 'Editar apenas esta ocorrência'}
              </span>
              <span className="material-symbols-outlined text-purple-400 text-base">event</span>
            </div>
            <p className="text-[11px] text-purple-200/50 mt-1">
              Afeta somente o registro da data {transaction.date}.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onConfirm('future')}
            className="w-full p-4 min-h-[44px] rounded-2xl bg-[#1c142b] hover:bg-rose-500/20 border border-amber-500/30 text-left transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 group-hover:text-white">
                {isDelete ? 'Excluir esta e as futuras ocorrências' : 'Editar esta e as futuras ocorrências'}
              </span>
              <span className="material-symbols-outlined text-amber-400 text-base">repeat_on</span>
            </div>
            <p className="text-[11px] text-purple-200/50 mt-1">
              Aplica a alteração a partir de {transaction.date} em diante.
            </p>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-200 hover:bg-purple-500/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
