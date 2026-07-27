import { Transaction, CategoryBudget } from '../types';
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

/**
 * Safely rounds a currency number to two decimal places
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates total income, expenses, balance, and savings rate with precision
 */
export function calculateFinancialTotals(transactions: Transaction[]): FinancialTotals {
  let rawIncome = 0;
  let rawExpenses = 0;

  transactions.forEach((t) => {
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
 */
export function getCategoryBreakdown(
  transactions: Transaction[],
  targetType: 'despesa' | 'receita' = 'despesa'
): CategoryBreakdownItem[] {
  const expenseMap: Record<string, number> = {};
  let totalForType = 0;

  transactions.forEach((t) => {
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

  // Consider current month expenses only
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const spentMap: Record<string, number> = {};
  transactions.forEach((t) => {
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
