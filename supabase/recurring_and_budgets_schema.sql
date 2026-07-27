-- ============================================================================
-- MIGRAÇÃO SQL: TRANSAÇÕES RECORRENTES E ORÇAMENTO POR CATEGORIA
-- Execute este script no SQL Editor do Supabase.
-- ============================================================================

-- 1. Colunas de Recorrência na tabela public.transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT CHECK (recurrence_frequency IN ('mensal', 'semanal', 'anual')),
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON public.transactions(recurrence_parent_id);

-- 2. Tabela de Orçamentos por Categoria (public.category_budgets)
CREATE TABLE IF NOT EXISTS public.category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Habilitar RLS em category_budgets
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver orçamentos do casal ou próprios" ON public.category_budgets
  FOR SELECT USING (
    user_id = auth.uid()
    OR couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Membros podem inserir orçamentos do casal ou próprios" ON public.category_budgets
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Membros podem atualizar orçamentos do casal ou próprios" ON public.category_budgets
  FOR UPDATE USING (
    user_id = auth.uid()
    OR couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Membros podem deletar orçamentos do casal ou próprios" ON public.category_budgets
  FOR DELETE USING (
    user_id = auth.uid()
    OR couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );

-- Habilitar publicação Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_budgets;
