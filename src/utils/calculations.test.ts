import { describe, it, expect } from 'vitest';
import {
  calculateFinancialTotals,
  getCategoryBreakdown,
  calculateSavingsGoalProgress,
  calculateCategoryBudgetProgress,
} from './calculations';
import { Transaction, CategoryBudget } from '../types';

describe('Financial Calculations Utility', () => {
  const todayMonthKey = new Date().toISOString().slice(0, 7);

  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      date: `${todayMonthKey}-01`,
      description: 'Salário',
      amount: 5000,
      type: 'receita',
      category: 'Salário',
      isShared: true,
      paidBy: 'Casal',
      version: 1,
    },
    {
      id: '2',
      date: `${todayMonthKey}-05`,
      description: 'Supermercado',
      amount: 800,
      type: 'despesa',
      category: 'Alimentação',
      isShared: true,
      paidBy: 'Casal',
      version: 1,
    },
    {
      id: '3',
      date: `${todayMonthKey}-10`,
      description: 'Aporte de Poupança',
      amount: 200,
      type: 'despesa',
      category: 'Investimentos',
      isShared: true,
      paidBy: 'Casal',
      version: 1,
    },
  ];

  it('deve calcular corretamente totais de receitas, despesas e saldo líquido', () => {
    const totals = calculateFinancialTotals(sampleTransactions);

    expect(totals.income).toBe(5000);
    expect(totals.expenses).toBe(1000);
    expect(totals.balance).toBe(4000);
    expect(totals.savingsRate).toBe(80);
  });

  it('deve agrupar gastos por categoria ordenando do maior para o menor', () => {
    const breakdown = getCategoryBreakdown(sampleTransactions, 'despesa');

    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].name).toBe('Alimentação');
    expect(breakdown[0].value).toBe(800);
    expect(breakdown[1].name).toBe('Investimentos');
    expect(breakdown[1].value).toBe(200);
  });

  it('deve calcular progresso da meta de economia acumulada para investimentos', () => {
    const progress = calculateSavingsGoalProgress(sampleTransactions, 1000);
    expect(progress).toBe(1200);
  });

  it('deve calcular alertas de orçamento por categoria (normal, warning, danger)', () => {
    const budgets: CategoryBudget[] = [
      { category: 'Alimentação', limit: 1000 }, // 800 de 1000 = 80% (warning)
      { category: 'Investimentos', limit: 100 }, // 200 de 100 = 200% (danger)
    ];

    const progressItems = calculateCategoryBudgetProgress(sampleTransactions, budgets);

    expect(progressItems).toHaveLength(2);
    const invest = progressItems.find((p) => p.category === 'Investimentos');
    const alim = progressItems.find((p) => p.category === 'Alimentação');

    expect(invest?.status).toBe('danger');
    expect(invest?.percentage).toBe(200);

    expect(alim?.status).toBe('warning');
    expect(alim?.percentage).toBe(80);
  });
});
