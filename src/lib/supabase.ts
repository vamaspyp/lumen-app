import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env. ' +
    'Después de modificar el .env, reiniciá el dev server (Ctrl+C y npm run dev).'
  )
}

export const supabase = createClient(url, anonKey)