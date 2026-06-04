import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  console.log('Logging in as admin...')
  const { data: adminData, error: adminErr } = await supabase.auth.signInWithPassword({
    email: 'admin@escencial.com',
    password: 'admin1234'
  })
  
  if (adminErr) {
    console.log('Admin login failed:', adminErr.message)
    return
  }
  
  console.log('Admin logged in! ID:', adminData.user.id)
  
  // Find target user ID
  const { data: targetUser } = await supabase.from('usuarios').select('id').eq('email', '44444444@prodetalento.com').single()
  
  if (!targetUser) {
    console.log('Target user not found in usuarios table!')
    return
  }
  
  console.log('Target user ID:', targetUser.id)
  
  // Reset password
  console.log('Calling admin_reset_password_to_dni...')
  const { error: resetErr } = await supabase.rpc('admin_reset_password_to_dni', {
    p_admin_id: adminData.user.id,
    p_target_id: targetUser.id
  })
  
  if (resetErr) {
    console.log('Reset error:', resetErr.message)
    return
  }
  
  console.log('Reset SUCCESS!')
  
  // Test login
  console.log('Testing login with 44444444...')
  const { error: loginErr } = await supabase.auth.signInWithPassword({
    email: '44444444@prodetalento.com',
    password: '44444444'
  })
  
  console.log('Final Login:', loginErr ? loginErr.message : 'SUCCESS!')
}

test()
