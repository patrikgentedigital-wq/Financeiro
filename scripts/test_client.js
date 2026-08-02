import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY?.trim();
const TEST_EMAIL = process.env.TEST_EMAIL?.trim();
const TEST_PASSWORD = process.env.TEST_PASSWORD;

const requiredVariables = {
  VITE_SUPABASE_URL: SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
  TEST_EMAIL,
  TEST_PASSWORD,
};

const missingVariables = Object.entries(requiredVariables)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingVariables.length > 0) {
  throw new Error(`Configure as variáveis de ambiente: ${missingVariables.join(', ')}`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.error('Falha na autenticação:', error.message);
    process.exitCode = 1;
    return;
  }

  console.log('Autenticação concluída:', Boolean(data.user));
}

test();
