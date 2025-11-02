// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 [SUPABASE CLIENT] Inicializando cliente de Supabase...');
console.log('🔧 [SUPABASE CLIENT] URL:', supabaseUrl);
console.log('🔧 [SUPABASE CLIENT] Anon Key presente:', !!supabaseAnonKey);

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ [SUPABASE CLIENT] Variables de entorno NO configuradas');
  console.warn('⚠️ [SUPABASE CLIENT] Usando credenciales por defecto (modo desarrollo)');
} else {
  console.log('✅ [SUPABASE CLIENT] Variables de entorno configuradas correctamente');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

console.log('✅ [SUPABASE CLIENT] Cliente creado exitosamente');
