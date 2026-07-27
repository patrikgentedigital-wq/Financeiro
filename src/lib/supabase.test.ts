import { describe, it, expect } from 'vitest';
import { sanitizeAndValidateTx } from './supabase';

describe('Supabase Data Sanitization & OCC Validation', () => {
  it('deve rejeitar transações sem descrição', () => {
    const res = sanitizeAndValidateTx({
      description: '   ',
      amount: 100,
      type: 'despesa',
    });

    expect(res.valid).toBe(false);
    expect(res.error).toBe('A descrição da transação é obrigatória.');
  });

  it('deve rejeitar transações com valor inválido ou menor/igual a zero', () => {
    const resZero = sanitizeAndValidateTx({
      description: 'Teste',
      amount: 0,
      type: 'despesa',
    });

    expect(resZero.valid).toBe(false);
    expect(resZero.error).toBe('O valor da transação é inválido ou excede os limites permitidos.');
  });

  it('deve arredondar valores e normalizar tipos corretamente', () => {
    const res = sanitizeAndValidateTx({
      id: 'tx-123',
      description: ' Aluguel ',
      amount: 1500.555,
      type: 'despesa',
      version: 2,
    });

    expect(res.valid).toBe(true);
    expect(res.data?.description).toBe('Aluguel');
    expect(res.data?.amount).toBe(1500.56); // Arredondado exato para 2 casas
    expect(res.data?.version).toBe(3); // Incrementado de 2 para 3 (OCC)
  });
});
