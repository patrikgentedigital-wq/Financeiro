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

import { KPIGrid } from './dashboard/KPIGrid';
import { CoupleBalanceCard } from './dashboard/CoupleBalanceCard';
import { SavingsGoalsList } from './dashboard/SavingsGoalsList';
import { RecentTransactionsList } from './dashboard/RecentTransactionsList';

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
            className="min-h-[44px] px-3.5 py-2 bg-[#1c1833] hover:bg-[#252044] text-purple-200 border border-purple-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
            title="Exportar Relatório Mensal em PDF"
          >
            <span className="material-symbols-outlined text-base text-purple-400">picture_as_pdf</span>
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* CARD DE ACERTO DE CONTAS DO CASAL ("QUEM DEVE QUANTO") */}
      <CoupleBalanceCard
        coupleBalance={coupleBalance}
        onNavigate={onNavigate}
        handleSettleBalance={handleSettleBalance}
      />

      {/* Main KPI Grid Cards */}
      <KPIGrid currentMonthTotals={currentMonthTotals} user={user} />

      {/* MÚLTIPLAS METAS DE POUPANÇA */}
      <SavingsGoalsList
        savingsGoalsList={savingsGoalsList}
        onNavigate={onNavigate}
      />

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
            className="min-h-[44px] text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b] p-1 rounded"
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
        <RecentTransactionsList
          scopedTransactions={scopedTransactions}
          onNavigate={onNavigate}
          onOpenNewTransaction={onOpenNewTransaction}
          onEditTransaction={onEditTransaction}
          setDeletingTxId={setDeletingTxId}
        />
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
                className="flex-1 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deletingTxId)}
                className="flex-1 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
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
