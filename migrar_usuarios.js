import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Leer archivo .env manualmente sin depender de librerías externas
const envFile = fs.readFileSync('.env', 'utf-8')
const envConfig = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let key = match[1]
    let value = match[2] || ''
    // Limpiar comillas si tiene
    value = value.replace(/^['"](.*)['"]$/, '$1').trim()
    envConfig[key] = value
  }
})

const supabaseUrl = envConfig['VITE_SUPABASE_URL']
const supabaseServiceKey = envConfig['VITE_SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_SERVICE_ROLE_KEY en el .env")
  process.exit(1)
}

// Inicializar cliente de Supabase con el Service Role Key (Admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function migrateUsers() {
  console.log("Iniciando migración y activación de usuarios...")
  
  // 1. Obtener todos los usuarios de public.usuarios
  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('*')
    .not('dni', 'is', null) // Filtrar solo los que tengan DNI cargado
    
  if (error) {
    console.error("Error al obtener usuarios de tu base de datos:", error)
    return
  }
  
  console.log(`Se encontraron ${usuarios.length} usuarios con DNI en public.usuarios.`)

  let successCount = 0
  let errorCount = 0

  // 2. Iterar sobre los usuarios para crearles la cuenta de login y activarlos
  for (const user of usuarios) {
    const email = user.email.toLowerCase().trim()
    const dniPassword = String(user.dni).trim()
    
    // Verificamos si el usuario ya existe en Supabase Auth
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userAlreadyAuth = existingUser?.users?.find(u => u.email === email)

    if (userAlreadyAuth) {
      // Si ya existe, forzamos a cambiar la contraseña al DNI actual
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userAlreadyAuth.id,
        { password: dniPassword }
      )
      
      if (updateError) {
        console.error(`❌ Error con contraseña para ${email}:`, updateError.message)
        errorCount++
      } else {
        console.log(`✔ Contraseña actualizada a su DNI para: ${email}`)
        successCount++
      }
    } else {
      // Si no existe cuenta de acceso, la creamos usando su DNI
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: dniPassword,
        email_confirm: true,
        user_metadata: { nombre: user.nombre }
      })

      if (createError) {
        console.error(`❌ Error creando login para ${email}:`, createError.message)
        errorCount++
      } else {
        console.log(`✔ Login creado con su DNI para: ${email}`)
        // Vinculamos el ID de la tabla usuarios al Auth generado
        await supabase.from('usuarios').update({ id: newUser.user.id }).eq('email', email)
        successCount++
      }
    }
  }

  // 3. Finalmente, activar de golpe a todos los que quedaron pendientes
  console.log("\nActivando a todos los usuarios pendientes...")
  const { error: actError } = await supabase
    .from('usuarios')
    .update({ estado: 'activo' })
    .eq('estado', 'pendiente')

  if (actError) {
    console.error("Hubo un error al activar a los usuarios:", actError)
  } else {
    console.log("✔ ¡Todos los usuarios pendientes fueron ACTIVADOS!")
  }

  console.log(`\n--- RESUMEN ---`)
  console.log(`✅ Éxitos: ${successCount}`)
  console.log(`❌ Errores: ${errorCount}`)
  console.log(`¡Proceso finalizado! Ya pueden entrar con email y su DNI.`)
}

migrateUsers()
