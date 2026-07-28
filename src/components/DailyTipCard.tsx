import React, { useState, useMemo } from 'react';
import { Transaction, UserProfile, ViewMode } from '../types';

interface DailyTipCardProps {
  user?: UserProfile;
  transactions?: Transaction[];
  savingsGoal?: {
    id: string;
    title: string;
    description: string;
    currentAmount: number;
    targetAmount: number;
  };
  onNavigate?: (view: ViewMode) => void;
  onOpenTopUp?: () => void;
  onOpenNewTransaction?: () => void;
}

export interface TipItem {
  id: string;
  category: string;
  badgeColor: string;
  badgeBg: string;
  icon: string;
  title: string;
  description: string;
  impact?: string;
  actionText: string;
  actionType: 'navigate' | 'topup' | 'new_transaction';
  targetView?: ViewMode;
}

export const DailyTipCard: React.FC<DailyTipCardProps> = ({
  user,
  transactions = [],
  savingsGoal,
  onNavigate,
  onOpenTopUp,
  onOpenNewTransaction,
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Generate dynamic tips based on actual user context & transactions
  const tips: TipItem[] = useMemo(() => {
    const list: TipItem[] = [];

    // Calculate expense metrics from transactions
    const expenses = (transactions || []).filter((t) => t.type === 'despesa');
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });

    let highestCategory = '';
    let highestAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > highestAmount) {
        highestAmount = amt;
        highestCategory = cat;
      }
    });

    // Tip 1: Highest spending category alert
    if (highestCategory && highestAmount > 0) {
      const estimatedSaving = Math.round(highestAmount * 0.15);
      list.push({
        id: 'highest-category',
        category: 'Atenção aos Gastos',
        badgeColor: 'text-rose-400',
        badgeBg: 'bg-rose-950/60',
        icon: 'pie_chart',
        title: `Reduza gastos em ${highestCategory}`,
        description: `Sua maior categoria de despesas no período foi "${highestCategory}" com R$ ${highestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Tentar reduzir 15% trará mais alívio financeiro para o casal.`,
        impact: `Potencial de economia: R$ ${estimatedSaving.toLocaleString('pt-BR')}/mês`,
        actionText: 'Ver Transações',
        actionType: 'navigate',
        targetView: 'transactions',
      });
    }

    // Tip 2: Savings Goal progress boost
    if (savingsGoal) {
      const goalPercentage = Math.round((savingsGoal.currentAmount / savingsGoal.targetAmount) * 100);
      const remainingAmount = Math.max(0, savingsGoal.targetAmount - savingsGoal.currentAmount);

      if (goalPercentage < 100) {
        const weeklyDeposit = Math.round(remainingAmount / 8);
        list.push({
          id: 'savings-boost',
          category: 'Acelerador de Metas',
          badgeColor: 'text-indigo-300',
          badgeBg: 'bg-indigo-950/60',
          icon: 'savings',
          title: `Meta do Casal: "${savingsGoal.title}"!`,
          description: `Sua meta em dupla está em ${goalPercentage}%. Se guardaren R$ ${weeklyDeposit.toLocaleString('pt-BR')} por semana juntos, alcançarão o objetivo em poucas semanas.`,
          impact: `Restam R$ ${remainingAmount.toLocaleString('pt-BR')}`,
          actionText: 'Registrar Transação',
          actionType: 'new_transaction',
        });
      }
    }

    // Tip 3: Emergency reserve for couples
    const monthlyIncome = user?.monthlyIncomeGoal || 8000;
    const recommendedEmergencyFund = totalExpenses > 0 ? totalExpenses * 3 : monthlyIncome * 3;
    list.push({
      id: 'emergency-reserve',
      category: 'Reserva de Emergência',
      badgeColor: 'text-emerald-300',
      badgeBg: 'bg-emerald-950/60',
      icon: 'verified_user',
      title: 'Blindagem Financeira para Casais',
      description: `Especialistas recomendam manter de 3 a 6 meses de despesas salvas. Para o padrão do casal, o ideal é guardar aprox. R$ ${recommendedEmergencyFund.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`,
      impact: 'Tranquilidade e segurança para imprevistos',
      actionText: 'Ver Resumo Mensal',
      actionType: 'navigate',
      targetView: 'reports',
    });

    // Tip 4: 48-hour rule for non-essential purchases
    list.push({
      id: 'rule-48h',
      category: 'Consumo Consciente',
      badgeColor: 'text-amber-300',
      badgeBg: 'bg-amber-950/60',
      icon: 'timer',
      title: 'Apliquem a Regra das 48 Horas',
      description: 'Antes de realizar uma compra não essencial superior a R$ 100, conversem e aguardem 48 horas. Se a necessidade permanecer após 2 dias, façam a compra consciente.',
      impact: 'Economia estimada: ~R$ 300,00/mês no casal',
      actionText: 'Nova Transação',
      actionType: 'new_transaction',
    });

    return list;
  }, [transactions, savingsGoal, user]);

  const activeTip = tips[currentTipIndex % tips.length];

  const handleNextTip = () => {
    setFeedback(null);
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const handlePrevTip = () => {
    setFeedback(null);
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const handleAction = () => {
    if (activeTip.actionType === 'navigate' && activeTip.targetView && onNavigate) {
      onNavigate(activeTip.targetView);
    } else if (activeTip.actionType === 'topup' && onOpenTopUp) {
      onOpenTopUp();
    } else if (activeTip.actionType === 'new_transaction' && onOpenNewTransaction) {
      onOpenNewTransaction();
    }
  };

  const handleShareOrCopy = () => {
    const textToCopy = `💡 Dica Finanças do Casal: ${activeTip.title} - ${activeTip.description}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="glass-card rounded-3xl p-6 md:p-7 shadow-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-[#1c1833] to-[#120f24] relative overflow-hidden transition-all duration-300">
      {/* Background Icon */}
      <div className="absolute -bottom-6 -right-6 text-purple-500/5 pointer-events-none select-none">
        <span className="material-symbols-outlined text-[140px]">lightbulb</span>
      </div>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-900/40">
            <span className="material-symbols-outlined text-lg">lightbulb</span>
          </div>
          <div>
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
              Dica Inteligente do Casal
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              Sugestão financeira personalizada com base nas movimentações do casal
            </span>
          </div>
        </div>

        {/* Badge & Pagination Control */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border border-purple-500/20 ${activeTip.badgeBg} ${activeTip.badgeColor}`}
          >
            <span className="material-symbols-outlined text-xs">{activeTip.icon}</span>
            {activeTip.category}
          </span>

          <div className="flex items-center bg-[#120f24] border border-purple-500/20 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={handlePrevTip}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Dica anterior"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <span className="text-[11px] font-bold text-purple-200 px-1.5">
              {currentTipIndex + 1}/{tips.length}
            </span>
            <button
              onClick={handleNextTip}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Próxima dica"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 my-3 space-y-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {activeTip.title}
        </h3>

        <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-normal">
          {activeTip.description}
        </p>

        {activeTip.impact && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold mt-2">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>{activeTip.impact}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-purple-500/10 relative z-10 mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAction}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{activeTip.actionText}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          <button
            onClick={handleNextTip}
            className="px-3 py-2 bg-[#120f24] border border-purple-500/20 text-gray-300 hover:text-white hover:bg-white/10 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">shuffle</span>
            <span>Outra Dica</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {copiedSuccess && (
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <span className="material-symbols-outlined text-xs">check_circle</span> Copiada!
            </span>
          )}

          <button
            onClick={handleShareOrCopy}
            className="p-2 text-gray-400 hover:text-purple-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Copiar dica"
          >
            <span className="material-symbols-outlined text-lg">content_copy</span>
          </button>

          <div className="flex items-center gap-1 border-l border-purple-500/20 pl-2">
            <button
              onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                feedback === 'liked'
                  ? 'bg-emerald-950 text-emerald-400 font-bold'
                  : 'text-gray-400 hover:text-emerald-400 hover:bg-white/10'
              }`}
              title="Dica útil"
            >
              <span className="material-symbols-outlined text-lg">thumb_up</span>
            </button>
            <button
              onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                feedback === 'disliked'
                  ? 'bg-rose-950 text-rose-400 font-bold'
                  : 'text-gray-400 hover:text-rose-400 hover:bg-white/10'
              }`}
              title="Não achei relevante"
            >
              <span className="material-symbols-outlined text-lg">thumb_down</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
