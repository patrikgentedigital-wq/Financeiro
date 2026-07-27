import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, UserProfile } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories';
import { FormInput } from './common/FormInput';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (newTx: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  initialTx?: Transaction | null;
  user?: UserProfile;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  initialTx,
  user,
}) => {
  const partner1 = user?.partner1Name || 'Parceiro 1';
  const partner2 = user?.partner2Name || 'Parceiro 2';

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('despesa');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [isShared, setIsShared] = useState(true);
  const [paidBy, setPaidBy] = useState('Casal');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    if (initialTx) {
      setDate(initialTx.date || today);
      setDescription(initialTx.description || '');
      setAmount(String(initialTx.amount || ''));
      setType(initialTx.type || 'despesa');
      setCategory(initialTx.category || EXPENSE_CATEGORIES[0].name);
      setIsShared(initialTx.isShared ?? true);
      setPaidBy(initialTx.paidBy || 'Casal');
    } else {
      setDate(today);
      setDescription('');
      setAmount('');
      setType('despesa');
      setCategory(EXPENSE_CATEGORIES[0].name);
      setIsShared(true);
      setPaidBy('Casal');
    }
  }, [initialTx, isOpen]);

  if (!isOpen) return null;

  const currentCategories = type === 'despesa' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCats = newType === 'despesa' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    setCategory(newCats[0].name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = Math.abs(parseFloat(amount.replace(',', '.')));
    if (!description.trim()) {
      setFormError('Por favor, digite uma descrição para a transação.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Por favor, informe um valor numérico válido maior que zero.');
      return;
    }

    if (initialTx && onUpdateTransaction) {
      onUpdateTransaction({
        ...initialTx,
        date: date || today,
        description: description.trim(),
        amount: parsedAmount,
        type,
        category,
        isShared,
        paidBy: paidBy || 'Casal',
      });
    } else {
      onAddTransaction({
        date: date || today,
        description: description.trim(),
        amount: parsedAmount,
        type,
        category,
        isShared,
        paidBy: paidBy || 'Casal',
      });
    }

    // Reset fields
    setDescription('');
    setAmount('');
    setDate(today);
    setIsShared(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 bg-[#131024]/95 shadow-2xl relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <span className="material-symbols-outlined text-xl">
                {initialTx ? 'edit' : 'add_circle'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialTx ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <p className="text-xs text-purple-200/60">
                {initialTx ? 'Atualize os dados da movimentação' : 'Registre uma receita ou despesa do casal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-xl hover:bg-purple-500/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-rose-400">error</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo Selector */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-[#120f24] rounded-2xl border border-purple-500/20">
            <button
              type="button"
              onClick={() => handleTypeChange('despesa')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                type === 'despesa'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">arrow_downward</span>
              <span>Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('receita')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                type === 'receita'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">arrow_upward</span>
              <span>Receita</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Descrição *"
              icon="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado"
              required
            />

            <FormInput
              label="Valor (R$) *"
              icon="payments"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Data *"
              icon="calendar_today"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-3.5 pr-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {currentCategories.map((cat) => (
                  <option key={cat.id} value={cat.name} className="bg-[#120f24]">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Divisão & Quem Paga */}
          <div className="p-4 rounded-2xl bg-[#120f24] border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-200">Gasto do Casal (Compartilhado)?</span>
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isShared ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isShared ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Quem Pagou / É Responsável?
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full pl-3.5 pr-4 py-2 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs font-medium text-white outline-none"
              >
                <option value="Casal">Casal (Dividido)</option>
                <option value={partner1}>{partner1}</option>
                <option value={partner2}>{partner2}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-200 hover:bg-purple-500/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-900/40 hover:opacity-95 transition-all cursor-pointer"
            >
              {initialTx ? 'Salvar Alterações' : 'Adicionar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
