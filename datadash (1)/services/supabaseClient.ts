import { createClient } from '@supabase/supabase-js';

// -------------------------------------------------------------------------
// CONFIGURAÇÃO PÚBLICA (HARDCODED)
// Para compartilhar o site, as credenciais devem estar fixas aqui.
// A chave 'anon' é segura para uso no frontend se o RLS estiver ativo no Supabase.
// -------------------------------------------------------------------------

const SUPABASE_URL: string = 'https://zzrvagsvcughyybznruh.supabase.co';

// ATENÇÃO: Substitua o texto abaixo pela sua chave 'anon public' real do Supabase.
// Ela é um texto longo que começa com "eyJhbGci..."
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cnZhZ3N2Y3VnaHl5YnpucnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjMzOTcsImV4cCI6MjA4MTk5OTM5N30.NgYh7VArbZVldXIBRcAecMdi4jAmIS90d1WHqaLZWyE'; 

// Verifica se a chave foi preenchida pelo desenvolvedor
export const isSupabaseConfigured = SUPABASE_ANON_KEY !== 'COLE_SUA_CHAVE_ANON_PUBLIC_AQUI' && SUPABASE_ANON_KEY.length > 20;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função removida pois não salvamos mais no localStorage
export const saveSupabaseKey = (key: string) => {
  console.warn("Chaves agora são gerenciadas via código, não via navegador.");
};