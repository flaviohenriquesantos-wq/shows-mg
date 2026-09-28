import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDados } from '../lib/dados'
import { STATUS } from '../types'
import { PORTES, exportarCSV, fmtBRL, fmtData, normaliza } from '../lib/util'
import { LinhaCidade, Vazio } from '../components/ui'

const ORDENS = {
  distancia: 'Mais próximas',
  nome: 'Nome (A–Z)',
  pop_desc: 'Maior população',
  pop_asc: 'Menor população',
  atualizada: 'Atualizadas recentemente',
  contratacoes: 'Mais shows contratados',
  cache: 'Maior cachê típico',
} as const

export default function Cidades() {
  const { municipios } = useDados()
  const [params, setParams] = useSearchParams()
  const [limite, setLimite] = useState(60)

  const f = {
    busca: params.get('busca') ?? '',
    prioridade: params.get('prioridade') ?? '',
    regiao: params.get('regiao') ?? '',
    porte: params.get('porte') ?? '',
    status: params.get('status') ?? '',
    contrata: params.get('contrata') ?? '',
    ordem: (params.get('ordem') ?? 'distancia') as keyof typeof ORDENS,
  }
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: true })
    setLimite(60)
  }

  const regioes = useMemo(() => [...new Set(municipios.map((m) => m.regiao_intermediaria))].sort(), [municipios])

  const lista = useMemo(() => {
    const b = normaliza(f.busca)
    const r = municipios.filter(
      (m) =>
        (!b || normaliza(m.nome).includes(b) || normaliza(m.regiao_imediata).includes(b)) &&
        (!f.prioridade || m.prioridade === f.prioridade) &&
        (!f.regiao || m.regiao_intermediaria === f.regiao) &&
        (!f.porte || m.porte === f.porte) &&
        (!f.status || m.status === f.status) &&
        (!f.contrata || (f.contrata === 'sim' ? m.ct_qtd > 0 : m.ct_qtd === 0)),
    )
    const ord: Record<string, (a: typeof r[0], b: typeof r[0]) => number> = {
      distancia: (a, b) => a.distancia - b.distancia,
      nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
      pop_desc: (a, b) => (b.populacao ?? 0) - (a.populacao ?? 0),
      pop_asc: (a, b) => (a.populacao ?? 0) - (b.populacao ?? 0),
      atualizada: (a, b) => b.updated_at.localeCompare(a.updated_at),
      contratacoes: (a, b) => b.ct_qtd - a.ct_qtd,
      cache: (a, b) => (b.ct_mediana ?? 0) - (a.ct_mediana ?? 0),
    }
    return r.sort(ord[f.ordem] ?? ord.distancia)
  }, [municipios, f.busca, f.prioridade, f.regiao, f.porte, f.status, f.contrata, f.ordem])

  const temFiltro = f.busca || f.prioridade || f.regiao || f.porte || f.status || f.contrata

  function exportar() {
    exportarCSV(
      'cidades.csv',
      lista.map((m) => ({
        'Código IBGE': m.id,
        Município: m.nome,
        'Região intermediária': m.regiao_intermediaria,
        'Região imediata': m.regiao_imediata,
        População: m.populacao,
        Porte: m.porte,
        'Distância (km)': m.distancia,
        Prioridade: m.prioridade,
        DDD: m.ddd,
        Status: m.status,
        Aniversário: m.aniversario,
        Festas: m.festas,
        'Meses dos eventos': m.meses_eventos,
        'Setor responsável': m.setor_responsavel,
        'Próximo follow-up': m.proximo_followup ? fmtData(m.proximo_followup) : '',
        'Próximo passo': m.proximo_passo,
        'Cachê proposto': m.cache_proposto,
        Observações: m.observacoes,
        'Prefeito(a)': m.prefeito,
        Partido: m.prefeito_partido,
        'Shows contratados (PNCP)': m.ct_qtd,
        'Cachê típico (PNCP)': m.ct_mediana,
        'Maior cachê (PNCP)': m.ct_maior,
      })),
    )
  }

  return (
    <div className="pagina">
      <div className="titulo-linha">
        <h1>Cidades</h1>
        <button className="btn" onClick={exportar}>
          Exportar ({lista.length})
        </button>
      </div>

      <div className="filtros card">
        <input
          className="busca"
          placeholder="Buscar cidade ou região…"
          value={f.busca}
          onChange={(e) => set('busca', e.target.value)}
        />
        <div className="filtros-linha">
          <select value={f.prioridade} onChange={(e) => set('prioridade', e.target.value)}>
            <option value="">Prioridade: todas</option>
            <option value="A">Prioridade A</option>
            <option value="B">Prioridade B</option>
            <option value="C">Prioridade C</option>
          </select>
          <select value={f.status} onChange={(e) => set('status', e.target.value)}>
            <option value="">Status: todos</option>
            {STATUS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={f.regiao} onChange={(e) => set('regiao', e.target.value)}>
            <option value="">Região: todas</option>
            {regioes.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select value={f.porte} onChange={(e) => set('porte', e.target.value)}>
            <option value="">Porte: todos</option>
            {PORTES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select value={f.contrata} onChange={(e) => set('contrata', e.target.value)}>
            <option value="">Contrata show: todas</option>
            <option value="sim">Já contratou show</option>
            <option value="nao">Sem contratação encontrada</option>
          </select>
          <select value={f.ordem} onChange={(e) => set('ordem', e.target.value)}>
            {Object.entries(ORDENS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {temFiltro && (
            <button className="btn-link" onClick={() => setParams({}, { replace: true })}>
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className="muted pequeno contagem">{lista.length} cidades</div>
      <div className="card lista">
        {lista.length === 0 && <Vazio>Nenhuma cidade com esses filtros.</Vazio>}
        {lista.slice(0, limite).map((m) => (
          <LinhaCidade
            key={m.id}
            m={m}
            extra={
              f.contrata === 'sim' || f.ordem === 'contratacoes' || f.ordem === 'cache' ? (
                <span className="pequeno">
                  {m.ct_qtd} shows{m.ct_mediana ? ` · ${fmtBRL(m.ct_mediana)}` : ''}
                </span>
              ) : undefined
            }
          />
        ))}
      </div>
      {lista.length > limite && (
        <button className="btn largo" onClick={() => setLimite((l) => l + 100)}>
          Mostrar mais ({lista.length - limite} restantes)
        </button>
      )}
    </div>
  )
}
