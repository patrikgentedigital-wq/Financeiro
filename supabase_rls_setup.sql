-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO DE SEGURANÇA E RLS NO SUPABASE (TABELA TRANSACTIONS)
-- Executar no SQL Editor do seu Dashboard Supabase
-- ============================================================================

-- 1. Garante que a coluna user_id exista e esteja vinculada a auth.users (NOT NULL)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Adiciona suporte a Soft Delete e Audit Timestamp
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Habilita Row Level Security (RLS) na tabela
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Remapeia/Remove políticas antigas caso existam
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias transações" ON public.transactions;

-- 5. Cria Políticas de Segurança RLS Estritas (Isolamento Total por user_id)
CREATE POLICY "Usuários podem ver suas próprias transações" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id AND (is_deleted IS FALSE OR is_deleted IS NULL));

CREATE POLICY "Usuários podem inserir suas próprias transações" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias transações" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias transações" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Adiciona constraints de validação diretamente na tabela do banco
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS check_amount_positive;

ALTER TABLE public.transactions 
ADD CONSTRAINT check_amount_positive CHECK (amount >= 0 AND amount <= 100000000);

ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS check_type_valid;

ALTER TABLE public.transactions 
ADD CONSTRAINT check_type_valid CHECK (type IN ('receita', 'despesa'));
