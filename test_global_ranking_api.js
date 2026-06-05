import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzujmohjrnqeadzjnpxd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dWptb2hqcm5xZWFkempucHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg5NTUsImV4cCI6MjA5NTY1NDk1NX0.ArdrsAxWbjSE74Zk-xBvEYeFqcKIPK5H3QNuqPyAl5o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: '12345678@prodetalento.com',
    password: '12345678',
  });

  if (authError) {
    console.error('Sign in failed:', authError);
    return;
  }
  console.log('Sign in success! User ID:', authData.user.id);

  console.log('Fetching global ranking via API...');
  const { data: ranking, error: rankingError } = await supabase
    .from('ranking_global')
    .select('*')
    .order('posicion', { ascending: true });

  if (rankingError) {
    console.error('Ranking fetch failed:', rankingError);
  } else {
    console.log('Ranking fetch success!');
    console.log('Number of rows:', ranking.length);
    console.log(ranking);
  }

  // Also query ranking_cache to see if it is visible
  console.log('Fetching ranking_cache via API...');
  const { data: cache, error: cacheError } = await supabase
    .from('ranking_cache')
    .select('*');

  if (cacheError) {
    console.error('Cache fetch failed:', cacheError);
  } else {
    console.log('Cache fetch success!');
    console.log('Number of rows:', cache.length);
  }
}

main().catch(err => console.error(err));
