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

fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
})
.then(async (response) => {
  const body = await response.json();

  if (!response.ok) {
    console.error('Falha na autenticação:', body.error_description || body.msg || `HTTP ${response.status}`);
    process.exitCode = 1;
    return;
  }

  console.log('Autenticação concluída:', Boolean(body.user));
})
.catch((error) => {
  console.error('Falha de rede:', error.message);
  process.exitCode = 1;
});
