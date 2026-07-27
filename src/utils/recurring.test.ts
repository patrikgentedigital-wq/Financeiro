import { describe, it, expect } from 'vitest';
import { generateRecurringOccurrences, addRecurrenceInterval } from './recurring';
import { Transaction } from '../types';

describe('Recurring Transactions Utility', () => {
  it('deve avançar datas corretamente conforme a frequência', () => {
    expect(addRecurrenceInterval('2026-01-15', 'mensal')).toBe('2026-02-15');
    expect(addRecurrenceInterval('2026-01-15', 'semanal')).toBe('2026-01-22');
    expect(addRecurrenceInterval('2026-01-15', 'anual')).toBe('2027-01-15');
  });

  it('deve gerar ocorrências sem duplicar datas existentes', () => {
    const baseTx: Transaction = {
      id: 'tx-parent-1',
      date: '2026-07-01',
      description: 'Aluguel Recorrente',
      amount: 2500,
      type: 'despesa',
      category: 'Moradia',
      isShared: true,
      isRecurring: true,
      recurrenceFrequency: 'mensal',
      recurrenceEndDate: '2026-09-30', // Limite de 3 meses
    };

    const existing: Transaction[] = [
      baseTx,
      {
        ...baseTx,
        id: 'tx-child-1',
        date: '2026-08-01',
        recurrenceParentId: 'tx-parent-1',
      },
    ];

    const generated = generateRecurringOccurrences(baseTx, existing, 12);

    // Deve gerar apenas 2026-09-01 pois 2026-08-01 já existe no array existing
    expect(generated.length).toBe(1);
    expect(generated[0].date).toBe('2026-09-01');
    expect(generated[0].recurrenceParentId).toBe('tx-parent-1');
  });
});
