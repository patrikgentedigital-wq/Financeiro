import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Transaction, UserProfile, ViewMode } from '../types';
import { DailyTipCard } from './DailyTipCard';
import { formatCurrencyBRL, formatDateBR } from '../data/categories';
import { generateMonthlyPDFReport } from '../utils/pdfExport';
import { calculateFinancialTotals, getCategoryBreakdown } from '../utils/calculations';

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

  // Dynamic filter for individual view (check against partner1Name or user.name)
  const scopedTransactions = useMemo(() => {
    if (viewScope === 'individual') {
      const myName = (user.partner1Name || user.name || '').toLowerCase();
      return transactions.filter(
        (t) => !t.isShared || (t.paidBy && t.paidBy.toLowerCase() === myName)
      );
    }
    return transactions; // couple view shows all
  }, [transactions, viewScope, user]);

  // Calculate current financial totals using central utility
  const currentMonthTotals = useMemo(() => {
    return calculateFinancialTotals(scopedTransactions);
  }, [scopedTransactions]);

  // Spending by category data for PieChart using central utility
  const categoryChartData = useMemo(() => {
    return getCategoryBreakdown(scopedTransactions, 'despesa');
  }, [scopedTransactions]);

  // Export current month PDF report
  const handleExportPDF = () => {
    const currentMonthLabel = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    generateMonthlyPDFReport({
      monthName: currentMonthLabel.charAt(0).toUpperCase() + currentMonthLabel.slice(1),
      transactions: scopedTransactions,
      coupleName: user.name,
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in pb-12">
      {/* Top Banner / Hero Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-purple-950/50 border border-purple-500/20 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-xl">favorite</span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-300">
              {user.subtitle || 'Finanças do Casal'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Olá, {user.name}! 👋
          </h1>
          <p className="text-xs text-purple-200/70 font-medium">
            Acompanhe o equilíbrio financeiro do seu relacionamento em tempo real.
          </p>
        </div>

        {/* View Scope Toggle & Export PDF Button */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <div className="flex items-center gap-2 bg-[#120f24] p-1.5 rounded-2xl border border-purple-500/20 shadow-inner flex-1 md:flex-none">
            <button
              onClick={() => setViewScope('couple')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                viewScope === 'couple'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">diversity_1</span>
              <span>Visão do Casal</span>
            </button>

            <button
              onClick={() => setViewScope('individual')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                viewScope === 'individual'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>
              <span>Só os Meus</span>
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
            <p className="text-[11px] text-gray-400 mt-1">
              {currentMonthTotals.balance >= 0
                ? '✨ Saldo positivo no período!'
                : '⚠️ Atenção: despesas superam receitas'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Goals & Budget Progress Card */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-[#120f24]/80 space-y-5">
        <div className="flex items-center justify-between border-b border-purple-500/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-2xl">flag</span>
            <div>
              <h3 className="text-base font-bold text-white">Acompanhamento do Orçamento e Metas Mensais</h3>
              <p className="text-xs text-gray-400">Progresso do limite de gastos e meta de receitas configuradas</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="text-xs font-bold text-purple-300 hover:text-purple-100 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ajustar Metas</span>
            <span className="material-symbols-outlined text-sm">settings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Orçamento de Despesas */}
          <div className="space-y-2 p-4 rounded-2xl bg-[#1c1833] border border-purple-500/10">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-purple-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-rose-400 text-sm">shopping_bag</span>
                Orçamento de Despesas
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
              ></div>
            </div>

            <p className="text-[11px] text-gray-300 font-medium">
              Gastei <span className="font-bold text-rose-400">{formatCurrencyBRL(currentMonthTotals.expenses)}</span> de{' '}
              <span className="font-bold text-white">{formatCurrencyBRL(user.totalBudgetGoal || 5000)}</span> do limite.
            </p>
          </div>

          {/* Meta de Receitas */}
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
              ></div>
            </div>

            <p className="text-[11px] text-gray-300 font-medium">
              Alcançado <span className="font-bold text-emerald-400">{formatCurrencyBRL(currentMonthTotals.income)}</span> de{' '}
              <span className="font-bold text-white">{formatCurrencyBRL(user.monthlyIncomeGoal || 10000)}</span> da meta.
            </p>
          </div>
        </div>
      </div>

      {/* Smart Daily Tip Card Component */}
      <DailyTipCard
        user={user}
        transactions={scopedTransactions}
        savingsGoal={user.savingsGoal}
        onNavigate={onNavigate}
        onOpenTopUp={() => onNavigate('transactions')}
        onOpenNewTransaction={onOpenNewTransaction}
      />

      {/* Charts & Categorization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Gastos por Categoria */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-xl">pie_chart</span>
                Categorias de Gastos
              </h3>
              <p className="text-xs text-gray-400">Distribuição percentual das despesas</p>
            </div>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-full h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrencyBRL(Number(val)), 'Gasto']}
                      contentStyle={{
                        backgroundColor: '#1c1833',
                        borderColor: '#8b5cf6',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-2 w-full mt-2 pt-2 border-t border-purple-500/10">
                {categoryChartData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-[#120f24]/50">
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{cat.emoji}</span>
                      <span className="text-gray-300 font-medium truncate">{cat.name}</span>
                    </div>
                    <span className="font-bold text-purple-300">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center text-gray-400 text-xs gap-2">
              <span className="material-symbols-outlined text-3xl text-purple-400">hourglass_empty</span>
              <span>Nenhuma despesa registrada nesta visão.</span>
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-xl">history</span>
                Últimos Lançamentos
              </h3>
              <p className="text-xs text-gray-400">Movimentações recentes da conta</p>
            </div>

            <button
              onClick={() => onNavigate('transactions')}
              className="px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Ver todas</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {scopedTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-[#120f24]/70 border border-purple-500/10 hover:border-purple-500/30 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-lg shrink-0">
                    {tx.type === 'receita' ? '💼' : '🍔'}
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      <span>{formatDateBR(tx.date)}</span>
                      <span>•</span>
                      <span className="text-purple-300">{tx.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Badge Casal vs Individual */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.isShared
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    {tx.isShared ? '👥 Casal' : '👤 Individual'}
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'receita' ? '+' : '-'} {formatCurrencyBRL(tx.amount)}
                  </span>

                  {onEditTransaction && (
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1 text-gray-400 hover:text-purple-300 transition-colors cursor-pointer"
                      title="Editar lançamento"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => setDeletingTxId(tx.id)}
                    className="p-1 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Excluir transação"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))}

            {scopedTransactions.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-8">
                Nenhuma transação encontrada. Clique em "+ Nova Transação" para começar!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="glass-card bg-[#1c1833] border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <h3 className="text-lg font-bold text-white">Excluir Lançamento?</h3>
            <p className="text-xs text-gray-300">
              Esta ação removerá o registro do seu saldo e histórico. Deseja continuar?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTxId(null)}
                className="flex-1 py-2.5 rounded-xl border border-purple-500/20 text-xs font-bold text-gray-300 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteTransaction(deletingTxId);
                  setDeletingTxId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-900/40 hover:bg-rose-500"
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
