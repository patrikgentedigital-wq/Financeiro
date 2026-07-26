import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, UserProfile } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories';

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

  useEffect(() => {
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
    const parsedAmount = Math.abs(parseFloat(amount.replace(',', '.')));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor, preencha a descrição e um valor numérico válido maior que zero.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="glass-card rounded-3xl shadow-2xl border border-purple-500/20 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative bg-[#1c1833] text-white">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-900/30">
            <span className="material-symbols-outlined text-2xl">
              {initialTx ? 'edit_note' : 'add_card'}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {initialTx ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            <p className="text-xs text-purple-200/70 font-medium">
              {initialTx ? 'Atualize as informações do lançamento' : 'Cadastre um novo lançamento no Finanças do Casal'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo Selector */}
          <div className="grid grid-cols-2 gap-2 bg-[#120f24] p-1.5 rounded-2xl border border-purple-500/10">
            <button
              type="button"
              onClick={() => handleTypeChange('despesa')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                type === 'despesa'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">trending_down</span>
              <span>Despesa (-)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('receita')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                type === 'receita'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>Receita (+)</span>
            </button>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-purple-200/80 mb-1">
              Descrição do Lançamento
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel, Salário..."
              className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl font-medium text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl font-medium text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Data
              </label>
              <input
                type="date"
                min="2000-01-01"
                max="2099-12-31"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl font-medium text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl font-medium text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
              >
                {currentCategories.map((cat) => (
                  <option key={`${cat.type}-${cat.name}`} value={cat.name} className="bg-[#1c1833] text-white">
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quem pagou */}
            <div>
              <label className="block text-xs font-semibold text-purple-200/80 mb-1">
                Responsável / Pago por
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl font-medium text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
              >
                <option value={partner1} className="bg-[#1c1833] text-white">{partner1}</option>
                <option value={partner2} className="bg-[#1c1833] text-white">{partner2}</option>
                <option value="Casal" className="bg-[#1c1833] text-white">Ambos / Casal</option>
              </select>
            </div>
          </div>

          {/* Toggle Gasto do Casal */}
          <div className="p-3.5 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <span className="material-symbols-outlined text-purple-400 text-base">diversity_1</span>
                <span>Gasto do casal (Compartilhado)</span>
              </div>
              <p className="text-[11px] text-purple-200/60">
                Ative se esta despesa ou receita for dividida e relevante para ambos.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              {initialTx ? 'Salvar Alterações' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
