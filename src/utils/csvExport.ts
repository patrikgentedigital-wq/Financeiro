import { Transaction } from '../types';
import { formatDateBR } from '../data/categories';

/**
 * Shared helper to export transactions to a clean, UTF-8 formatted CSV file
 */
export function exportTransactionsToCSV(transactions: Transaction[], customFilename?: string) {
  const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Escopo', 'Responsável', 'Valor (R$)'];

  const rows = transactions.map((tx) => [
    formatDateBR(tx.date),
    `"${(tx.description || '').replace(/"/g, '""')}"`,
    tx.type === 'receita' ? 'Receita' : 'Despesa',
    `"${(tx.category || '').replace(/"/g, '""')}"`,
    tx.isShared ? 'Casal' : 'Individual',
    `"${(tx.paidBy || '').replace(/"/g, '""')}"`,
    tx.amount.toFixed(2),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filename = customFilename || `Financas_do_Casal_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
