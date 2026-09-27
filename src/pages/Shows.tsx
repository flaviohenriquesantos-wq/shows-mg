import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useDados } from '../lib/dados'
import type { Show } from '../types'
import { exportarCSV, fmtBRL, fmtData, hojeISO, normaliza } from '../lib/util'
import { Vazio } from '../components/ui'

export default function Shows() {
  const { shows, porId, municipios, recarregarShows, atualizarMunicipio } = useDados()
  const hoje = hojeISO()
  const [novo, setNovo] = useState(false)

  const proximos = shows.filter((s) => s.data >= hoje && s.situacao !== 'Cancelado')
  const passados = shows.filter((s) => s.data < hoje || s.situacao === 'Cancelado').reverse()

  async function mudar(s: Show, situacao: Show['situacao']) {
    await supabase.from('shows').update({ situacao }).eq('id', s.id)
    recarregarShows()
  }
  async function apagar(s: Show) {
    if (!confirm('Apagar este show?')) return
    await supabase.from('shows').delete().eq('id', s.id)
    recarregarShows()
  }

  const Linha = ({ s }: { s: Show }) => {
    const m = porId.get(s.municipio_id)
    return (
      <div className="linha-show">
        <div className="ls-data">{fmtData(s.data)}</div>
        <div className="ls-meio">
          <Link to={`/cidades/${s.municipio_id}`}>
            <strong>{m?.nome ?? s.municipio_id}</strong>
          </Link>
          <div className="pequeno muted">
            {s.evento ?? 'Show'} {m ? `· ${m.distancia} km` : ''}
          </div>
        </div>
        <div className="ls-dir">
          <strong>{fmtBRL(s.cache)}</strong>
          <select value={s.situacao} onChange={(e) => mudar(s, e.target.value as Show['situacao'])}>
            <option>Confirmado</option>
            <option>Realizado</option>
            <option>Cancelado</option>
          </select>
          <button className="btn-x" onClick={() => apagar(s)} title="Apagar">
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina">
      <div className="titulo-linha">
        <h1>Shows</h1>
        <div className="linha-botoes">
          <button
            className="btn"
            onClick={() =>
              exportarCSV(
                'shows.csv',
                shows.map((s) => ({
                  Data: fmtData(s.data),
                  Cidade: porId.get(s.municipio_id)?.nome ?? s.municipio_id,
                  Evento: s.evento,
                  'Cachê (R$)': s.cache,
                  Situação: s.situacao,
                })),
              )
            }
          >
            Exportar
          </button>
          <button className="btn primario" onClick={() => setNovo(true)}>
            + Show
          </button>
        </div>
      </div>

      {novo && (
        <NovoShowGeral
          municipios={municipios.map((m) => ({ id: m.id, nome: m.nome }))}
          fechar={() => setNovo(false)}
          aoSalvar={async (mid) => {
            await recarregarShows()
            const m = porId.get(mid)
            if (m && m.status !== 'Fechado') await atualizarMunicipio(mid, { status: 'Fechado' })
            setNovo(false)
          }}
        />
      )}

      <section className="card">
        <h2>Agenda ({proximos.length})</h2>
        {proximos.length === 0 && <Vazio>Nenhum show agendado.</Vazio>}
        {proximos.map((s) => (
          <Linha key={s.id} s={s} />
        ))}
      </section>
      <section className="card">
        <h2>Realizados e cancelados</h2>
        {passados.length === 0 && <Vazio>Nada por aqui ainda.</Vazio>}
        {passados.map((s) => (
          <Linha key={s.id} s={s} />
        ))}
      </section>
    </div>
  )
}

function NovoShowGeral({
  municipios,
  fechar,
  aoSalvar,
}: {
  municipios: { id: number; nome: string }[]
  fechar: () => void
  aoSalvar: (municipioId: number) => Promise<void>
}) {
  const [cidade, setCidade] = useState('')
  const [f, setF] = useState({ data: '', evento: '', cache: '' })
  const [erro, setErro] = useState<string | null>(null)
  const achada = useMemo(() => municipios.find((m) => normaliza(m.nome) === normaliza(cidade)), [cidade, municipios])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!achada) return setErro('Escolha uma cidade da lista.')
    const { error } = await supabase.from('shows').insert({
      municipio_id: achada.id,
      data: f.data,
      evento: f.evento || null,
      cache: f.cache === '' ? null : Number(f.cache),
    })
    if (error) return setErro(error.message)
    await aoSalvar(achada.id)
  }

  return (
    <form className="card" onSubmit={salvar}>
      <h2>Novo show</h2>
      <label>
        Cidade
        <input list="lista-cidades" value={cidade} onChange={(e) => setCidade(e.target.value)} required autoFocus />
        <datalist id="lista-cidades">
          {municipios.map((m) => (
            <option key={m.id} value={m.nome} />
          ))}
        </datalist>
      </label>
      <div className="campos-2">
        <label>
          Data
          <input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} required />
        </label>
        <label>
          Cachê (R$)
          <input type="number" min={0} step={100} value={f.cache} onChange={(e) => setF({ ...f, cache: e.target.value })} />
        </label>
      </div>
      <label>
        Evento
        <input value={f.evento} placeholder="Ex.: Carnaval 2027" onChange={(e) => setF({ ...f, evento: e.target.value })} />
      </label>
      {erro && <div className="msg-erro">{erro}</div>}
      <div className="linha-botoes">
        <button className="btn primario">Salvar</button>
        <button type="button" className="btn" onClick={fechar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
