export type ViewMode = 'dashboard' | 'transactions' | 'reports' | 'settings';

export type TransactionType = 'receita' | 'despesa';

export type RecurrenceFrequency = 'mensal' | 'semanal' | 'anual';

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
  coupleId?: string;

  // Transações Recorrentes
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceEndDate?: string | null;
  recurrenceParentId?: string | null; // Id da transação modelo

  // Fila Offline Outbox
  pendingSync?: boolean;
}

export interface CategoryBudget {
  id?: string;
  category: string;
  limit: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export interface SavingsGoal {
  id: string;
  title: string;
  description: string;
  currentAmount: number;
  targetAmount: number;
}

export interface Couple {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface CoupleMember {
  id: string;
  coupleId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  subtitle: string;
  email: string;
  avatarUrl: string;
  totalBalance: number;
  monthlyIncomeGoal: number;
  totalBudgetGoal: number; // Mantido para retrocompatibilidade
  categoryBudgets?: CategoryBudget[];
  customCategories?: CustomCategory[];
  partner1Name?: string;
  partner2Name?: string;
  savingsGoal?: SavingsGoal; // Retrocompatibilidade (meta única legada)
  savingsGoals?: SavingsGoal[]; // Múltiplas Metas de Poupança
  coupleId?: string;
  inviteCode?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'danger' | 'info';
  message: string;
}

export interface OCCConflict {
  localTx: Transaction;
  serverTx: Transaction;
}

export interface CoupleBalanceResult {
  p1Name: string;
  p2Name: string;
  p1Paid: number;
  p2Paid: number;
  sharedTotal: number;
  netBalance: number; // >0: p2 deve a p1, <0: p1 deve a p2
  debtorName: string;
  creditorName: string;
  amountOwed: number;
  isSettled: boolean;
  hasNamesConfigured: boolean;
}
