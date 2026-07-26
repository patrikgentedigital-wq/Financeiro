import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE (VIA VARIÁVEIS DE AMBIENTE)
// ============================================================================
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  SUPABASE_URL.trim().length > 0 &&
  SUPABASE_ANON_KEY.trim().length > 0 &&
  SUPABASE_URL !== 'SUA_URL_AQUI';

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ============================================================================
// SUPABASE AUTH HELPERS
// ============================================================================
export async function signUpUser(email: string, password: string, name?: string) {
  if (!supabase) {
    return {
      data: { user: { email, user_metadata: { name: name || 'Casal' } }, session: { access_token: 'local-token' } },
      error: null,
    };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || 'Casal',
      },
    },
  });
  return { data, error };
}

export async function signInUser(email: string, password: string) {
  if (!supabase) {
    return {
      data: { user: { email, user_metadata: { name: 'Casal' } }, session: { access_token: 'local-token' } },
      error: null,
    };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOutUser() {
  if (!supabase) return true;
  const { error } = await supabase.auth.signOut();
  return !error;
}

// Helper to fetch transactions from Supabase if active, otherwise return null
export async function fetchTransactionsFromSupabase(): Promise<Transaction[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar do Supabase, usando estado local:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        id: String(item.id),
        date: item.date,
        description: item.description,
        amount: Number(item.amount),
        type: item.type === 'income' || item.type === 'receita' ? 'receita' : 'despesa',
        category: item.category || 'Outros',
        isShared: item.is_shared ?? item.isShared ?? true,
        paidBy: item.paid_by || item.paidBy || 'Casal',
      }));
    }
  } catch (err) {
    console.warn('Falha de conexão com Supabase:', err);
  }
  return null;
}

// Helper to save or sync transaction to Supabase
export async function saveTransactionToSupabase(tx: Transaction): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const payload: Record<string, any> = {
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      is_shared: tx.isShared,
      paid_by: tx.paidBy || 'Casal',
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { error } = await supabase.from('transactions').upsert([payload]);
    if (error) {
      console.warn('Erro ao salvar no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha de inserção no Supabase:', err);
    return false;
  }
}

// Helper to delete transaction from Supabase
export async function deleteTransactionFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.warn('Erro ao deletar no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha de deleção no Supabase:', err);
    return false;
  }
}
