import { describe, it, expect } from 'vitest';
import {
  calculateFinancialTotals,
  getCategoryBreakdown,
  calculateSavingsGoalProgress,
  calculateCategoryBudgetProgress,
  calculateCoupleBalance,
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

  it('deve ignorar transações da categoria Ajustes nos totais financeiros de gastos do casal', () => {
    const txWithAdjustment: Transaction[] = [
      ...sampleTransactions,
      {
        id: '4',
        date: `${todayMonthKey}-15`,
        description: 'Acerto de Contas do Casal',
        amount: 300,
        type: 'despesa',
        category: 'Ajustes',
        isShared: false,
        paidBy: 'Sam',
        version: 1,
      },
    ];

    const totals = calculateFinancialTotals(txWithAdjustment);

    // O valor de 300 de Ajustes NÃO deve inflar o total de despesas (continua 1000)
    expect(totals.expenses).toBe(1000);
    expect(totals.balance).toBe(4000);
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

  describe('calculateCoupleBalance (Acerto de Contas 50/50)', () => {
    it('deve indicar nomes não configurados quando partner1Name ou partner2Name estiverem ausentes', () => {
      const result = calculateCoupleBalance(sampleTransactions, '', 'Sam');
      expect(result.hasNamesConfigured).toBe(false);
      expect(result.isSettled).toBe(true);
    });

    it('deve retornar saldo quitado (isSettled: true) quando paidBy for Casal', () => {
      const result = calculateCoupleBalance(sampleTransactions, 'Alex', 'Sam');
      expect(result.hasNamesConfigured).toBe(true);
      expect(result.sharedTotal).toBe(1000);
      expect(result.p1Paid).toBe(0);
      expect(result.p2Paid).toBe(0);
      expect(result.isSettled).toBe(true);
      expect(result.amountOwed).toBe(0);
    });

    it('deve calcular corretamente a dívida 50/50 quando um parceiro adiantou mais', () => {
      const coupleTxs: Transaction[] = [
        {
          id: '1',
          date: '2026-07-01',
          description: 'Aluguel',
          amount: 2000,
          type: 'despesa',
          category: 'Moradia',
          isShared: true,
          paidBy: 'Alex',
        },
        {
          id: '2',
          date: '2026-07-02',
          description: 'Mercado',
          amount: 600,
          type: 'despesa',
          category: 'Alimentação',
          isShared: true,
          paidBy: 'Sam',
        },
      ];

      // Alex pagou 2000, Sam pagou 600.
      // Total compartilhado = 2600.
      // 50% de Alex = 1000, 50% de Sam = 300.
      // NetBalance = 1000 - 300 = 700. Sam deve 700 a Alex.
      const result = calculateCoupleBalance(coupleTxs, 'Alex', 'Sam');

      expect(result.hasNamesConfigured).toBe(true);
      expect(result.p1Paid).toBe(2000);
      expect(result.p2Paid).toBe(600);
      expect(result.sharedTotal).toBe(2600);
      expect(result.netBalance).toBe(700);
      expect(result.debtorName).toBe('Sam');
      expect(result.creditorName).toBe('Alex');
      expect(result.amountOwed).toBe(700);
      expect(result.isSettled).toBe(false);
    });

    it('deve ignorar nomes órfãos/desconhecidos no paidBy e ser insensível a maiúsculas/minúsculas', () => {
      const coupleTxs: Transaction[] = [
        {
          id: '1',
          date: '2026-07-01',
          description: 'Jantar',
          amount: 200,
          type: 'despesa',
          category: 'Lazer',
          isShared: true,
          paidBy: ' alex ', // com espaços e minúsculo
        },
        {
          id: '2',
          date: '2026-07-02',
          description: 'Presente Amiga Maria',
          amount: 150,
          type: 'despesa',
          category: 'Outros',
          isShared: true,
          paidBy: 'Maria', // Nome órfão/desconhecido, deve ser ignorado
        },
      ];

      const result = calculateCoupleBalance(coupleTxs, 'Alex', 'Sam');

      expect(result.p1Paid).toBe(200);
      expect(result.p2Paid).toBe(0);
      expect(result.debtorName).toBe('Sam');
      expect(result.creditorName).toBe('Alex');
      expect(result.amountOwed).toBe(100);
    });
  });
});
