import React, { useState, useMemo, Suspense } from 'react';
import { Transaction, UserProfile, ViewMode, SavingsGoal } from '../types';
import { DailyTipCard } from './DailyTipCard';
import { formatCurrencyBRL, formatDateBR } from '../data/categories';
import { generateMonthlyPDFReport } from '../utils/pdfExport';
import {
  calculateFinancialTotals,
  getCategoryBreakdown,
  calculateCategoryBudgetProgress,
  calculateCoupleBalance,
} from '../utils/calculations';

// Dynamic Lazy Import for Recharts PieChart component
const DashboardPieChart = React.lazy(() =>
  import('./DashboardPieChart').then((m) => ({ default: m.DashboardPieChart }))
);

interface DashboardViewProps {
  user: UserProfile;
  transactions: Transaction[];
  onNavigate: (view: ViewMode) => void;
  onOpenNewTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  transactions,
  onNavigate,
  onOpenNewTransaction,
  onDeleteTransaction,
  onEditTransaction,
  onAddTransaction,
}) => {
  // Toggle for Couple View vs Individual View
  const [viewScope, setViewScope] = useState<'couple' | 'individual'>('couple');
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Dynamic filter for individual view
  const scopedTransactions = useMemo(() => {
    if (viewScope === 'individual') {
      const myName = (user.partner1Name || user.name || '').toLowerCase();
      return transactions.filter(
        (t) => !t.isShared || (t.paidBy && t.paidBy.toLowerCase() === myName)
      );
    }
    return transactions;
  }, [transactions, viewScope, user]);

  // Calculate current financial totals using central utility
  const currentMonthTotals = useMemo(() => {
    return calculateFinancialTotals(scopedTransactions);
  }, [scopedTransactions]);

  // Acerto de contas do casal (divisão 50/50)
  const coupleBalance = useMemo(() => {
    return calculateCoupleBalance(scopedTransactions, user.partner1Name, user.partner2Name);
  }, [scopedTransactions, user.partner1Name, user.partner2Name]);

  // Múltiplas Metas de Poupança (com migração retrocompatível do formato antigo)
  const savingsGoalsList = useMemo<SavingsGoal[]>(() => {
    if (user.savingsGoals && user.savingsGoals.length > 0) {
      return user.savingsGoals;
    }
    if (user.savingsGoal) {
      return [user.savingsGoal];
    }
    return [
      {
        id: '1',
        title: 'Viagem em Casal',
        description: 'Férias do Casal',
        currentAmount: 3200,
        targetAmount: 5000,
      },
    ];
  }, [user.savingsGoals, user.savingsGoal]);

  // Spending by category data for PieChart
  const categoryChartData = useMemo(() => {
    return getCategoryBreakdown(scopedTransactions, 'despesa');
  }, [scopedTransactions]);

  // Category Budgets Progress Calculation
  const categoryBudgetItems = useMemo(() => {
    return calculateCategoryBudgetProgress(scopedTransactions, user.categoryBudgets || []);
  }, [scopedTransactions, user.categoryBudgets]);

  // Export current month PDF report
  const handleExportPDF = () => {
    const currentMonthLabel = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    generateMonthlyPDFReport({
      monthName: currentMonthLabel.charAt(0).toUpperCase() + currentMonthLabel.slice(1),
      transactions: scopedTransactions,
      coupleName: user.name,
    });
  };

  const confirmDelete = (id: string) => {
    onDeleteTransaction(id);
    setDeletingTxId(null);
  };

  // Quitar Saldo do Casal
  const handleSettleBalance = () => {
    if (!onAddTransaction || coupleBalance.isSettled || !coupleBalance.hasNamesConfigured) return;

    onAddTransaction({
      date: new Date().toISOString().split('T')[0],
      description: `Acerto de Contas do Casal (Quitação ${coupleBalance.debtorName} ➔ ${coupleBalance.creditorName})`,
      amount: coupleBalance.amountOwed,
      type: 'despesa',
      category: 'Ajustes',
      isShared: false,
      paidBy: coupleBalance.debtorName,
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Olá, {user.name} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {viewScope === 'couple' ? 'Modo Casal' : 'Visão Individual'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-purple-200/70 mt-1">
            Aqui está o resumo financeiro das suas contas em tempo real.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Toggle View Scope */}
          <div className="bg-[#120f24] p-1 rounded-2xl border border-purple-500/20 flex items-center gap-1">
            <button
              onClick={() => setViewScope('couple')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewScope === 'couple'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👫 Casal
            </button>
            <button
              onClick={() => setViewScope('individual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewScope === 'individual'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👤 Meus Gastos
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-[#1c1833] hover:bg-[#252044] text-purple-200 border border-purple-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Exportar Relatório Mensal em PDF"
          >
            <span className="material-symbols-outlined text-base text-purple-400">picture_as_pdf</span>
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* CARD DE ACERTO DE CONTAS DO CASAL ("QUEM DEVE QUANTO") */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-[#131024] to-[#1a1536] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-purple-500/15 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <span className="material-symbols-outlined text-xl">handshake</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Acerto de Contas do Casal (50/50)</h3>
              <p className="text-xs text-purple-200/70">
                Divisão automática de despesas compartilhadas adiantadas por cada um
              </p>
            </div>
          </div>

          {coupleBalance.hasNamesConfigured && !coupleBalance.isSettled && (
            <button
              onClick={handleSettleBalance}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Quitar Saldo (R$ {coupleBalance.amountOwed.toFixed(2)})</span>
            </button>
          )}
        </div>

        {!coupleBalance.hasNamesConfigured ? (
          <div className="p-4 bg-[#1c1833] rounded-2xl border border-purple-500/10 flex items-center justify-between text-xs flex-wrap gap-3">
            <div className="flex items-center gap-2 text-amber-300">
              <span className="material-symbols-outlined text-lg">info</span>
              <span>Configure os nomes dos dois parceiros em Ajustes para ativar a apuração automática.</span>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Configurar Nomes
            </button>
          </div>
        ) : coupleBalance.isSettled ? (
          <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-300">
            <span className="material-symbols-outlined text-lg text-emerald-400">check_circle</span>
            <span>Contas do casal em dia! Nenhuma pendência financeira entre {coupleBalance.p1Name} e {coupleBalance.p2Name}.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#1c1833] rounded-2xl border border-purple-500/10 space-y-1">
              <p className="text-[11px] text-gray-400 font-semibold">{coupleBalance.p1Name} pagou adiantado:</p>
              <p className="text-lg font-bold text-purple-300">{formatCurrencyBRL(coupleBalance.p1Paid)}</p>
            </div>

            <div className="p-4 bg-[#1c1833] rounded-2xl border border-purple-500/10 space-y-1">
              <p className="text-[11px] text-gray-400 font-semibold">{coupleBalance.p2Name} pagou adiantado:</p>
              <p className="text-lg font-bold text-purple-300">{formatCurrencyBRL(coupleBalance.p2Paid)}</p>
            </div>

            <div className="p-4 bg-amber-950/40 rounded-2xl border border-amber-500/30 space-y-1 flex flex-col justify-center">
              <p className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Saldo Pendente:</p>
              <p className="text-base font-extrabold text-amber-200">
                <span className="text-white font-black">{coupleBalance.debtorName}</span> deve{' '}
                <span className="text-emerald-300 font-black">{formatCurrencyBRL(coupleBalance.amountOwed)}</span> a{' '}
                <span className="text-white font-black">{coupleBalance.creditorName}</span>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main KPI Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Total Renda */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-[#16122c] to-[#120f24] hover:border-purple-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200/70 tracking-wide uppercase">Receita Total</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <span className="material-symbols-outlined text-xl">arrow_upward</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight break-words">
              {formatCurrencyBRL(currentMonthTotals.income)}
            </p>
            <p className="text-[11px] text-purple-200/70 mt-1">
              Meta Mensal: <span className="font-bold text-white">{formatCurrencyBRL(user.monthlyIncomeGoal || 8000)}</span>
            </p>
          </div>
        </div>

        {/* Total Despesas */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-[#16122c] to-[#120f24] hover:border-purple-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200/70 tracking-wide uppercase">Despesas Totais</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <span className="material-symbols-outlined text-xl">arrow_downward</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl md:text-3xl font-black text-rose-400 tracking-tight break-words">
              {formatCurrencyBRL(currentMonthTotals.expenses)}
            </p>
            <p className="text-[11px] text-purple-200/70 mt-1">
              Teto de Orçamento: <span className="font-bold text-white">{formatCurrencyBRL(user.totalBudgetGoal || 5000)}</span>
            </p>
          </div>
        </div>

        {/* Saldo Geral */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-[#16122c] to-[#120f24] hover:border-purple-500/40 transition-all shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200/70 tracking-wide uppercase">Saldo Líquido</span>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                currentMonthTotals.balance >= 0
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {currentMonthTotals.balance >= 0 ? 'trending_up' : 'trending_down'}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <p
              className={`text-2xl md:text-3xl font-black tracking-tight break-words ${
                currentMonthTotals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrencyBRL(currentMonthTotals.balance)}
            </p>
            <p className="text-[11px] text-purple-200/70 mt-1">
              Taxa de Economia: <span className="font-bold text-white">{currentMonthTotals.savingsRate}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* MÚLTIPLAS METAS DE POUPANÇA */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 space-y-4">
        <div className="flex items-center justify-between border-b border-purple-500/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-2xl">savings</span>
            <div>
              <h3 className="text-base font-bold text-white">Metas de Poupança do Casal</h3>
              <p className="text-xs text-gray-400">Progresso dos objetivos de economia e investimentos</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Gerenciar Metas</span>
            <span className="material-symbols-outlined text-sm">settings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsGoalsList.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            return (
              <div key={goal.id} className="p-4 rounded-2xl bg-[#1c1833] border border-purple-500/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>{goal.title}</span>
                    </h4>
                    <p className="text-[11px] text-gray-400">{goal.description}</p>
                  </div>
                  <span className="font-extrabold text-emerald-400 text-sm">{percent}%</span>
                </div>

                <div className="w-full h-3 bg-[#0f0c1b] rounded-full overflow-hidden p-0.5 border border-purple-500/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="text-[11px] text-gray-300 font-medium">
                  Guardado <span className="font-bold text-emerald-400">{formatCurrencyBRL(goal.currentAmount)}</span> de{' '}
                  <span className="font-bold text-white">{formatCurrencyBRL(goal.targetAmount)}</span> pretendidos.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Goals & Category Budgets Card */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 space-y-5">
        <div className="flex items-center justify-between border-b border-purple-500/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-2xl">flag</span>
            <div>
              <h3 className="text-base font-bold text-white">Orçamento e Metas Mensais</h3>
              <p className="text-xs text-gray-400">Progresso dos limites configurados por categoria</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ajustar Limites</span>
            <span className="material-symbols-outlined text-sm">settings</span>
          </button>
        </div>

        {/* ORÇAMENTO POR CATEGORIA (Se configurado) */}
        {categoryBudgetItems.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
              Limites de Gastos Por Categoria
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryBudgetItems.map((item) => (
                <div key={item.category} className="p-4 rounded-2xl bg-[#1c1833] border border-purple-500/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span>{item.emoji}</span>
                      <span>{item.category}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {item.status === 'danger' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Excedido!
                        </span>
                      )}
                      {item.status === 'warning' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Alerta (80%)
                        </span>
                      )}
                      <span className="font-extrabold text-white">{item.percentage}%</span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-[#0f0c1b] rounded-full overflow-hidden p-0.5 border border-purple-500/20">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === 'danger'
                          ? 'bg-gradient-to-r from-rose-600 to-red-500'
                          : item.status === 'warning'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-gray-300 font-medium">
                    Gastei <span className="font-bold text-rose-400">{formatCurrencyBRL(item.spent)}</span> de{' '}
                    <span className="font-bold text-white">{formatCurrencyBRL(item.limit)}</span>.
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* FALLBACK: ORÇAMENTO ÚNICO TRADICIONAL */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 p-4 rounded-2xl bg-[#1c1833] border border-purple-500/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-purple-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-rose-400 text-sm">shopping_bag</span>
                  Orçamento de Despesas Global
                </span>
                <span className="font-extrabold text-white">
                  {user.totalBudgetGoal > 0 ? Math.min(100, Math.round((currentMonthTotals.expenses / user.totalBudgetGoal) * 100)) : 0}%
                </span>
              </div>

              <div className="w-full h-3 bg-[#0f0c1b] rounded-full overflow-hidden p-0.5 border border-purple-500/20">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    user.totalBudgetGoal > 0 && currentMonthTotals.expenses > user.totalBudgetGoal
                      ? 'bg-gradient-to-r from-rose-600 to-red-500'
                      : user.totalBudgetGoal > 0 && (currentMonthTotals.expenses / user.totalBudgetGoal) >= 0.8
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                  }`}
                  style={{
                    width: `${user.totalBudgetGoal > 0 ? Math.min(100, Math.round((currentMonthTotals.expenses / user.totalBudgetGoal) * 100)) : 0}%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-gray-300 font-medium">
                Gastei <span className="font-bold text-rose-400">{formatCurrencyBRL(currentMonthTotals.expenses)}</span> de{' '}
                <span className="font-bold text-white">{formatCurrencyBRL(user.totalBudgetGoal || 5000)}</span> do limite.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-[#1c1833] border border-purple-500/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-purple-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">payments</span>
                  Meta de Receita
                </span>
                <span className="font-extrabold text-white">
                  {user.monthlyIncomeGoal > 0 ? Math.min(100, Math.round((currentMonthTotals.income / user.monthlyIncomeGoal) * 100)) : 0}%
                </span>
              </div>

              <div className="w-full h-3 bg-[#0f0c1b] rounded-full overflow-hidden p-0.5 border border-purple-500/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                  style={{
                    width: `${user.monthlyIncomeGoal > 0 ? Math.min(100, Math.round((currentMonthTotals.income / user.monthlyIncomeGoal) * 100)) : 0}%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-gray-300 font-medium">
                Alcançado <span className="font-bold text-emerald-400">{formatCurrencyBRL(currentMonthTotals.income)}</span> de{' '}
                <span className="font-bold text-white">{formatCurrencyBRL(user.monthlyIncomeGoal || 8000)}</span> pretendidos.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Grid: Category Breakdown PieChart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PieChart carregado lazily */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between border-b border-purple-500/15 pb-3 mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400">pie_chart</span>
              Gastos por Categoria
            </h3>
            <span className="text-[11px] font-bold text-purple-300">Neste mês</span>
          </div>

          {categoryChartData.length > 0 ? (
            <Suspense
              fallback={
                <div className="h-48 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-400 text-3xl animate-spin">
                    progress_activity
                  </span>
                </div>
              }
            >
              <DashboardPieChart categoryChartData={categoryChartData} />
            </Suspense>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center text-purple-300/50 text-xs">
              <span className="material-symbols-outlined text-3xl mb-1">donut_large</span>
              <span>Nenhuma despesa registrada este mês</span>
            </div>
          )}
        </div>

        {/* Recent Transactions List (2 columns) */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/15 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400">history</span>
              Últimas Transações
            </h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver Todas ({scopedTransactions.length})</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {scopedTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 bg-[#1c1833] hover:bg-[#231e42] rounded-2xl border border-purple-500/10 flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${
                      tx.type === 'receita'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    <span>{tx.type === 'receita' ? '💰' : '💸'}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-white truncate">{tx.description}</p>
                      {tx.isRecurring && (
                        <span className="text-[10px]" title="Transação Recorrente">
                          🔁
                        </span>
                      )}
                      {tx.isShared && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Casal
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {formatDateBR(tx.date)} • {tx.category} {tx.paidBy ? `• ${tx.paidBy}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <p
                    className={`text-xs md:text-sm font-black ${
                      tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'receita' ? '+' : '-'} {formatCurrencyBRL(tx.amount)}
                  </p>

                  <div className="flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditTransaction && (
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 hover:bg-purple-500/20 text-purple-300 rounded-lg transition-colors cursor-pointer"
                        title="Editar transação"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => setDeletingTxId(tx.id)}
                      className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Excluir transação"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {scopedTransactions.length === 0 && (
              <div className="p-8 text-center bg-[#1c1833] rounded-2xl border border-purple-500/10 text-xs text-purple-300/60 space-y-2">
                <span className="material-symbols-outlined text-4xl text-purple-400">receipt_long</span>
                <p>Nenhuma transação encontrada.</p>
                <button
                  onClick={onOpenNewTransaction}
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Adicionar Primeira Transação
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Tip Footer Card */}
      <DailyTipCard />

      {/* Delete Confirmation Modal */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#18142e] border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-white">Excluir Transação?</h3>
            <p className="text-xs text-gray-300">
              Esta ação removerá a transação selecionada do controle financeiro.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingTxId(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deletingTxId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
