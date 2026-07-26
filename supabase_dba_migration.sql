-- ============================================================================
-- SCRIPT DE MIGRAÇÃO COMPLETA DBA (PRECISÃO MONETÁRIA, AUDITORIA E CONCORRÊNCIA)
-- Executar no SQL Editor do seu Dashboard Supabase
-- ============================================================================

-- 1. Garante precisão numérico-monetária exata de 2 casas decimais (NUMERIC 12,2)
ALTER TABLE public.transactions 
  ALTER COLUMN amount TYPE NUMERIC(12,2) USING ROUND(amount::NUMERIC, 2);

-- 2. Normalização de dados históricos para tipo 'receita' e 'despesa'
UPDATE public.transactions SET type = 'receita' WHERE type = 'income';
UPDATE public.transactions SET type = 'despesa' WHERE type = 'expense';

-- 3. Adiciona constraint estrita de tipo
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS check_type_valid;

ALTER TABLE public.transactions 
ADD CONSTRAINT check_type_valid CHECK (type IN ('receita', 'despesa'));

-- 4. Adiciona coluna de controle de versão para evitar Race Conditions (OCC)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'version'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN version INT DEFAULT 1;
    END IF;
END $$;

-- 5. Tabela de Auditoria Histórica (Audit Log)
CREATE TABLE IF NOT EXISTS public.transactions_audit_log (
    audit_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    action_type VARCHAR(10) NOT NULL, -- 'UPDATE' ou 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Habilita RLS na Tabela de Auditoria
ALTER TABLE public.transactions_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver auditoria de suas próprias transações" ON public.transactions_audit_log;
CREATE POLICY "Usuários podem ver auditoria de suas próprias transações" 
ON public.transactions_audit_log FOR SELECT 
USING (auth.uid() = changed_by);

-- 7. Trigger Function para gravação de auditoria automática
CREATE OR REPLACE FUNCTION public.process_transaction_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.transactions_audit_log (transaction_id, action_type, old_data, new_data, changed_by)
        VALUES (OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.transactions_audit_log (transaction_id, action_type, old_data, changed_by)
        VALUES (OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Associação da Trigger na Tabela Transactions
DROP TRIGGER IF EXISTS trg_audit_transactions ON public.transactions;
CREATE TRIGGER trg_audit_transactions
AFTER UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.process_transaction_audit();
