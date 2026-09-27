export const STATUS = [
  'A contatar',
  'Contato feito',
  'Aguardando retorno',
  'Proposta enviada',
  'Negociando',
  'Fechado',
  'Sem interesse',
  'Retomar depois',
] as const
export type Status = (typeof STATUS)[number]

export const TIPOS_INTERACAO = ['Ligação', 'WhatsApp', 'E-mail', 'Visita', 'Reunião', 'Proposta enviada', 'Outro'] as const

export interface Municipio {
  id: number
  nome: string
  regiao_intermediaria: string
  regiao_imediata: string
  populacao: number | null
  latitude: number
  longitude: number
  ddd: number | null
  slug: string | null
  status: Status
  aniversario: string | null
  festas: string | null
  meses_eventos: string | null
  setor_responsavel: string | null
  proximo_followup: string | null
  proximo_passo: string | null
  cache_proposto: number | null
  observacoes: string | null
  updated_at: string
}

/** Município com campos calculados no app */
export interface MunicipioCalc extends Municipio {
  distancia: number
  prioridade: 'A' | 'B' | 'C'
  porte: string
}

export interface Contato {
  id: string
  municipio_id: number
  nome: string
  cargo: string | null
  telefone: string | null
  whatsapp: string | null
  email: string | null
  principal: boolean
  created_at: string
}

export interface Interacao {
  id: string
  municipio_id: number
  data: string
  tipo: string
  descricao: string | null
  usuario_email: string | null
  created_at: string
}

export interface Show {
  id: string
  municipio_id: number
  data: string
  evento: string | null
  cache: number | null
  situacao: 'Confirmado' | 'Realizado' | 'Cancelado'
  observacoes: string | null
  created_at: string
}

export interface Config {
  cidade_base: string
  fator_estrada: string
  raio_a: string
  raio_b: string
  msg_whatsapp: string
  msg_email_assunto: string
  msg_email_corpo: string
  nome_banda: string
}
