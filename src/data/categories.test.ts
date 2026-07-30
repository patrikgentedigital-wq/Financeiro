import { describe, it, expect } from 'vitest';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryEmoji } from './categories';

describe('categories', () => {
  it('todas as categorias têm id, name e icon', () => {
    ALL_CATEGORIES.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.id.length).toBeGreaterThan(0);
      expect(category.name).toBeDefined();
      expect(category.name.length).toBeGreaterThan(0);
      expect(category.icon).toBeDefined();
      expect(category.icon.length).toBeGreaterThan(0);
      expect(category.emoji).toBeDefined();
    });
  });

  it('não há IDs duplicados nas categorias', () => {
    const ids = ALL_CATEGORIES.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('categorias de despesa e receita estão presentes', () => {
    expect(EXPENSE_CATEGORIES.length).toBeGreaterThan(0);
    expect(INCOME_CATEGORIES.length).toBeGreaterThan(0);
    
    // Verifica se os tipos estão corretos
    EXPENSE_CATEGORIES.forEach(c => expect(c.type).toBe('despesa'));
    INCOME_CATEGORIES.forEach(c => expect(c.type).toBe('receita'));
  });

  describe('getCategoryEmoji', () => {
    it('deve retornar emoji exato para categoria existente', () => {
      expect(getCategoryEmoji('Alimentação')).toBe('🍔');
      expect(getCategoryEmoji('Salário')).toBe('💼');
    });

    it('deve ignorar case ao buscar categoria exata', () => {
      expect(getCategoryEmoji('aLiMeNtAçÃo')).toBe('🍔');
    });

    it('deve usar fallback para "receita"', () => {
      expect(getCategoryEmoji('Categoria Inexistente', 'receita')).toBe('💼');
    });

    it('deve usar fallback de string para mercado/restaurante', () => {
      expect(getCategoryEmoji('Ida ao restaurante')).toBe('🍔');
      expect(getCategoryEmoji('Supermercado')).toBe('🍔');
    });

    it('deve usar fallback de string para moradia', () => {
      expect(getCategoryEmoji('Conta de luz')).toBe('🏠');
      expect(getCategoryEmoji('Aluguel de casa')).toBe('🏠');
    });

    it('deve usar fallback de string para transporte', () => {
      expect(getCategoryEmoji('Uber para o trabalho')).toBe('🚗');
      expect(getCategoryEmoji('Combustível')).toBe('🚗');
    });

    it('deve usar fallback genérico de caixa para despesas desconhecidas', () => {
      expect(getCategoryEmoji('Comprei algo genérico', 'despesa')).toBe('📦');
    });
  });
});
