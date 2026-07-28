export interface CategoryDef {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  color: string;
  type: 'despesa' | 'receita';
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: '1', name: 'Alimentação', emoji: '🍔', icon: '🍔', color: '#f59e0b', type: 'despesa' },
  { id: '2', name: 'Moradia', emoji: '🏠', icon: '🏠', color: '#8b5cf6', type: 'despesa' },
  { id: '3', name: 'Transporte', emoji: '🚗', icon: '🚗', color: '#3b82f6', type: 'despesa' },
  { id: '4', name: 'Saúde', emoji: '🩺', icon: '🩺', color: '#ec4899', type: 'despesa' },
  { id: '5', name: 'Lazer', emoji: '🎮', icon: '🎮', color: '#10b981', type: 'despesa' },
  { id: '6', name: 'Educação', emoji: '📚', icon: '📚', color: '#6366f1', type: 'despesa' },
  { id: '7', name: 'Vestuário', emoji: '👕', icon: '👕', color: '#a855f7', type: 'despesa' },
  { id: '8', name: 'Outros', emoji: '📦', icon: '📦', color: '#64748b', type: 'despesa' },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { id: '9', name: 'Salário', emoji: '💼', icon: '💼', color: '#10b981', type: 'receita' },
  { id: '10', name: 'Freelance', emoji: '💻', icon: '💻', color: '#8b5cf6', type: 'receita' },
  { id: '11', name: 'Outros', emoji: '💰', icon: '💰', color: '#f59e0b', type: 'receita' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryEmoji(categoryName: string, type?: 'receita' | 'despesa'): string {
  const match = ALL_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (match) return match.emoji;

  // Generic fallback based on type or string
  if (type === 'receita' || categoryName.toLowerCase().includes('renda') || categoryName.toLowerCase().includes('salário')) {
    return '💼';
  }
  if (categoryName.toLowerCase().includes('mercado') || categoryName.toLowerCase().includes('restaurante')) return '🍔';
  if (categoryName.toLowerCase().includes('luz') || categoryName.toLowerCase().includes('aluguel') || categoryName.toLowerCase().includes('casa')) return '🏠';
  if (categoryName.toLowerCase().includes('uber') || categoryName.toLowerCase().includes('combustível')) return '🚗';
  return '📦';
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}
