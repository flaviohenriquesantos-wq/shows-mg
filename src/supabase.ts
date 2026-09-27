import { createClient } from '@supabase/supabase-js'

// Projeto "shows-mg". A chave anon é pública por natureza (vai no navegador de qualquer forma).
// Variáveis de ambiente, se definidas, têm prioridade.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://xidgqtomrlhtxlznrzov.supabase.co'
const key =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZGdxdG9tcmxodHhsem5yem92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NDU4MDAsImV4cCI6MjEwNjEyMTgwMH0.jGoXVfzfUMYyZ1O8NdJGeeLPjIsYZKIbzbfCH3rOF0s'

export const configurado = Boolean(url && key)

export const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
