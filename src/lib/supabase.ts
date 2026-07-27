import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE (VIA VARIÁVEIS DE AMBIENTE SANITIZADAS)
// ============================================================================
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || '';
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() || '';

const cleanUrl = rawUrl.replace(/^["']|["']$/g, '');
const cleanKey = rawKey.replace(/^["']|["']$/g, '');

export const SUPABASE_URL =
  cleanUrl && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) && cleanUrl !== 'SUA_URL_AQUI'
    ? cleanUrl
    : '';

export const SUPABASE_ANON_KEY =
  cleanKey && cleanKey.length > 10 && cleanKey !== 'COLE_SUA_PUBLISHABLE_KEY_AQUI'
    ? cleanKey
    : '';

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  (SUPABASE_URL.startsWith('http://') || SUPABASE_URL.startsWith('https://')) &&
  SUPABASE_ANON_KEY.length > 10;

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ============================================================================
// HELPER PARA SANITIZAÇÃO, PRECISÃO MONETÁRIA E NORMALIZAÇÃO DE TIPOS
// ============================================================================
export function sanitizeAndValidateTx(tx: Partial<Transaction>): { valid: boolean; data?: any; error?: string } {
  const description = (tx.description || '').trim().slice(0, 255);
  // Arredondamento exato em duas casas decimais no JS
  const rawAmount = Math.abs(Number(tx.amount));
  const amount = Math.round(rawAmount * 100) / 100;

  // Normalização estrita de tipo
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
// SUPABASE AUTH HELPERS (CADASTRO, CASAL E SESSÃO)
// ============================================================================
export async function signUpUser(email: string, password: string, name?: string, inviteCode?: string) {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: { message: 'O Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' },
    };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: (name || 'Casal').trim().slice(0, 100),
          invite_code: (inviteCode || '').trim(),
        },
      },
    });

    if (error) return { data, error };

    // Se houver usuário e inviteCode, associar ao casal existente
    if (data.user && inviteCode?.trim()) {
      try {
        const { data: coupleData } = await supabase
          .from('couples')
          .select('id')
          .eq('invite_code', inviteCode.trim())
          .single();

        if (coupleData) {
          await supabase.from('couple_members').insert([
            { couple_id: coupleData.id, user_id: data.user.id }
          ]);
        }
      } catch (e) {
        console.warn('Tabelas de casal ainda não migradas no banco Supabase.');
      }
    }

    return { data, error: null };
  } catch (err: any) {
    return {
      data: { user: null, session: null },
      error: { message: err?.message || 'Falha de conexão ao criar conta.' },
    };
  }
}

export async function signInUser(email: string, password: string) {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: { message: 'O Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' },
    };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (err: any) {
    return {
      data: { user: null, session: null },
      error: { message: err?.message || 'Falha de conexão com o Supabase.' },
    };
  }
}

export async function signOutUser() {
  if (!supabase) return true;
  const { error } = await supabase.auth.signOut();
  return !error;
}

// ============================================================================
// SUPABASE DATA HELPERS (PAGINAÇÃO COMPLETA, OCC RESILIENTE E INCREMENTAL REALTIME)
// ============================================================================

// Helper to fetch ALL active transactions across pages iteratively (Item 5)
export async function fetchAllTransactionsFromSupabase(): Promise<Transaction[] | null> {
  if (!supabase) return null;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return null;

    let allTransactions: Transaction[] = [];
    let page = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, description, amount, type, category, is_shared, paid_by, user_id, is_deleted, version, couple_id')
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('date', { ascending: false })
        .range(from, to);

      if (error) {
        console.warn('Falha na busca paginada de transações.');
        break;
      }

      if (data && data.length > 0) {
        const mapped = data.map((item: any) => {
          const rawType = (item.type || '').toLowerCase();
          const normalizedType = rawType === 'income' || rawType === 'receita' ? 'receita' : 'despesa';

          return {
            id: String(item.id),
            date: item.date,
            description: item.description,
            amount: Math.round(Math.abs(Number(item.amount)) * 100) / 100,
            type: normalizedType,
            category: item.category || 'Outros',
            isShared: item.is_shared ?? true,
            paidBy: item.paid_by || 'Casal',
            isDeleted: Boolean(item.is_deleted),
            version: Number(item.version) || 1,
            coupleId: item.couple_id,
          };
        });

        allTransactions = [...allTransactions, ...mapped];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    return allTransactions;
  } catch (err) {
    console.warn('Erro de rede ao buscar histórico de transações.');
  }
  return null;
}

export interface SaveTxResult {
  success: boolean;
  conflict?: boolean;
  serverTx?: Transaction;
  error?: string;
}

// Helper to save or update transaction with OCC Concurrency Verification (Item 4)
export async function saveTransactionToSupabase(
  tx: Transaction,
  forceOverwrite: boolean = false
): Promise<SaveTxResult> {
  if (!supabase) return { success: false, error: 'Supabase não configurado.' };
  try {
    const validation = sanitizeAndValidateTx(tx);
    if (!validation.valid || !validation.data) {
      return { success: false, error: validation.error || 'Transação inválida.' };
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return { success: false, error: 'Usuário não autenticado.' };

    const expectedVersion = tx.version || 1;
    const payload = {
      ...validation.data,
      is_deleted: false,
      user_id: userId,
    };

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('transactions')
      .select('id, date, description, amount, type, category, is_shared, paid_by, version, couple_id')
      .eq('id', tx.id)
      .maybeSingle();

    if (existing) {
      const serverVersion = Number(existing.version) || 1;

      // OCC CHECK: Se a versão no banco for diferente e não for forceOverwrite, sinaliza CONFLITO!
      if (serverVersion !== expectedVersion && !forceOverwrite) {
        const serverTx: Transaction = {
          id: String(existing.id),
          date: existing.date,
          description: existing.description,
          amount: Number(existing.amount),
          type: existing.type === 'income' || existing.type === 'receita' ? 'receita' : 'despesa',
          category: existing.category,
          isShared: existing.is_shared,
          paidBy: existing.paid_by,
          version: serverVersion,
          coupleId: existing.couple_id,
        };

        return {
          success: false,
          conflict: true,
          serverTx,
          error: 'Conflito de concorrência OCC: Esta transação foi editada por outro parceiro.',
        };
      }

      // Atualizar com a nova versão
      const updatePayload = {
        ...payload,
        version: forceOverwrite ? serverVersion + 1 : expectedVersion + 1,
      };

      const { error } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', tx.id);

      if (error) return { success: false, error: error.message };
    } else {
      // Inserção nova
      const { error } = await supabase.from('transactions').insert([payload]);
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao processar salvamento.' };
  }
}

// Helper to perform SOFT DELETE on transaction
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
      .eq('id', id);

    return !error;
  } catch (err) {
    return false;
  }
}

export type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord?: any;
  oldRecord?: any;
};

// Helper for Realtime channel subscription with INCREMENTAL updates (Item 6)
export function subscribeToTransactionsRealtime(
  onIncrementalChange: (change: RealtimePayload) => void
) {
  if (!supabase) return null;
  const channel = supabase
    .channel('public:transactions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload: any) => {
      onIncrementalChange({
        eventType: payload.eventType,
        newRecord: payload.new,
        oldRecord: payload.old,
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
