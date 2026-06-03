const url = 'https://bzujmohjrnqeadzjnpxd.supabase.co/rest/v1/usuarios_temp?select=dni,nombre_completo&limit=5';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dWptb2hqcm5xZWFkempucHhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTg4MDA3ODk1NSwiZXhwIjoyMDk1NjU0OTU1fQ.BYnY6MLYjUpQKEWsP8afeSJAoUcL8Yvy6jR-oIRPVlI';

async function testFetch() {
  console.log('Sending direct HTTP fetch request...');
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log('Response Status:', res.status, res.statusText);
    const body = await res.text();
    console.log('Response Body:', body);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();
