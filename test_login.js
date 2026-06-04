import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  console.log('Testing admin...')
  const adminRes = await supabase.auth.signInWithPassword({
    email: 'admin@escencial.com',
    password: 'admin1234'
  })
  console.log('Admin:', adminRes.error ? adminRes.error.message : 'OK')

  console.log('Testing 44444444...')
  const userRes = await supabase.auth.signInWithPassword({
    email: '44444444@prodetalento.com',
    password: '44444444'
  })
  console.log('User:', userRes.error ? userRes.error.message : 'OK')
}

test()
