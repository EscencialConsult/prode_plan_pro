import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: '44866758@prodetalento.com',
    password: 'password123'
  })
  if (error) {
    console.error('Login error:', error.message)
  } else {
    console.log('Login success!')
  }
}
test()
