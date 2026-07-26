export interface CategoryDef {
  name: string;
  emoji: string;
  color: string;
  type: 'despesa' | 'receita';
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: 'Alimentação', emoji: '🍔', color: '#f59e0b', type: 'despesa' },
  { name: 'Moradia', emoji: '🏠', color: '#8b5cf6', type: 'despesa' },
  { name: 'Transporte', emoji: '🚗', color: '#3b82f6', type: 'despesa' },
  { name: 'Saúde', emoji: '🩺', color: '#ec4899', type: 'despesa' },
  { name: 'Lazer', emoji: '🎮', color: '#10b981', type: 'despesa' },
  { name: 'Educação', emoji: '📚', color: '#6366f1', type: 'despesa' },
  { name: 'Vestuário', emoji: '👕', color: '#a855f7', type: 'despesa' },
  { name: 'Outros', emoji: '📦', color: '#64748b', type: 'despesa' },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { name: 'Salário', emoji: '💼', color: '#10b981', type: 'receita' },
  { name: 'Freelance', emoji: '💻', color: '#8b5cf6', type: 'receita' },
  { name: 'Outros', emoji: '💰', color: '#f59e0b', type: 'receita' },
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
