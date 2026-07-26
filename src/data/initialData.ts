import { Transaction, UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  name: 'Nosso Casal',
  subtitle: 'Finanças do Casal',
  email: 'casal@financasdocasal.app',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  totalBalance: 0,
  monthlyIncomeGoal: 10000.00,
  totalBudgetGoal: 5000.00,
  partner1Name: 'Parceiro(a) 1',
  partner2Name: 'Parceiro(a) 2',
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const MONTHLY_CHARTS_DATA = [
  { month: 'Fev', Renda: 0, Despesas: 0 },
  { month: 'Mar', Renda: 0, Despesas: 0 },
  { month: 'Abr', Renda: 0, Despesas: 0 },
  { month: 'Mai', Renda: 0, Despesas: 0 },
  { month: 'Jun', Renda: 0, Despesas: 0 },
  { month: 'Jul', Renda: 0, Despesas: 0 },
];
