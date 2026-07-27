import { describe, it, expect } from 'vitest';
import { calculateFinancialTotals, getCategoryBreakdown, calculateSavingsGoalProgress } from './calculations';
import { Transaction } from '../types';

describe('Financial Calculations Utility', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      date: '2026-07-01',
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
      date: '2026-07-05',
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
      date: '2026-07-10',
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
    expect(totals.savingsRate).toBe(80); // (4000 / 5000) * 100
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
    expect(progress).toBe(1200); // Base 1000 + 200 da categoria Investimentos
  });
});
