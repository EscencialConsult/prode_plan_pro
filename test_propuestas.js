import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('propuestas')
    .insert([{ area: 'Capacitación', propuesta: 'Prueba desde script' }])
    .select()

  if (error) {
    console.error('Supabase Error:', error)
  } else {
    console.log('Success:', data)
  }
}

test()
