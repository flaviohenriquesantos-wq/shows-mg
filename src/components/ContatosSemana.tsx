import { useMemo, useState } from 'react'
import { useDados } from '../lib/dados'
import type { MunicipioCalc } from '../types'
import { exportarCSV } from '../lib/util'
import { LinhaCidade, StatusChip, Vazio } from './ui'

const ENCERRADO = (s: string) => s === 'Fechado' || s === 'Sem interesse'
const DIA = 86400000
const MESES_TXT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function inicioDaSemana(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7)) // segunda-feira
  return r
}
function somaMeses(d: Date, meses: number) {
  const r = new Date(d)
  const dia = r.getDate()
  r.setDate(1)
  r.setMonth(r.getMonth() + meses)
  const ultimo = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()
  r.setDate(Math.min(dia, ultimo))
  return r
}
/** Próxima ocorrência do aniversário (dd/mm) a partir de `desde` (inclusive). */
function proximaOcorrencia(ddmm: string | null, desde: Date) {
  const m = ddmm?.match(/^(\d{1,2})\/(\d{1,2})/)
  if (!m) return null
  const dia = Number(m[1]), mes = Number(m[2]) - 1
  let d = new Date(desde.getFullYear(), mes, dia)
  if (d < desde) d = new Date(desde.getFullYear() + 1, mes, dia)
  return d
}
const fmtCurta = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${MESES_TXT[d.getMonth()]}`
const fmtLonga = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

interface Item {
  m: MunicipioCalc
  data: Date
}

export default function ContatosSemana() {
  const { municipios, config } = useDados()
  const meses = Math.max(1, Number(config.antecedencia_meses) || 6)
  const [offset, setOffset] = useState(0)
  const [prio, setPrio] = useState<'' | 'A' | 'B' | 'C'>('')
  const [limite, setLimite] = useState(25)
  const [verAtrasadas, setVerAtrasadas] = useState(false)

  const r = useMemo(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const semanaIni = new Date(inicioDaSemana(hoje).getTime() + offset * 7 * DIA)
    const semanaFim = new Date(semanaIni.getTime() + 6 * DIA)
    const janelaIni = somaMeses(semanaIni, meses)
    const janelaFim = new Date(janelaIni.getTime() + 6 * DIA)

    const filtro = (m: MunicipioCalc) => !ENCERRADO(m.status) && (!prio || m.prioridade === prio)

    const semana: Item[] = []
    for (const m of municipios) {
      if (!filtro(m)) continue
      const d = proximaOcorrencia(m.aniversario, janelaIni)
      if (d && d <= janelaFim) semana.push({ m, data: d })
    }
    semana.sort((a, b) => a.data.getTime() - b.data.getTime() || a.m.distancia - b.m.distancia)

    // Cidades cuja janela ideal já passou, mas o aniversário ainda está a mais de 2 meses
    // e ninguém entrou em contato ainda.
    const limiteMin = new Date(hoje.getTime() + 60 * DIA)
    const inicioJanelaAtual = somaMeses(inicioDaSemana(hoje), meses)
    const atrasadas: Item[] = []
    for (const m of municipios) {
      if (m.status !== 'A contatar' || (prio && m.prioridade !== prio)) continue
      const d = proximaOcorrencia(m.aniversario, limiteMin)
      if (d && d < inicioJanelaAtual) atrasadas.push({ m, data: d })
    }
    atrasadas.sort((a, b) => a.data.getTime() - b.data.getTime() || a.m.distancia - b.m.distancia)

    return { semanaIni, semanaFim, janelaIni, janelaFim, semana, atrasadas }
  }, [municipios, meses, offset, prio])

  const contatadas = r.semana.filter((x) => x.m.status !== 'A contatar').length

  function exportar() {
    exportarCSV(
      `contatos-semana-${fmtLonga(r.semanaIni).replace(/\//g, '-')}.csv`,
      r.semana.map(({ m, data }) => ({
        Município: m.nome,
        Aniversário: fmtLonga(data),
        Prioridade: m.prioridade,
        'Distância (km)': m.distancia,
        População: m.populacao,
        Região: m.regiao_imediata,
        DDD: m.ddd,
        Status: m.status,
        'Próximo passo': m.proximo_passo ?? '',
      })),
    )
  }

  const titulo =
    offset === 0 ? 'Esta semana' : offset === 1 ? 'Próxima semana' : offset === -1 ? 'Semana passada' : `Semana de ${fmtCurta(r.semanaIni)}`

  return (
    <section className="card largura-total">
      <div className="titulo-linha">
        <div>
          <h2>Cidades para contatar</h2>
          <p className="pequeno muted sem-margem">
            Aniversário daqui a {meses} {meses === 1 ? 'mês' : 'meses'} — o prazo muda em Ajustes.
          </p>
        </div>
        <button className="btn" onClick={exportar} disabled={!r.semana.length}>
          Exportar semana
        </button>
      </div>

      <div className="semana-nav">
        <button className="btn" onClick={() => { setOffset((o) => o - 1); setLimite(25) }} aria-label="Semana anterior">
          ←
        </button>
        <div className="semana-info">
          <strong>{titulo}</strong>
          <span className="pequeno muted">
            {fmtCurta(r.semanaIni)} a {fmtCurta(r.semanaFim)} · aniversários de {fmtCurta(r.janelaIni)} a {fmtCurta(r.janelaFim)}/{r.janelaFim.getFullYear()}
          </span>
        </div>
        <button className="btn" onClick={() => { setOffset((o) => o + 1); setLimite(25) }} aria-label="Próxima semana">
          →
        </button>
      </div>

      <div className="linha-botoes semana-filtros">
        {(['', 'A', 'B', 'C'] as const).map((p) => (
          <button key={p || 'todas'} className={`chip-btn ${prio === p ? 'ativo' : ''}`} onClick={() => { setPrio(p); setLimite(25) }}>
            {p ? `Prioridade ${p}` : 'Todas'}
          </button>
        ))}
        {offset !== 0 && (
          <button className="btn-link" onClick={() => setOffset(0)}>
            Voltar para esta semana
          </button>
        )}
        <span className="pequeno muted contagem-semana">
          {r.semana.length} {r.semana.length === 1 ? 'cidade' : 'cidades'}
          {contatadas > 0 && ` · ${contatadas} já em andamento`}
        </span>
      </div>

      {r.semana.length === 0 ? (
        <Vazio>Nenhuma cidade com aniversário nessa janela{prio ? ` com prioridade ${prio}` : ''}.</Vazio>
      ) : (
        <div className="grade-lista">
          {r.semana.slice(0, limite).map(({ m, data }) => (
            <LinhaCidade
              key={m.id}
              m={m}
              extra={
                <div className="dir-2">
                  <strong>{fmtCurta(data)}</strong>
                  {m.status === 'A contatar' ? <span className="pequeno muted">a contatar</span> : <StatusChip status={m.status} />}
                </div>
              }
            />
          ))}
        </div>
      )}
      {r.semana.length > limite && (
        <button className="btn largo" onClick={() => setLimite((l) => l + 50)}>
          Mostrar mais ({r.semana.length - limite})
        </button>
      )}

      {offset === 0 && r.atrasadas.length > 0 && (
        <div className="atrasadas">
          <button className="btn-link" onClick={() => setVerAtrasadas((v) => !v)}>
            {verAtrasadas ? '▾' : '▸'} Ainda dá tempo: {r.atrasadas.length} cidades com aniversário entre 2 e {meses} meses que ainda não foram contatadas
          </button>
          {verAtrasadas && (
            <div className="grade-lista">
              {r.atrasadas.slice(0, 60).map(({ m, data }) => (
                <LinhaCidade key={m.id} m={m} extra={<strong className="data-alerta">{fmtCurta(data)}</strong>} />
              ))}
              {r.atrasadas.length > 60 && <p className="pequeno muted">E mais {r.atrasadas.length - 60}. Use a aba Cidades para ver todas.</p>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
