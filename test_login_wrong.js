import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  const { error } = await supabase.auth.signInWithPassword({
    email: 'nonexistent@prodetalento.com',
    password: 'wrongpassword'
  })
  console.log(error?.message)
}
test()
