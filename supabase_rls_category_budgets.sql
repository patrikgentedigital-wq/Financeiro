-- ============================================================================
-- RLS PARA TABELA category_budgets
-- Executar no SQL Editor do Dashboard Supabase
-- ============================================================================

-- 1. Garante que a coluna user_id exista
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'category_budgets' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.category_budgets 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Habilita Row Level Security
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

-- 3. Remove políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver seus próprios orçamentos" ON public.category_budgets;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios orçamentos" ON public.category_budgets;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios orçamentos" ON public.category_budgets;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios orçamentos" ON public.category_budgets;

-- 4. Cria Políticas RLS estritas
CREATE POLICY "Usuários podem ver seus próprios orçamentos" 
ON public.category_budgets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios orçamentos" 
ON public.category_budgets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios orçamentos" 
ON public.category_budgets FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios orçamentos" 
ON public.category_budgets FOR DELETE 
USING (auth.uid() = user_id);
