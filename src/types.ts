export type ViewMode = 'dashboard' | 'transactions' | 'reports' | 'settings';

export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive number for both, type determines sign
  type: TransactionType; // 'receita' | 'despesa'
  category: string;
  isShared: boolean; // true = Gasto do casal, false = Individual (só meus)
  paidBy?: string; // Nome do responsável ('Casal' ou nome do parceiro)
  isDeleted?: boolean;
  deletedAt?: string;
  version?: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  description: string;
  currentAmount: number;
  targetAmount: number;
}

export interface UserProfile {
  name: string;
  subtitle: string;
  email: string;
  avatarUrl: string;
  totalBalance: number;
  monthlyIncomeGoal: number;
  totalBudgetGoal: number;
  partner1Name?: string;
  partner2Name?: string;
  savingsGoal?: SavingsGoal;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'danger' | 'info';
  message: string;
}
