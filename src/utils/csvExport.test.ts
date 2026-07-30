import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportTransactionsToCSV } from './csvExport';
import { Transaction } from '../types';

describe('exportTransactionsToCSV', () => {
  let createdObjectURLs: string[] = [];

  beforeEach(() => {
    createdObjectURLs = [];
    global.URL.createObjectURL = vi.fn((blob) => {
      (global.URL.createObjectURL as any).lastBlob = blob;
      const url = 'blob:test-url-' + createdObjectURLs.length;
      createdObjectURLs.push(url);
      return url;
    });
    global.URL.revokeObjectURL = vi.fn();
    
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        vi.spyOn(el, 'click').mockImplementation(() => {});
      }
      return el;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getExportedCsvContent = async () => {
    const blob = (global.URL.createObjectURL as any).lastBlob as Blob;
    if (!blob) return '';
    return await blob.text();
  };

  it('deve gerar CSV apenas com header quando array vazio', async () => {
    exportTransactionsToCSV([]);
    const content = await getExportedCsvContent();
    const expectedHeader = 'Data,Descrição,Tipo,Categoria,Escopo,Responsável,Valor (R$)';
    expect(content.replace(/^\uFEFF/, '')).toBe(expectedHeader);
  });

  it('deve formatar transações corretamente', async () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        description: 'Compra Mercado',
        amount: 150.5,
        type: 'despesa',
        date: '2023-10-05',
        category: 'Alimentação',
        isShared: true,
        paidBy: 'João'
      }
    ];

    exportTransactionsToCSV(transactions);
    const content = await getExportedCsvContent();
    const lines = content.split('\n');
    
    expect(lines.length).toBe(2);
    expect(lines[1]).toBe('05/10/2023,"Compra Mercado",Despesa,"Alimentação",Casal,"João",150.50');
  });

  it('deve escapar aspas e caracteres especiais', async () => {
    const transactions: Transaction[] = [
      {
        id: '2',
        description: 'Produto "Teste" com vírgula, e mais',
        amount: 10,
        type: 'receita',
        date: '2023-10-06',
        category: 'Categoria "X"',
        isShared: false,
        paidBy: 'Maria "A"'
      }
    ];

    exportTransactionsToCSV(transactions);
    const content = await getExportedCsvContent();
    const lines = content.split('\n');
    
    expect(lines[1]).toContain('"Produto ""Teste"" com vírgula, e mais"');
    expect(lines[1]).toContain('"Categoria ""X"""');
    expect(lines[1]).toContain('"Maria ""A"""');
  });

  it('deve manter a precisão dos valores monetários (2 casas)', async () => {
    const transactions: Transaction[] = [
      {
        id: '3',
        description: 'Teste',
        amount: 19.999, // Should round or just toFixed(2)
        type: 'despesa',
        date: '2023-10-07',
        category: 'Teste',
        isShared: false,
        paidBy: 'Teste'
      },
      {
        id: '4',
        description: 'Teste 2',
        amount: 10,
        type: 'despesa',
        date: '2023-10-08',
        category: 'Teste',
        isShared: false,
        paidBy: 'Teste'
      }
    ];

    exportTransactionsToCSV(transactions);
    const content = await getExportedCsvContent();
    const lines = content.split('\n');
    
    expect(lines[1]).toContain('20.00'); // 19.999.toFixed(2) is '20.00'
    expect(lines[2]).toContain('10.00'); // 10.toFixed(2) is '10.00'
  });
});
