import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { useDados } from '../lib/dados'
import { STATUS } from '../types'
import { exportarCSV, fmtBRL, fmtDataHora, STATUS_COR } from '../lib/util'
import { Kpi } from '../components/ui'

interface InteracaoLeve {
  data: string
  tipo: string
  municipio_id: number
  descricao: string | null
  usuario_email: string | null
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export default function Relatorios() {
  const { municipios, shows, porId } = useDados()
  const [interacoes, setInteracoes] = useState<InteracaoLeve[]>([])
  const [ano, setAno] = useState(() => {
    const hoje = new Date().toISOString().slice(0, 10)
    const prox = shows.find((s) => s.data >= hoje && s.situacao !== 'Cancelado')
    return prox ? Number(prox.data.slice(0, 4)) : new Date().getFullYear()
  })

  useEffect(() => {
    supabase
      .from('interacoes')
      .select('data,tipo,municipio_id,descricao,usuario_email')
      .order('data', { ascending: false })
      .range(0, 9999)
      .then(({ data }) => setInteracoes((data as InteracaoLeve[]) ?? []))
  }, [])

  const r = useMemo(() => {
    const porStatus = Object.fromEntries(STATUS.map((s) => [s, 0])) as Record<string, number>
    municipios.forEach((m) => porStatus[m.status]++)
    const contatadas = municipios.length - porStatus['A contatar']
    const propostas = porStatus['Proposta enviada'] + porStatus['Negociando'] + porStatus['Fechado']
    const fechadas = porStatus['Fechado']

    const regioes = new Map<string, { total: number; a: number; contatadas: number; propostas: number; fechadas: number; valor: number }>()
    municipios.forEach((m) => {
      const g = regioes.get(m.regiao_intermediaria) ?? { total: 0, a: 0, contatadas: 0, propostas: 0, fechadas: 0, valor: 0 }
      g.total++
      if (m.prioridade === 'A') g.a++
      if (m.status !== 'A contatar') g.contatadas++
      if (['Proposta enviada', 'Negociando', 'Fechado'].includes(m.status)) g.propostas++
      if (m.status === 'Fechado') g.fechadas++
      regioes.set(m.regiao_intermediaria, g)
    })
    shows.forEach((s) => {
      if (s.situacao === 'Cancelado') return
      const m = porId.get(s.municipio_id)
      if (m) regioes.get(m.regiao_intermediaria)!.valor += s.cache ?? 0
    })

    const validos = shows.filter((s) => s.situacao !== 'Cancelado')
    const valorTotal = validos.reduce((t, s) => t + (s.cache ?? 0), 0)
    const porMes = MESES.map((_, i) => {
      const doMes = validos.filter((s) => Number(s.data.slice(0, 4)) === ano && Number(s.data.slice(5, 7)) === i + 1)
      return { qtd: doMes.length, valor: doMes.reduce((t, s) => t + (s.cache ?? 0), 0) }
    })

    // atividade: últimas 8 semanas
    const semanas: { rotulo: string; qtd: number }[] = []
    const agora = new Date()
    const inicioSemana = new Date(agora)
    inicioSemana.setHours(0, 0, 0, 0)
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7))
    for (let i = 7; i >= 0; i--) {
      const ini = new Date(inicioSemana)
      ini.setDate(ini.getDate() - i * 7)
      const fim = new Date(ini)
      fim.setDate(fim.getDate() + 7)
      semanas.push({
        rotulo: `${String(ini.getDate()).padStart(2, '0')}/${String(ini.getMonth() + 1).padStart(2, '0')}`,
        qtd: interacoes.filter((x) => {
          const d = new Date(x.data)
          return d >= ini && d < fim
        }).length,
      })
    }
    const porTipo = new Map<string, number>()
    interacoes.forEach((x) => porTipo.set(x.tipo, (porTipo.get(x.tipo) ?? 0) + 1))

    return { porStatus, contatadas, propostas, fechadas, regioes, valorTotal, porMes, semanas, porTipo }
  }, [municipios, shows, porId, interacoes, ano])

  const maxStatus = Math.max(1, ...Object.values(r.porStatus))
  const maxMes = Math.max(1, ...r.porMes.map((x) => x.qtd))
  const maxSem = Math.max(1, ...r.semanas.map((x) => x.qtd))
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')
  const anos = [...new Set([new Date().getFullYear(), new Date().getFullYear() + 1, ...shows.map((s) => Number(s.data.slice(0, 4)))])].sort()

  return (
    <div className="pagina">
      <div className="titulo-linha">
        <h1>Relatórios</h1>
        <button
          className="btn"
          onClick={() =>
            exportarCSV(
              'interacoes.csv',
              interacoes.map((x) => ({
                Data: fmtDataHora(x.data),
                Cidade: porId.get(x.municipio_id)?.nome ?? x.municipio_id,
                Tipo: x.tipo,
                Descrição: x.descricao,
                Usuário: x.usuario_email,
              })),
            )
          }
        >
          Exportar interações
        </button>
      </div>

      <div className="kpis">
        <Kpi rotulo="Cidades contatadas" valor={`${r.contatadas} de ${municipios.length}`} />
        <Kpi rotulo={`Chegaram a proposta · ${pct(r.propostas, r.contatadas)} das contatadas`} valor={r.propostas} />
        <Kpi rotulo={`Fechadas · ${pct(r.fechadas, r.propostas)} das propostas`} valor={r.fechadas} destaque={r.fechadas ? 'ok' : undefined} />
        <Kpi rotulo="Valor em shows (não cancelados)" valor={fmtBRL(r.valorTotal)} />
        <Kpi rotulo="Interações registradas" valor={interacoes.length} />
      </div>

      <div className="grade-2">
        <section className="card">
          <h2>Funil por status</h2>
          {STATUS.map((s) => (
            <div key={s} className="barra-linha">
              <span className="barra-rot">{s}</span>
              <div className="barra-trilho">
                <div className={`barra ${STATUS_COR[s]}`} style={{ width: `${(r.porStatus[s] / maxStatus) * 100}%` }} />
              </div>
              <span className="barra-val">{r.porStatus[s]}</span>
            </div>
          ))}
        </section>

        <section className="card">
          <div className="titulo-linha">
            <h2>Shows por mês</h2>
            <select value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              {anos.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="colunas">
            {r.porMes.map((x, i) => (
              <div key={i} className="col" title={`${x.qtd} show(s) · ${fmtBRL(x.valor)}`}>
                <span className="col-val">{x.qtd || ''}</span>
                <div className="col-barra" style={{ height: `${(x.qtd / maxMes) * 100}%` }} />
                <span className="col-rot">{MESES[i]}</span>
              </div>
            ))}
          </div>
          <p className="pequeno muted">
            Total {ano}: {r.porMes.reduce((t, x) => t + x.qtd, 0)} shows · {fmtBRL(r.porMes.reduce((t, x) => t + x.valor, 0))}
          </p>
        </section>

        <section className="card">
          <h2>Atividade (contatos por semana)</h2>
          <div className="colunas">
            {r.semanas.map((x) => (
              <div key={x.rotulo} className="col" title={`${x.qtd} interações`}>
                <span className="col-val">{x.qtd || ''}</span>
                <div className="col-barra azul" style={{ height: `${(x.qtd / maxSem) * 100}%` }} />
                <span className="col-rot">{x.rotulo}</span>
              </div>
            ))}
          </div>
          <div className="tipos pequeno">
            {[...r.porTipo.entries()].map(([t, n]) => (
              <span key={t} className="chip">
                {t}: {n}
              </span>
            ))}
          </div>
        </section>

        <section className="card largura-total">
          <h2>Por região</h2>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Região intermediária</th>
                  <th>Cidades</th>
                  <th>Prior. A</th>
                  <th>Contatadas</th>
                  <th>Propostas</th>
                  <th>Fechadas</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {[...r.regioes.entries()]
                  .sort((a, b) => b[1].a - a[1].a || a[0].localeCompare(b[0]))
                  .map(([nome, g]) => (
                    <tr key={nome}>
                      <td>{nome}</td>
                      <td>{g.total}</td>
                      <td>{g.a}</td>
                      <td>
                        {g.contatadas} <span className="muted pequeno">({pct(g.contatadas, g.total)})</span>
                      </td>
                      <td>{g.propostas}</td>
                      <td>{g.fechadas}</td>
                      <td>{fmtBRL(g.valor)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
