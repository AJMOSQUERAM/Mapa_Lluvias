import { createClient } from '@supabase/supabase-js';


// En tu archivo supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL:', supabaseUrl); // ← Verifica que no sea undefined
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey?.substring(0, 10) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables no cargadas correctamente');
} else {
  console.log('✅ Variables cargadas');
}
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');


