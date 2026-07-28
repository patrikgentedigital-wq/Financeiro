import { Transaction, CategoryBudget, CoupleBalanceResult } from '../types';
import { getCategoryEmoji } from '../data/categories';

export interface FinancialTotals {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export interface CategoryBreakdownItem {
  name: string;
  value: number;
  emoji: string;
  percentage: number;
  color: string;
}

export interface MonthlyHistoryItem {
  month: string;
  monthKey: string; // YYYY-MM
  Renda: number;
  Despesas: number;
}

export interface CategoryBudgetProgressItem {
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'normal' | 'warning' | 'danger'; // normal (<80%), warning (80-100%), danger (>100%)
  emoji: string;
}

const CATEGORY_COLORS = [
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
  '#f59e0b',
  '#10b981',
  '#6366f1',
  '#a855f7',
  '#64748b',
];

// Helper para verificar se a categoria é de ajuste de acerto de contas (deve ser excluída dos totais)
export function isAdjustmentCategory(category?: string): boolean {
  if (!category) return false;
  const catLower = category.toLowerCase().trim();
  return catLower === 'ajustes' || catLower === 'acerto de contas' || catLower.includes('ajuste');
}

/**
 * Safely rounds a currency number to two decimal places
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates total income, expenses, balance, and savings rate with precision
 * Exclui a categoria 'Ajustes' para evitar inflar artificialmente o total gasto do casal nas quitações
 */
export function calculateFinancialTotals(transactions: Transaction[]): FinancialTotals {
  let rawIncome = 0;
  let rawExpenses = 0;

  transactions.forEach((t) => {
    if (isAdjustmentCategory(t.category)) return;

    const amount = Math.abs(Number(t.amount) || 0);
    if (t.type === 'receita') {
      rawIncome += amount;
    } else {
      rawExpenses += amount;
    }
  });

  const income = roundCurrency(rawIncome);
  const expenses = roundCurrency(rawExpenses);
  const balance = roundCurrency(income - expenses);
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  return { income, expenses, balance, savingsRate };
}

/**
 * Groups transactions by category and calculates percentage breakdown
 * Exclui a categoria 'Ajustes'
 */
export function getCategoryBreakdown(
  transactions: Transaction[],
  targetType: 'despesa' | 'receita' = 'despesa'
): CategoryBreakdownItem[] {
  const expenseMap: Record<string, number> = {};
  let totalForType = 0;

  transactions.forEach((t) => {
    if (isAdjustmentCategory(t.category)) return;

    if (t.type === targetType) {
      const amount = Math.abs(Number(t.amount) || 0);
      expenseMap[t.category] = (expenseMap[t.category] || 0) + amount;
      totalForType += amount;
    }
  });

  totalForType = roundCurrency(totalForType);

  return Object.entries(expenseMap)
    .map(([name, val], idx) => {
      const value = roundCurrency(val);
      return {
        name,
        value,
        emoji: getCategoryEmoji(name, targetType),
        percentage: totalForType > 0 ? Math.round((value / totalForType) * 100) : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      };
    })
    .sort((a, b) => b.value - a.value);
}

/**
 * Generates dynamic 6-month historical comparison from real transactions
 */
export function getSixMonthHistory(transactions: Transaction[]): MonthlyHistoryItem[] {
  const now = new Date();
  const months: MonthlyHistoryItem[] = [];

  const shortMonthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Build key array for last 6 months (5 months ago to current month)
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${yyyy}-${mm}`;
    const label = `${shortMonthNames[d.getMonth()]}`;

    months.push({
      month: label,
      monthKey,
      Renda: 0,
      Despesas: 0,
    });
  }

  // Aggregate actual transactions
  transactions.forEach((t) => {
    if (isAdjustmentCategory(t.category)) return;
    if (!t.date || t.date.length < 7) return;

    const key = t.date.slice(0, 7); // YYYY-MM
    const match = months.find((m) => m.monthKey === key);
    if (match) {
      const amt = Math.abs(Number(t.amount) || 0);
      if (t.type === 'receita') {
        match.Renda += amt;
      } else {
        match.Despesas += amt;
      }
    }
  });

  // Round results
  return months.map((m) => ({
    ...m,
    Renda: roundCurrency(m.Renda),
    Despesas: roundCurrency(m.Despesas),
  }));
}

/**
 * Calculates current accumulated savings dynamically from transactions under 'Investimentos' or 'Poupança'
 */
export function calculateSavingsGoalProgress(transactions: Transaction[], baseCurrentAmount: number = 0): number {
  let accumulated = baseCurrentAmount;

  transactions.forEach((t) => {
    const categoryLower = (t.category || '').toLowerCase();
    if (categoryLower.includes('invest') || categoryLower.includes('poup')) {
      const amt = Math.abs(Number(t.amount) || 0);
      if (t.type === 'receita') {
        accumulated += amt;
      } else {
        accumulated += amt;
      }
    }
  });

  return roundCurrency(accumulated);
}

/**
 * Calculates category budget progress and warning/danger alert levels
 */
export function calculateCategoryBudgetProgress(
  transactions: Transaction[],
  categoryBudgets: CategoryBudget[]
): CategoryBudgetProgressItem[] {
  if (!categoryBudgets || categoryBudgets.length === 0) return [];

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const spentMap: Record<string, number> = {};
  transactions.forEach((t) => {
    if (isAdjustmentCategory(t.category)) return;
    if (t.type === 'despesa' && t.date && t.date.startsWith(currentMonthKey)) {
      const amt = Math.abs(Number(t.amount) || 0);
      spentMap[t.category] = (spentMap[t.category] || 0) + amt;
    }
  });

  return categoryBudgets
    .map((b) => {
      const spent = roundCurrency(spentMap[b.category] || 0);
      const limit = roundCurrency(b.limit || 0);
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      let status: 'normal' | 'warning' | 'danger' = 'normal';
      if (percentage >= 100) {
        status = 'danger';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      return {
        category: b.category,
        spent,
        limit,
        percentage,
        status,
        emoji: getCategoryEmoji(b.category, 'despesa'),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * APURAÇÃO DE ACERTO DE CONTAS DO CASAL (50/50)
 * Regra:
 * - Só considera despesas compartilhadas (isShared === true && type === 'despesa')
 * - Ignora categoria de Ajustes/Acertos anteriores
 * - paidBy === 'Casal' (ou vazio) é considerado fundo comum (não gera dívida)
 * - paidBy com o nome de um parceiro indica que ele adiantou 100% da despesa compartilhada
 * - O outro parceiro deve 50% desse valor.
 */
export function calculateCoupleBalance(
  transactions: Transaction[],
  partner1Name?: string,
  partner2Name?: string
): CoupleBalanceResult {
  const p1Raw = (partner1Name || '').trim();
  const p2Raw = (partner2Name || '').trim();

  const p1Lower = p1Raw.toLowerCase();
  const p2Lower = p2Raw.toLowerCase();

  const hasNamesConfigured = Boolean(p1Raw && p2Raw && p1Lower !== p2Lower);

  if (!hasNamesConfigured) {
    return {
      p1Name: p1Raw || 'Parceiro 1',
      p2Name: p2Raw || 'Parceiro 2',
      p1Paid: 0,
      p2Paid: 0,
      sharedTotal: 0,
      netBalance: 0,
      debtorName: '',
      creditorName: '',
      amountOwed: 0,
      isSettled: true,
      hasNamesConfigured: false,
    };
  }

  let p1Paid = 0;
  let p2Paid = 0;
  let sharedTotal = 0;

  transactions.forEach((t) => {
    if (!t.isShared || t.type !== 'despesa' || isAdjustmentCategory(t.category)) return;

    const amt = Math.abs(Number(t.amount) || 0);
    sharedTotal += amt;

    const paidByLower = (t.paidBy || '').trim().toLowerCase();

    if (!paidByLower || paidByLower === 'casal') {
      // Pago por ambos / fundo comum
      return;
    }

    if (paidByLower === p1Lower) {
      p1Paid += amt;
    } else if (paidByLower === p2Lower) {
      p2Paid += amt;
    }
    // Se paidBy for um nome órfão/desconhecido (ex: "Maria"), é ignorado com segurança.
  });

  p1Paid = roundCurrency(p1Paid);
  p2Paid = roundCurrency(p2Paid);
  sharedTotal = roundCurrency(sharedTotal);

  // Cada um é responsável por 50% das despesas compartilhadas
  // Se P1 pagou P1Paid, o crédito dele é P1Paid / 2
  // Se P2 pagou P2Paid, o crédito dele é P2Paid / 2
  const netBalance = roundCurrency(p1Paid / 2 - p2Paid / 2);

  let debtorName = '';
  let creditorName = '';
  let amountOwed = Math.abs(netBalance);
  let isSettled = amountOwed < 0.01;

  if (!isSettled) {
    if (netBalance > 0) {
      // P1 pagou a mais -> P2 deve a P1
      debtorName = p2Raw;
      creditorName = p1Raw;
    } else {
      // P2 pagou a mais -> P1 deve a P2
      debtorName = p1Raw;
      creditorName = p2Raw;
    }
  }

  return {
    p1Name: p1Raw,
    p2Name: p2Raw,
    p1Paid,
    p2Paid,
    sharedTotal,
    netBalance,
    debtorName,
    creditorName,
    amountOwed,
    isSettled,
    hasNamesConfigured: true,
  };
}
