-- ============================================================================
-- ESQUEMA MULTIUSUÁRIO "CASAL" E POLÍTICAS DE RLS NO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase para habilitar
-- o compartilhamento seguro de transações entre duas contas individuais.
-- ============================================================================

-- 1. Criar tabela de casais / famílias
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Finanças do Casal',
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de membros do casal
CREATE TABLE IF NOT EXISTS public.couple_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Adicionar coluna couple_id na tabela de transações
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE;

-- 4. Habilitar RLS em couples e couple_members
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para couples
CREATE POLICY "Membros podem ver seu casal" ON public.couples
  FOR SELECT USING (
    id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );

-- Políticas para couple_members
CREATE POLICY "Membros podem ver parceiros do casal" ON public.couple_members
  FOR SELECT USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Usuários podem inserir sua própria associação" ON public.couple_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para transactions (RLS do Casal)
DROP POLICY IF EXISTS "Users can only access their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Couple members can select transactions" ON public.transactions;
DROP POLICY IF EXISTS "Couple members can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Couple members can update transactions" ON public.transactions;

CREATE POLICY "Couple members can select transactions" ON public.transactions
  FOR SELECT USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
    OR (couple_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Couple members can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Couple members can update transactions" ON public.transactions
  FOR UPDATE USING (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Habilitar a publicação Realtime para a tabela transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
