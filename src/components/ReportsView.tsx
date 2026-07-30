import React, { useState, useMemo } from 'react';
import { Transaction, UserProfile } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { formatCurrencyBRL } from '../data/categories';
import { generateMonthlyPDFReport } from '../utils/pdfExport';
import { calculateFinancialTotals, getCategoryBreakdown, getSixMonthHistory } from '../utils/calculations';
import { exportTransactionsToCSV } from '../utils/csvExport';

interface ReportsViewProps {
  transactions: Transaction[];
  user?: UserProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, user }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Available unique YYYY-MM months from transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Format month for label (e.g. 2026-07 -> Julho de 2026)
  const formatMonthLabel = (m: string) => {
    if (m === 'all') return 'Todos os Períodos';
    const [year, month] = m.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
  };

  // Group transactions for current or selected month
  const monthFilteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Compute financial totals with central utility
  const { income: totalIncome, expenses: totalExpenses, savingsRate } = useMemo(() => {
    return calculateFinancialTotals(monthFilteredTransactions);
  }, [monthFilteredTransactions]);

  // Dynamic 6-month historical comparison from real transactions
  const monthlyChartData = useMemo(() => {
    return getSixMonthHistory(transactions);
  }, [transactions]);

  // Category breakdown using central utility
  const categoryBreakdown = useMemo(() => {
    return getCategoryBreakdown(monthFilteredTransactions, 'despesa');
  }, [monthFilteredTransactions]);

  // Export PDF handler
  const handleExportPDF = () => {
    const label = formatMonthLabel(selectedMonth);
    generateMonthlyPDFReport({
      monthName: label,
      transactions: monthFilteredTransactions,
      coupleName: user?.name || 'Finanças do Casal',
    });
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const filename = `Resumo_Mensal_Casal_${selectedMonth}.csv`;
    exportTransactionsToCSV(monthFilteredTransactions, filename);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-3xl">bar_chart</span>
            Resumo Mensal e Relatórios
          </h1>
          <p className="text-xs text-purple-200/70 font-medium mt-1">
            Análise evolutiva de receitas x despesas e exportação de relatórios profissionais em PDF ou CSV
          </p>
        </div>

        {/* Controls Bar: Month Selector + Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2.5 bg-[#1a1633] border border-purple-500/30 text-white rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all" className="bg-[#1c1833]">📅 Todos os Períodos</option>
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-[#1c1833]">
                🗓️ {formatMonthLabel(m)}
              </option>
            ))}
          </select>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 min-h-[44px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
            title="Exportar resumo formatado em PDF profissional"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Exportar PDF</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 min-h-[44px] bg-[#1c1833] border border-purple-500/30 text-purple-200 font-bold text-xs rounded-2xl hover:bg-purple-900/30 hover:text-white transition-all cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b]"
            title="Exportar planilha em CSV"
          >
            <span className="material-symbols-outlined text-base">file_download</span>
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-emerald-950/10">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            Receitas Totais
          </span>
          <p className="text-2xl font-black text-emerald-400 break-words">{formatCurrencyBRL(totalIncome)}</p>
          <p className="text-[11px] text-emerald-300/60 mt-1">Ganhos somados do casal</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-rose-500/20 bg-rose-950/10">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
            Despesas Totais
          </span>
          <p className="text-2xl font-black text-rose-400 break-words">{formatCurrencyBRL(totalExpenses)}</p>
          <p className="text-[11px] text-rose-300/60 mt-1">Gastos somados do casal</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-purple-950/20">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-1">
            Taxa de Poupança
          </span>
          <p className="text-2xl font-black text-purple-300">{savingsRate}%</p>
          <p className="text-[11px] text-purple-200/60 mt-1">Retido do total acumulado</p>
        </div>
      </div>

      {/* Dynamic 6-Month Comparison Bar Chart */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-purple-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-purple-500/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-xl">compare_arrows</span>
              Receitas vs Despesas (Últimos 6 Meses)
            </h3>
            <p className="text-xs text-gray-400">Comparativo histórico de entradas e saídas mensais</p>
          </div>

          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[11px] rounded-full">
            Evolução Semestral
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="month" stroke="#a78bfa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#a78bfa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrencyBRL(Number(val)), '']}
                contentStyle={{
                  backgroundColor: '#1c1833',
                  borderColor: '#8b5cf6',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#d8b4fe' }} />
              <Bar dataKey="Renda" name="Receitas (+)" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Despesas" name="Despesas (-)" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      <div className="glass-card rounded-3xl p-6 border border-purple-500/20 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400 text-xl">category</span>
          Detalhamento de Gastos por Categoria
        </h3>

        {categoryBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="p-4 rounded-2xl bg-[#120f24] border border-purple-500/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </span>
                  <span className="font-extrabold text-purple-300">{cat.percentage}%</span>
                </div>

                <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>

                <p className="text-xs font-black text-rose-400 text-right">{formatCurrencyBRL(cat.value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-4 text-center">Nenhum gasto registrado para o período.</p>
        )}
      </div>
    </div>
  );
};
