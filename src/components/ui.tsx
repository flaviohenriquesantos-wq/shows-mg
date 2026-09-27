import { Link } from 'react-router-dom'
import type { MunicipioCalc } from '../types'
import { STATUS_COR } from '../lib/util'

export function StatusChip({ status }: { status: string }) {
  return <span className={`chip ${STATUS_COR[status] ?? ''}`}>{status}</span>
}

export function Prio({ p }: { p: 'A' | 'B' | 'C' }) {
  return <span className={`prio prio-${p}`}>{p}</span>
}

export function Kpi({ rotulo, valor, destaque }: { rotulo: string; valor: string | number; destaque?: 'alerta' | 'ok' }) {
  return (
    <div className={`kpi ${destaque ?? ''}`}>
      <div className="kpi-valor">{valor}</div>
      <div className="kpi-rotulo">{rotulo}</div>
    </div>
  )
}

export function LinhaCidade({ m, extra }: { m: MunicipioCalc; extra?: React.ReactNode }) {
  return (
    <Link to={`/cidades/${m.id}`} className="linha-cidade">
      <Prio p={m.prioridade} />
      <div className="lc-meio">
        <div className="lc-nome">{m.nome}</div>
        <div className="lc-sub">
          {m.regiao_imediata} · {m.distancia} km · {m.porte}
        </div>
      </div>
      <div className="lc-dir">{extra ?? <StatusChip status={m.status} />}</div>
    </Link>
  )
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <div className="vazio">{children}</div>
}
