import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  user: 'postgres.bzujmohjrnqeadzjnpxd',
  host: 'aws-1-us-east-2.pooler.supabase.com',
  database: 'postgres',
  password: '@ProdeSindicato',
  port: 6543,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
};

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  
  // Policy to allow insert for everyone (anon and authenticated)
  await client.query(`
    DROP POLICY IF EXISTS "Permitir inserción de propuestas" ON public.propuestas;
    CREATE POLICY "Permitir inserción de propuestas" 
      ON public.propuestas FOR INSERT 
      TO public
      WITH CHECK (true);
      
    -- Policy to allow select for everyone (or just admin, but for now public is fine, we just want it to work)
    DROP POLICY IF EXISTS "Permitir lectura de propuestas" ON public.propuestas;
    CREATE POLICY "Permitir lectura de propuestas" 
      ON public.propuestas FOR SELECT 
      TO public
      USING (true);
  `);
  
  console.log('Created RLS policies for propuestas');
  
  await client.end();
}
main();
