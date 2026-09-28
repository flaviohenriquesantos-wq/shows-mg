import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDados } from '../lib/dados'
import { fmtBRL, fmtData, hojeISO } from '../lib/util'
import { Kpi, LinhaCidade, Vazio } from '../components/ui'
import ContatosSemana from '../components/ContatosSemana'

const ABERTO = (s: string) => s !== 'Fechado' && s !== 'Sem interesse'

export default function Inicio() {
  const { municipios, shows, porId } = useDados()
  const hoje = hojeISO()
  const em7 = hojeISO(7)

  const d = useMemo(() => {
    const comFollow = municipios.filter((m) => m.proximo_followup && ABERTO(m.status))
    const atrasados = comFollow.filter((m) => m.proximo_followup! < hoje).sort((a, b) => a.proximo_followup!.localeCompare(b.proximo_followup!))
    const deHoje = comFollow.filter((m) => m.proximo_followup === hoje)
    const semana = comFollow
      .filter((m) => m.proximo_followup! > hoje && m.proximo_followup! <= em7)
      .sort((a, b) => a.proximo_followup!.localeCompare(b.proximo_followup!))
    const sugestoes = municipios
      .filter((m) => m.prioridade === 'A' && m.status === 'A contatar')
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 8)
    const proxShows = shows.filter((s) => s.situacao === 'Confirmado' && s.data >= hoje).slice(0, 6)
    const contatados = municipios.filter((m) => m.status !== 'A contatar').length
    const emNegociacao = municipios.filter((m) => m.status === 'Proposta enviada' || m.status === 'Negociando').length
    const fechados = municipios.filter((m) => m.status === 'Fechado').length
    return { atrasados, deHoje, semana, sugestoes, proxShows, contatados, emNegociacao, fechados }
  }, [municipios, shows, hoje, em7])

  return (
    <div className="pagina">
      <h1>Início</h1>
      <div className="kpis">
        <Kpi rotulo="Follow-ups atrasados" valor={d.atrasados.length} destaque={d.atrasados.length ? 'alerta' : undefined} />
        <Kpi rotulo="Para hoje" valor={d.deHoje.length} />
        <Kpi rotulo="Cidades contatadas" valor={d.contatados} />
        <Kpi rotulo="Propostas / negociando" valor={d.emNegociacao} />
        <Kpi rotulo="Cidades fechadas" valor={d.fechados} destaque={d.fechados ? 'ok' : undefined} />
      </div>

      <div className="grade-2">
        <ContatosSemana />

        <section className="card">
          <h2>Retornos para fazer</h2>
          {d.atrasados.length + d.deHoje.length + d.semana.length === 0 && (
            <Vazio>Nenhum follow-up marcado. Ao registrar um contato, defina a data do próximo retorno.</Vazio>
          )}
          {d.atrasados.length > 0 && <h3 className="alerta-txt">Atrasados</h3>}
          {d.atrasados.map((m) => (
            <LinhaCidade key={m.id} m={m} extra={<span className="data-alerta">{fmtData(m.proximo_followup)}</span>} />
          ))}
          {d.deHoje.length > 0 && <h3>Hoje</h3>}
          {d.deHoje.map((m) => (
            <LinhaCidade key={m.id} m={m} extra={<span className="pequeno">{m.proximo_passo ?? ''}</span>} />
          ))}
          {d.semana.length > 0 && <h3>Próximos 7 dias</h3>}
          {d.semana.map((m) => (
            <LinhaCidade key={m.id} m={m} extra={<span className="pequeno">{fmtData(m.proximo_followup)}</span>} />
          ))}
        </section>

        <section className="card">
          <h2>Próximos shows</h2>
          {d.proxShows.length === 0 ? (
            <Vazio>
              Nenhum show confirmado ainda. <Link to="/shows">Cadastrar show</Link>
            </Vazio>
          ) : (
            d.proxShows.map((s) => {
              const m = porId.get(s.municipio_id)
              return m ? (
                <LinhaCidade
                  key={s.id}
                  m={m}
                  extra={
                    <div className="dir-2">
                      <strong>{fmtData(s.data)}</strong>
                      <span className="pequeno">{fmtBRL(s.cache)}</span>
                    </div>
                  }
                />
              ) : null
            })
          )}
        </section>

        <section className="card">
          <h2>Sugestões para contatar</h2>
          <p className="pequeno muted">Prioridade A ainda não contatadas, das mais próximas para as mais distantes.</p>
          {d.sugestoes.length === 0 ? (
            <Vazio>Todas as cidades de prioridade A já foram contatadas.</Vazio>
          ) : (
            d.sugestoes.map((m) => <LinhaCidade key={m.id} m={m} />)
          )}
          <Link className="btn-link" to="/cidades?prioridade=A&status=A contatar">
            Ver todas →
          </Link>
        </section>
      </div>
    </div>
  )
}
