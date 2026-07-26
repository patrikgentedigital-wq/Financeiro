import { Transaction, UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  name: 'Nosso Casal',
  subtitle: 'Finanças do Casal',
  email: 'casal@financasdocasal.app',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  totalBalance: 0,
  monthlyIncomeGoal: 10000.00,
  totalBudgetGoal: 5000.00,
  partner1Name: 'Alex',
  partner2Name: 'Sam',
  savingsGoal: {
    id: '1',
    title: 'Viagem em Casal',
    description: 'Férias do Casal',
    currentAmount: 3200,
    targetAmount: 5000,
  },
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];
