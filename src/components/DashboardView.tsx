import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Transaction, UserProfile, ViewMode } from '../types';
import { DailyTipCard } from './DailyTipCard';
import { formatCurrencyBRL, formatDateBR } from '../data/categories';
import { generateMonthlyPDFReport } from '../utils/pdfExport';
import {
  calculateFinancialTotals,
  getCategoryBreakdown,
  calculateCategoryBudgetProgress,
} from '../utils/calculations';

interface DashboardViewProps {
  user: UserProfile;
  transactions: Transaction[];
  onNavigate: (view: ViewMode) => void;
  onOpenNewTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  transactions,
  onNavigate,
  onOpenNewTransaction,
  onDeleteTransaction,
  onEditTransaction,
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

  // Savings Goal calculation
  const savingsGoal = user.savingsGoal;
  const savingsPercent = savingsGoal
    ? Math.min(100, Math.round((savingsGoal.currentAmount / savingsGoal.targetAmount) * 100))
    : 0;

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
          {/* Scope Toggle Button */}
          <div className="flex bg-[#120f24] p-1 rounded-2xl border border-purple-500/20 text-xs">
            <button
              onClick={() => setViewScope('couple')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewScope === 'couple'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">group</span>
              <span>Casal</span>
            </button>
            <button
              onClick={() => setViewScope('individual')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewScope === 'individual'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">person</span>
              <span>Individual</span>
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            title="Exportar Resumo Financeiro em PDF"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Receitas Card */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">arrow_upward</span>
              Total de Receitas
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight break-words">
              {formatCurrencyBRL(currentMonthTotals.income)}
            </p>
            <p className="text-[11px] text-emerald-300/70 mt-1">Entradas acumuladas</p>
          </div>
        </div>

        {/* Despesas Card */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between border border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">arrow_downward</span>
              Total de Despesas
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">shopping_bag</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl md:text-3xl font-black text-rose-400 tracking-tight break-words">
              {formatCurrencyBRL(currentMonthTotals.expenses)}
            </p>
            <p className="text-[11px] text-rose-300/70 mt-1">Saídas acumuladas</p>
          </div>
        </div>

        {/* Saldo Atual Card */}
        <div
          className={`glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between border ${
            currentMonthTotals.balance >= 0
              ? 'border-emerald-500/30 bg-emerald-950/20'
              : 'border-rose-500/30 bg-rose-950/20'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                currentMonthTotals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
              Saldo Atual
            </span>
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                currentMonthTotals.balance >= 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
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

      {/* Dica do Dia AI Card */}
      <DailyTipCard transactions={scopedTransactions} user={user} />

      {/* Middle Section: PieChart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PieChart Card (Despesas por Categoria) */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 flex flex-col justify-between lg:col-span-1">
          <div>
            <div className="flex items-center justify-between border-b border-purple-500/15 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-xl">pie_chart</span>
                Gastos por Categoria
              </h3>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Relatório</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {categoryChartData.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Nenhuma despesa registrada para o gráfico.
              </div>
            ) : (
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#120f24" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Gasto']}
                      contentStyle={{
                        backgroundColor: '#19152d',
                        borderColor: 'rgba(168,85,247,0.3)',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Categories Legend list */}
          {categoryChartData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-purple-500/10 space-y-1.5 max-h-36 overflow-y-auto">
              {categoryChartData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-300 truncate">
                      {item.emoji} {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-white shrink-0 ml-2">{item.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions List Card */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-purple-500/15 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400 text-xl">history</span>
                  Últimos Lançamentos
                </h3>
                <p className="text-xs text-gray-400">Movimentações recentes cadastradas</p>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ver Todas</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {scopedTransactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Nenhuma transação cadastrada até o momento.
              </div>
            ) : (
              <div className="space-y-3">
                {scopedTransactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-[#1c1833] border border-purple-500/10 flex items-center justify-between hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-lg shrink-0">
                        {tx.type === 'receita' ? '💰' : '🛒'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs truncate">{tx.description}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>{formatDateBR(tx.date)}</span>
                          <span>•</span>
                          <span className="text-purple-300 font-semibold">{tx.category}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <p
                        className={`font-black text-xs ${
                          tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'receita' ? '+' : '-'} {formatCurrencyBRL(tx.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="text-purple-300 hover:text-white p-0.5 rounded cursor-pointer"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingTxId(tx.id)}
                          className="text-rose-400 hover:text-rose-200 p-0.5 rounded cursor-pointer"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-purple-500/10 flex justify-end">
            <button
              onClick={onOpenNewTransaction}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Adicionar Transação</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card p-6 rounded-3xl border border-rose-500/30 bg-[#131024]/95 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-white">Excluir Lançamento?</h3>
            <p className="text-xs text-purple-200/70">
              Esta ação removerá permanentemente a transação.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTxId(null)}
                className="px-4 py-2 rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-200 hover:bg-purple-500/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deletingTxId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
