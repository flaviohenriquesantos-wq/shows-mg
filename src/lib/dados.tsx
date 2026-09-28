import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../supabase'
import type { Config, Municipio, MunicipioCalc, Show } from '../types'
import { calcular } from './util'

const CONFIG_PADRAO: Config = {
  cidade_base: '3145208',
  fator_estrada: '1.3',
  raio_a: '150',
  raio_b: '300',
  msg_whatsapp: '',
  msg_email_assunto: '',
  msg_email_corpo: '',
  nome_banda: '',
  antecedencia_meses: '6',
}

interface Dados {
  carregando: boolean
  erro: string | null
  municipios: MunicipioCalc[]
  porId: Map<number, MunicipioCalc>
  config: Config
  shows: Show[]
  recarregar: () => Promise<void>
  atualizarMunicipio: (id: number, campos: Partial<Municipio>) => Promise<string | null>
  salvarConfig: (c: Partial<Config>) => Promise<string | null>
  recarregarShows: () => Promise<void>
}

interface Resumo {
  municipio_id: number
  qtd: number
  mediana: number | null
  maior: number | null
  ultima: string | null
}

const Ctx = createContext<Dados | null>(null)

export function DadosProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<Municipio[]>([])
  const [config, setConfig] = useState<Config>(CONFIG_PADRAO)
  const [shows, setShows] = useState<Show[]>([])
  const [resumo, setResumo] = useState<Map<number, Resumo>>(new Map())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregarShows = useCallback(async () => {
    const { data } = await supabase.from('shows').select('*').order('data')
    setShows((data as Show[]) ?? [])
  }, [])

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    const [m, c, r] = await Promise.all([
      supabase.from('municipios').select('*').order('nome').range(0, 1999),
      supabase.from('config').select('*'),
      supabase.from('resumo_contratacoes').select('*').range(0, 1999),
    ])
    if (m.error || c.error) {
      setErro((m.error ?? c.error)!.message)
    } else {
      setBase(m.data as Municipio[])
      setResumo(new Map(((r.data as Resumo[]) ?? []).map((x) => [x.municipio_id, x])))
      const cfg = { ...CONFIG_PADRAO }
      for (const r of c.data as { chave: keyof Config; valor: string }[]) cfg[r.chave] = r.valor
      setConfig(cfg)
    }
    await recarregarShows()
    setCarregando(false)
  }, [recarregarShows])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const municipios = useMemo(
    () =>
      calcular(base, config).map((m) => {
        const x = resumo.get(m.id)
        return { ...m, ct_qtd: x?.qtd ?? 0, ct_mediana: x?.mediana ?? null, ct_maior: x?.maior ?? null, ct_ultima: x?.ultima ?? null }
      }),
    [base, config, resumo],
  )
  const porId = useMemo(() => new Map(municipios.map((m) => [m.id, m])), [municipios])

  const atualizarMunicipio = useCallback(async (id: number, campos: Partial<Municipio>) => {
    const { data, error } = await supabase.from('municipios').update(campos).eq('id', id).select().single()
    if (error) return error.message
    setBase((prev) => prev.map((m) => (m.id === id ? (data as Municipio) : m)))
    return null
  }, [])

  const salvarConfig = useCallback(async (c: Partial<Config>) => {
    const linhas = Object.entries(c).map(([chave, valor]) => ({ chave, valor: String(valor) }))
    const { error } = await supabase.from('config').upsert(linhas)
    if (error) return error.message
    setConfig((prev) => ({ ...prev, ...c }))
    return null
  }, [])

  return (
    <Ctx.Provider
      value={{ carregando, erro, municipios, porId, config, shows, recarregar, atualizarMunicipio, salvarConfig, recarregarShows }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useDados() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDados fora do provider')
  return v
}
