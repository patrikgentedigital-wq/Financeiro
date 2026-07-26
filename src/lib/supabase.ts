import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE (VIA VARIÁVEIS DE AMBIENTE)
// ============================================================================
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://litugojwlmlvmtrmflgg.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_bAcWwUKh8ofeGgL5HpY0FQ_viStzsBd';

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
// HELPER PARA SANITIZAÇÃO, PRECISÃO MONETÁRIA E NORMALIZAÇÃO DE TIPOS
// ============================================================================
function sanitizeAndValidateTx(tx: Partial<Transaction>): { valid: boolean; data?: any; error?: string } {
  const description = (tx.description || '').trim().slice(0, 255);
  // Garante arredondamento exato em duas casas decimais no nível do JS para evitar IEEE 754 float drift
  const rawAmount = Math.abs(Number(tx.amount));
  const amount = Math.round(rawAmount * 100) / 100;
  
  // Normalização estrita de tipo (Pontos 9)
  const rawType = (tx.type || '').toLowerCase();
  const type = rawType === 'receita' || rawType === 'income' ? 'receita' : 'despesa';

  const category = (tx.category || 'Outros').trim().slice(0, 100);
  const isShared = Boolean(tx.isShared);
  const paidBy = (tx.paidBy || 'Casal').trim().slice(0, 100);
  const date = tx.date && /^\d{4}-\d{2}-\d{2}$/.test(tx.date) ? tx.date : new Date().toISOString().split('T')[0];
  const currentVersion = typeof tx.version === 'number' ? tx.version : 1;

  if (!description) {
    return { valid: false, error: 'A descrição da transação é obrigatória.' };
  }

  if (isNaN(amount) || amount <= 0 || amount > 100000000) {
    return { valid: false, error: 'O valor da transação é inválido ou excede os limites permitidos.' };
  }

  return {
    valid: true,
    data: {
      id: tx.id,
      date,
      description,
      amount,
      type,
      category,
      is_shared: isShared,
      paid_by: paidBy,
      version: currentVersion + 1, // Nova versão esperada
      updated_at: new Date().toISOString(),
    },
  };
}

// ============================================================================
// SUPABASE AUTH HELPERS (SEM FALLBACK FALSO)
// ============================================================================
export async function signUpUser(email: string, password: string, name?: string) {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: { message: 'O Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' },
    };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: (name || 'Casal').trim().slice(0, 100),
      },
    },
  });
  return { data, error };
}

export async function signInUser(email: string, password: string) {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: { message: 'O Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' },
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

// ============================================================================
// SUPABASE DATA HELPERS (PAGINAÇÃO, REAL OCC E NORMALIZAÇÃO ESTRITA)
// ============================================================================

// Helper to fetch active transactions with pagination support (Ponto 6)
export async function fetchTransactionsFromSupabase(page: number = 1, limit: number = 100): Promise<Transaction[] | null> {
  if (!supabase) return null;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return null; // Exige usuário autenticado para RLS estrito (Ponto 2)

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('transactions')
      .select('id, date, description, amount, type, category, is_shared, paid_by, user_id, is_deleted, version')
      .eq('user_id', userId) // RLS estrito: apenas linhas do proprietário (Ponto 2)
      .or('is_deleted.eq.false,is_deleted.is.null')
      .order('date', { ascending: false })
      .range(from, to); // Paginação de banco de dados (Ponto 6)

    if (error) {
      console.warn('Falha ao carregar dados remotos do Supabase.');
      return null;
    }

    if (data && data.length > 0) {
      return data
        .filter((item: any) => !item.is_deleted)
        .map((item: any) => {
          // Normalização estrita de tipo (Ponto 9)
          const rawType = (item.type || '').toLowerCase();
          const normalizedType = rawType === 'income' || rawType === 'receita' ? 'receita' : 'despesa';

          return {
            id: String(item.id),
            date: item.date,
            description: item.description,
            amount: Math.round(Math.abs(Number(item.amount)) * 100) / 100, // Arredondamento exato
            type: normalizedType,
            category: item.category || 'Outros',
            isShared: item.is_shared ?? true,
            paidBy: item.paid_by || 'Casal',
            isDeleted: Boolean(item.is_deleted),
            version: Number(item.version) || 1,
          };
        });
    }
  } catch (err) {
    console.warn('Falha na comunicação de rede com o banco de dados.');
  }
  return null;
}

// Helper to save or update transaction with REAL OCC Concurrency Verification (Ponto 1)
export async function saveTransactionToSupabase(tx: Transaction): Promise<boolean> {
  if (!supabase) return false;
  try {
    const validation = sanitizeAndValidateTx(tx);
    if (!validation.valid || !validation.data) {
      console.warn('Tentativa de salvar transação inválida:', validation.error);
      return false;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return false;

    const expectedVersion = tx.version || 1;
    const payload = {
      ...validation.data,
      is_deleted: false,
      user_id: userId,
    };

    // Se a transação já existe, fazemos UPDATE com verificação estrita da versão anterior (REAL OCC)
    const { data: existing } = await supabase
      .from('transactions')
      .select('id, version')
      .eq('id', tx.id)
      .maybeSingle();

    if (existing) {
      // OCC CHECK: Se a versão no banco não for exatamente a versão que o cliente carregou, rejeita!
      if (Number(existing.version) !== expectedVersion) {
        console.warn(`[OCC CONFLICT] A transação ${tx.id} foi alterada por outro usuário (versão no banco: ${existing.version}, versão local: ${expectedVersion}). Alteração rejeitada.`);
        return false;
      }

      const { error, count } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', tx.id)
        .eq('version', expectedVersion); // Verificação OCC no WHERE

      if (error || (count !== null && count === 0)) {
        console.warn('[OCC CONFLICT] Falha ao atualizar transação concorrente.');
        return false;
      }
    } else {
      // Nova transação (INSERT)
      const { error } = await supabase.from('transactions').insert([payload]);
      if (error) {
        console.warn('Falha na inserção da transação remota.');
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn('Erro ao processar envio de dados.');
    return false;
  }
}

// Helper to perform SOFT DELETE on transaction in Supabase securely
export async function deleteTransactionFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return false;

    const updatePayload = {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId); // RLS / IDOR check

    if (error) {
      console.warn('Falha no arquivamento seguro da transação remota.');
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Erro de rede ao arquivar transação.');
    return false;
  }
}

// Helper for Realtime channel subscription
export function subscribeToTransactionsRealtime(onDataChanged: () => void) {
  if (!supabase) return null;
  const channel = supabase
    .channel('public:transactions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
      onDataChanged();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
