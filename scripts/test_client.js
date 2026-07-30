import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://biloycjmbmmjbmwbgvwn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IyuMPYnFBA5EM4SMJ6XK0A_ZebDXiau';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'patrickfurtado@gmail.com',
    password: 'patrick321'
  });
  console.log('DATA:', data);
  console.log('ERROR:', error);
}

test();
