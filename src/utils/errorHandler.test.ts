import { describe, it, expect } from 'vitest';
import { classifyError } from './errorHandler';

describe('classifyError', () => {
  it('deve classificar erro de rede', () => {
    const result = classifyError(new Error('Failed to fetch'));
    expect(result.category).toBe('NETWORK_ERROR');
  });
  
  it('deve classificar erro de rede com NetworkError', () => {
    const result = classifyError(new Error('NetworkError when attempting...'));
    expect(result.category).toBe('NETWORK_ERROR');
  });
  
  it('deve classificar erro de autenticação', () => {
    const result = classifyError(new Error('Invalid login credentials'));
    expect(result.category).toBe('AUTH_ERROR');
  });
  
  it('deve classificar erro de autenticação com email não confirmado', () => {
    const result = classifyError(new Error('Email not confirmed'));
    expect(result.category).toBe('AUTH_ERROR');
  });
  
  it('deve classificar conflito OCC', () => {
    const result = classifyError(new Error('OCC_CONFLICT detected'));
    expect(result.category).toBe('OCC_CONFLICT');
  });
  
  it('deve classificar conflito OCC com mensagem de versão', () => {
    const result = classifyError(new Error('Conflito de versão detectado'));
    expect(result.category).toBe('OCC_CONFLICT');
  });
  
  it('deve classificar erro de validação', () => {
    const result = classifyError(new Error('A descrição é obrigatória'));
    expect(result.category).toBe('VALIDATION_ERROR');
  });
  
  it('deve classificar erro de validação com valor inválido', () => {
    const result = classifyError(new Error('O valor é inválido'));
    expect(result.category).toBe('VALIDATION_ERROR');
  });
  
  it('deve classificar erro desconhecido para null', () => {
    const result = classifyError(null);
    expect(result.category).toBe('UNKNOWN_ERROR');
  });
  
  it('deve classificar erro desconhecido para string genérica', () => {
    const result = classifyError('algo deu errado');
    expect(result.category).toBe('UNKNOWN_ERROR');
  });
  
  it('deve classificar string diretamente como mensagem', () => {
    const result = classifyError('Failed to fetch data');
    expect(result.category).toBe('NETWORK_ERROR');
    expect(result.message).toContain('Falha de conexão');
  });
  
  it('deve preservar o erro original', () => {
    const original = new Error('test error');
    const result = classifyError(original);
    expect(result.originalError).toBe(original);
  });
});
