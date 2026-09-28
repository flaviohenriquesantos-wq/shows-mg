import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useDados } from '../lib/dados'
import { STATUS, TIPOS_INTERACAO, type Contato, type ShowContratado, type Interacao, type Municipio, type Status } from '../types'
import { fmtBRL, fmtData, fmtDataHora, fmtNum, hojeISO, linkWhatsApp, preencher, soDigitos } from '../lib/util'
import { Prio, StatusChip, Vazio } from '../components/ui'

type CamposEdit = Pick<
  Municipio,
  'status' | 'proximo_followup' | 'proximo_passo' | 'setor_responsavel' | 'aniversario' | 'festas' | 'meses_eventos' | 'cache_proposto' | 'observacoes'
>

export default function Cidade() {
  const { id } = useParams()
  const nav = useNavigate()
  const { porId, atualizarMunicipio, config, shows, recarregarShows } = useDados()
  const m = porId.get(Number(id))

  const [contatos, setContatos] = useState<Contato[]>([])
  const [historico, setHistorico] = useState<Interacao[]>([])

  const carregar = useCallback(async () => {
    if (!m) return
    const [c, h] = await Promise.all([
      supabase.from('contatos').select('*').eq('municipio_id', m.id).order('principal', { ascending: false }).order('created_at'),
      supabase.from('interacoes').select('*').eq('municipio_id', m.id).order('data', { ascending: false }),
    ])
    setContatos((c.data as Contato[]) ?? [])
    setHistorico((h.data as Interacao[]) ?? [])
  }, [m?.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (!m) {
    return (
      <div className="pagina">
        <Vazio>
          Cidade não encontrada. <Link to="/cidades">Voltar</Link>
        </Vazio>
      </div>
    )
  }

  const showsCidade = shows.filter((s) => s.municipio_id === m.id)
  const vars = (c?: Contato) => ({
    cidade: m.nome,
    contato: c?.nome.split(' ')[0] ?? '',
    banda: config.nome_banda,
  })

  return (
    <div className="pagina">
      <button className="btn-link voltar" onClick={() => nav(-1)}>
        ← Voltar
      </button>
      <div className="cab-cidade card">
        <div className="cab-linha">
          <Prio p={m.prioridade} />
          <h1>{m.nome}</h1>
          <StatusChip status={m.status} />
        </div>
        <div className="cab-info">
          <span>{m.regiao_imediata} ({m.regiao_intermediaria})</span>
          <span>{fmtNum(m.populacao)} hab. · {m.porte}</span>
          <span>≈ {m.distancia} km por estrada</span>
          <span>DDD {m.ddd}</span>
        </div>
        {m.prefeito && (
          <div className="cab-prefeito pequeno">
            <strong>Prefeito(a) 2025–2028:</strong> {m.prefeito}
            {m.prefeito_urna && <> (“{m.prefeito_urna}”)</>}
            {m.prefeito_partido && <> · {m.prefeito_partido}</>}
            {m.prefeito_reeleito && <> · reeleito(a)</>}
            {m.vice_prefeito && <> · vice: {m.vice_prefeito}</>}
            {m.prefeito_instagram && (
              <>
                {' · '}
                <a href={m.prefeito_instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </>
            )}
          </div>
        )}
        <div className="acoes-links">
          <a className="btn" target="_blank" rel="noreferrer"
            href={`https://www.google.com/search?q=${encodeURIComponent(`Prefeitura de ${m.nome} MG secretaria de cultura contato`)}`}>
            Buscar contatos
          </a>
          {m.site && (
            <a className="btn" target="_blank" rel="noreferrer" href={m.site}>
              Site da prefeitura
            </a>
          )}
          <a className="btn" target="_blank" rel="noreferrer"
            href={`https://www.google.com/search?q=${encodeURIComponent(`${m.nome} MG festa aniversário da cidade programação`)}`}>
            Buscar festas
          </a>
          {m.slug && (
            <a className="btn" target="_blank" rel="noreferrer" href={`https://cidades.ibge.gov.br/brasil/mg/${m.slug}/historico`}>
              Histórico IBGE
            </a>
          )}
          <a className="btn" target="_blank" rel="noreferrer"
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${m.nome}, MG`)}`}>
            Rota
          </a>
        </div>
      </div>

      <div className="grade-2">
        <div className="coluna">
          <RegistrarInteracao
            municipio={m}
            aoSalvar={async (campos) => {
              if (Object.keys(campos).length) await atualizarMunicipio(m.id, campos)
              await carregar()
            }}
          />
          <section className="card">
            <h2>Histórico</h2>
            {historico.length === 0 && <Vazio>Nenhuma interação registrada.</Vazio>}
            <ul className="timeline">
              {historico.map((h) => (
                <li key={h.id}>
                  <div className="tl-cab">
                    <strong>{h.tipo}</strong>
                    <span className="muted pequeno">{fmtDataHora(h.data)}</span>
                    <button
                      className="btn-x"
                      title="Apagar"
                      onClick={async () => {
                        if (!confirm('Apagar esta interação?')) return
                        await supabase.from('interacoes').delete().eq('id', h.id)
                        carregar()
                      }}
                    >
                      ×
                    </button>
                  </div>
                  {h.descricao && <div className="tl-desc">{h.descricao}</div>}
                  {h.usuario_email && <div className="muted pequeno">{h.usuario_email}</div>}
                </li>
              ))}
            </ul>
          </section>
          <ContratacoesPNCP municipioId={m.id} />
        </div>

        <div className="coluna">
          <Contatos
            municipioId={m.id}
            ddd={m.ddd}
            contatos={contatos}
            recarregar={carregar}
            linkWpp={(c) => linkWhatsApp(c.whatsapp || c.telefone || '', preencher(config.msg_whatsapp, vars(c)))}
            linkEmail={(c) =>
              `mailto:${c.email}?subject=${encodeURIComponent(preencher(config.msg_email_assunto, vars(c)))}&body=${encodeURIComponent(
                preencher(config.msg_email_corpo, vars(c)),
              )}`
            }
          />
          <FichaProspeccao municipio={m} salvar={(c) => atualizarMunicipio(m.id, c)} />
          <section className="card">
            <h2>Shows nesta cidade</h2>
            {showsCidade.length === 0 && <Vazio>Nenhum show cadastrado.</Vazio>}
            {showsCidade.map((s) => (
              <div key={s.id} className="linha-simples">
                <strong>{fmtData(s.data)}</strong>
                <span>{s.evento ?? '—'}</span>
                <span>{fmtBRL(s.cache)}</span>
                <span className="chip">{s.situacao}</span>
              </div>
            ))}
            <NovoShow
              municipioId={m.id}
              aoSalvar={async (fechar) => {
                await recarregarShows()
                if (fechar && m.status !== 'Fechado') await atualizarMunicipio(m.id, { status: 'Fechado' })
              }}
            />
          </section>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function linkPNCP(n: string) {
  const r = /^(\d{14})-\d+-0*(\d+)\/(\d{4})$/.exec(n)
  return r ? `https://pncp.gov.br/app/contratos/${r[1]}/${r[3]}/${r[2]}` : null
}

function ContratacoesPNCP({ municipioId }: { municipioId: number }) {
  const [itens, setItens] = useState<ShowContratado[] | null>(null)
  const [todos, setTodos] = useState(false)

  useEffect(() => {
    setItens(null)
    supabase
      .from('shows_contratados')
      .select('*')
      .eq('municipio_id', municipioId)
      .order('data', { ascending: false })
      .then(({ data }) => setItens((data as ShowContratado[]) ?? []))
  }, [municipioId])

  if (itens === null) return null
  const valores = itens.map((i) => Number(i.valor)).filter((v) => v > 0).sort((a, b) => a - b)
  const mediana = valores.length ? valores[Math.floor(valores.length / 2)] : null
  const porMes = new Map<number, number>()
  for (const i of itens) if (i.data) porMes.set(Number(i.data.slice(5, 7)), (porMes.get(Number(i.data.slice(5, 7))) ?? 0) + 1)
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const mostrados = todos ? itens : itens.slice(0, 8)

  return (
    <section className="card">
      <h2>Shows que a prefeitura já contratou</h2>
      {itens.length === 0 ? (
        <Vazio>Nenhuma contratação de show encontrada no Portal Nacional de Contratações Públicas.</Vazio>
      ) : (
        <>
          <div className="ct-resumo pequeno">
            <span>
              <strong>{itens.length}</strong> contratações
            </span>
            {mediana !== null && (
              <span>
                cachê típico <strong>{fmtBRL(mediana)}</strong>
              </span>
            )}
            {valores.length > 0 && <span>maior {fmtBRL(valores[valores.length - 1])}</span>}
          </div>
          <div className="muted pequeno">
            Assinadas em:{' '}
            {[...porMes.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([mes, q]) => `${MESES[mes - 1]} (${q})`)
              .join(', ')}
          </div>
          <ul className="ct-lista">
            {mostrados.map((i) => {
              const url = linkPNCP(i.numero_controle)
              return (
                <li key={i.numero_controle}>
                  <div className="ct-cab">
                    <strong>{i.data ? fmtData(i.data) : '—'}</strong>
                    <span>{i.valor ? fmtBRL(Number(i.valor)) : '—'}</span>
                    {i.emenda && <span className="chip">emenda parlamentar</span>}
                    {url && (
                      <a className="pequeno" href={url} target="_blank" rel="noreferrer">
                        ver no PNCP
                      </a>
                    )}
                  </div>
                  <div className="pequeno">{i.descricao}</div>
                </li>
              )
            })}
          </ul>
          {itens.length > 8 && (
            <button className="btn-link" onClick={() => setTodos((t) => !t)}>
              {todos ? 'Mostrar menos' : `Mostrar todas (${itens.length})`}
            </button>
          )}
          <p className="muted pequeno">Fonte: pncp.gov.br — contratos com “show” no objeto. Datas são da assinatura, normalmente semanas antes do evento.</p>
        </>
      )}
    </section>
  )
}

function RegistrarInteracao({
  municipio,
  aoSalvar,
}: {
  municipio: Municipio
  aoSalvar: (campos: Partial<Municipio>) => Promise<void>
}) {
  const [tipo, setTipo] = useState<string>('Ligação')
  const [descricao, setDescricao] = useState('')
  const [novoStatus, setNovoStatus] = useState<Status | ''>('')
  const [followup, setFollowup] = useState('')
  const [passo, setPasso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const { error } = await supabase.from('interacoes').insert({ municipio_id: municipio.id, tipo, descricao: descricao || null })
    if (error) {
      setErro(error.message)
      setSalvando(false)
      return
    }
    const campos: Partial<Municipio> = {}
    if (novoStatus) campos.status = novoStatus
    else if (municipio.status === 'A contatar') campos.status = 'Contato feito'
    if (followup) campos.proximo_followup = followup
    if (passo) campos.proximo_passo = passo
    await aoSalvar(campos)
    setDescricao('')
    setNovoStatus('')
    setFollowup('')
    setPasso('')
    setSalvando(false)
  }

  return (
    <form className="card" onSubmit={salvar}>
      <h2>Registrar contato</h2>
      <div className="chips-escolha">
        {TIPOS_INTERACAO.map((t) => (
          <button type="button" key={t} className={`chip-btn ${tipo === t ? 'ativo' : ''}`} onClick={() => setTipo(t)}>
            {t}
          </button>
        ))}
      </div>
      <label>
        O que aconteceu
        <textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: falei com a secretária, pediu proposta por e-mail para o aniversário" />
      </label>
      <div className="campos-2">
        <label>
          Mudar status para
          <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value as Status | '')}>
            <option value="">{municipio.status === 'A contatar' ? 'Contato feito (automático)' : `Manter (${municipio.status})`}</option>
            {STATUS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Próximo retorno
          <input type="date" value={followup} onChange={(e) => setFollowup(e.target.value)} />
        </label>
      </div>
      <div className="atalhos">
        {[2, 7, 15, 30].map((d) => (
          <button type="button" key={d} className="chip-btn" onClick={() => setFollowup(hojeISO(d))}>
            +{d} dias
          </button>
        ))}
      </div>
      <label>
        Próximo passo
        <input value={passo} onChange={(e) => setPasso(e.target.value)} placeholder="Ex.: enviar proposta, ligar para confirmar" />
      </label>
      {erro && <div className="msg-erro">{erro}</div>}
      <button className="btn primario" disabled={salvando}>
        {salvando ? 'Salvando…' : 'Registrar'}
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------ */

function FichaProspeccao({ municipio, salvar }: { municipio: Municipio; salvar: (c: Partial<Municipio>) => Promise<string | null> }) {
  const inicial = (): CamposEdit => ({
    status: municipio.status,
    proximo_followup: municipio.proximo_followup,
    proximo_passo: municipio.proximo_passo,
    setor_responsavel: municipio.setor_responsavel,
    aniversario: municipio.aniversario,
    festas: municipio.festas,
    meses_eventos: municipio.meses_eventos,
    cache_proposto: municipio.cache_proposto,
    observacoes: municipio.observacoes,
  })
  const [f, setF] = useState<CamposEdit>(inicial)
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => setF(inicial()), [municipio.updated_at]) // eslint-disable-line react-hooks/exhaustive-deps

  const alterado = JSON.stringify(f) !== JSON.stringify(inicial())
  const set = <K extends keyof CamposEdit>(k: K, v: CamposEdit[K]) => setF((p) => ({ ...p, [k]: v }))
  const txt = (v: string) => (v.trim() === '' ? null : v)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (f.aniversario && !/^\d{1,2}\/\d{1,2}$/.test(f.aniversario)) {
      setMsg('Aniversário deve estar no formato dd/mm (ex.: 12/12).')
      return
    }
    const erro = await salvar(f)
    setMsg(erro ?? 'Salvo.')
    setTimeout(() => setMsg(null), 2500)
  }

  return (
    <form className="card" onSubmit={enviar}>
      <h2>Ficha da cidade</h2>
      <div className="campos-2">
        <label>
          Status
          <select value={f.status} onChange={(e) => set('status', e.target.value as Status)}>
            {STATUS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Próximo retorno
          <input type="date" value={f.proximo_followup ?? ''} onChange={(e) => set('proximo_followup', e.target.value || null)} />
        </label>
      </div>
      <label>
        Próximo passo
        <input value={f.proximo_passo ?? ''} onChange={(e) => set('proximo_passo', txt(e.target.value))} />
      </label>
      <div className="campos-2">
        <label>
          Aniversário da cidade
          <input placeholder="dd/mm" value={f.aniversario ?? ''} onChange={(e) => set('aniversario', txt(e.target.value))} />
        </label>
        <label>
          Mês(es) dos eventos
          <input placeholder="Ex.: jun, ago, dez" value={f.meses_eventos ?? ''} onChange={(e) => set('meses_eventos', txt(e.target.value))} />
        </label>
      </div>
      <label>
        Festas / eventos com show
        <input placeholder="Ex.: aniversário, padroeiro, exposição" value={f.festas ?? ''} onChange={(e) => set('festas', txt(e.target.value))} />
      </label>
      <div className="campos-2">
        <label>
          Setor responsável
          <input placeholder="Ex.: Sec. Cultura e Turismo" value={f.setor_responsavel ?? ''} onChange={(e) => set('setor_responsavel', txt(e.target.value))} />
        </label>
        <label>
          Cachê proposto (R$)
          <input
            type="number"
            min={0}
            step={100}
            value={f.cache_proposto ?? ''}
            onChange={(e) => set('cache_proposto', e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>
      </div>
      <label>
        Observações
        <textarea rows={3} value={f.observacoes ?? ''} onChange={(e) => set('observacoes', txt(e.target.value))} />
      </label>
      <div className="linha-botoes">
        <button className="btn primario" disabled={!alterado}>
          Salvar ficha
        </button>
        {msg && <span className="pequeno">{msg}</span>}
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */

function Contatos({
  municipioId,
  ddd,
  contatos,
  recarregar,
  linkWpp,
  linkEmail,
}: {
  municipioId: number
  ddd: number | null
  contatos: Contato[]
  recarregar: () => Promise<void>
  linkWpp: (c: Contato) => string
  linkEmail: (c: Contato) => string
}) {
  const vazio = { nome: '', cargo: '', telefone: '', whatsapp: '', email: '', principal: false }
  const [editando, setEditando] = useState<string | 'novo' | null>(null)
  const [f, setF] = useState(vazio)
  const [erro, setErro] = useState<string | null>(null)

  function abrir(c?: Contato) {
    setErro(null)
    if (c) {
      setF({ nome: c.nome, cargo: c.cargo ?? '', telefone: c.telefone ?? '', whatsapp: c.whatsapp ?? '', email: c.email ?? '', principal: c.principal })
      setEditando(c.id)
    } else {
      setF({ ...vazio, telefone: ddd ? `(${ddd}) ` : '', whatsapp: ddd ? `(${ddd}) ` : '' })
      setEditando('novo')
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const limpa = (s: string) => (soDigitos(s).length <= 2 && !s.includes('@') ? null : s.trim() || null)
    const dados = {
      municipio_id: municipioId,
      nome: f.nome.trim(),
      cargo: f.cargo.trim() || null,
      telefone: limpa(f.telefone),
      whatsapp: limpa(f.whatsapp),
      email: f.email.trim() || null,
      principal: f.principal,
    }
    const r =
      editando === 'novo'
        ? await supabase.from('contatos').insert(dados)
        : await supabase.from('contatos').update(dados).eq('id', editando!)
    if (r.error) return setErro(r.error.message)
    setEditando(null)
    recarregar()
  }

  async function apagar(id: string) {
    if (!confirm('Apagar este contato?')) return
    await supabase.from('contatos').delete().eq('id', id)
    setEditando(null)
    recarregar()
  }

  return (
    <section className="card">
      <div className="titulo-linha">
        <h2>Contatos</h2>
        {editando === null && (
          <button className="btn" onClick={() => abrir()}>
            + Contato
          </button>
        )}
      </div>
      {contatos.length === 0 && editando === null && <Vazio>Nenhum contato. Use "Buscar contatos" acima para encontrar.</Vazio>}
      {contatos.map((c) =>
        editando === c.id ? null : (
          <div key={c.id} className="contato">
            <div className="contato-cab">
              <div>
                <strong>{c.nome}</strong> {c.principal && <span className="chip st-verde">principal</span>}
                {c.cargo && <div className="muted pequeno">{c.cargo}</div>}
              </div>
              <button className="btn-link" onClick={() => abrir(c)}>
                Editar
              </button>
            </div>
            <div className="contato-dados pequeno">
              {c.telefone && <span>☎ {c.telefone}</span>}
              {c.whatsapp && <span>WhatsApp {c.whatsapp}</span>}
              {c.email && <span>✉ {c.email}</span>}
            </div>
            {c.fonte && <div className="muted pequeno fonte">Fonte: {c.fonte}</div>}
            <div className="acoes-links">
              {(c.whatsapp || c.telefone) && (
                <a className="btn wpp" target="_blank" rel="noreferrer" href={linkWpp(c)}>
                  WhatsApp
                </a>
              )}
              {c.telefone && (
                <a className="btn" href={`tel:${soDigitos(c.telefone)}`}>
                  Ligar
                </a>
              )}
              {c.email && (
                <a className="btn" href={linkEmail(c)}>
                  E-mail
                </a>
              )}
            </div>
          </div>
        ),
      )}
      {editando !== null && (
        <form className="form-contato" onSubmit={salvar}>
          <label>
            Nome
            <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required autoFocus />
          </label>
          <label>
            Cargo
            <input value={f.cargo} placeholder="Ex.: Secretário de Cultura" onChange={(e) => setF({ ...f, cargo: e.target.value })} />
          </label>
          <div className="campos-2">
            <label>
              Telefone
              <input value={f.telefone} inputMode="tel" onChange={(e) => setF({ ...f, telefone: e.target.value })} />
            </label>
            <label>
              WhatsApp
              <input value={f.whatsapp} inputMode="tel" onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
            </label>
          </div>
          <label>
            E-mail
            <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </label>
          <label className="check">
            <input type="checkbox" checked={f.principal} onChange={(e) => setF({ ...f, principal: e.target.checked })} />
            Contato principal
          </label>
          {erro && <div className="msg-erro">{erro}</div>}
          <div className="linha-botoes">
            <button className="btn primario">Salvar</button>
            <button type="button" className="btn" onClick={() => setEditando(null)}>
              Cancelar
            </button>
            {editando !== 'novo' && (
              <button type="button" className="btn-link perigo" onClick={() => apagar(editando)}>
                Apagar
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */

function NovoShow({ municipioId, aoSalvar }: { municipioId: number; aoSalvar: (fechar: boolean) => Promise<void> }) {
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState({ data: '', evento: '', cache: '' })
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('shows').insert({
      municipio_id: municipioId,
      data: f.data,
      evento: f.evento || null,
      cache: f.cache === '' ? null : Number(f.cache),
    })
    if (error) return setErro(error.message)
    setF({ data: '', evento: '', cache: '' })
    setAberto(false)
    await aoSalvar(true)
  }

  if (!aberto)
    return (
      <button className="btn" onClick={() => setAberto(true)}>
        + Show fechado
      </button>
    )
  return (
    <form className="form-contato" onSubmit={salvar}>
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
        <input value={f.evento} placeholder="Ex.: Aniversário da cidade" onChange={(e) => setF({ ...f, evento: e.target.value })} />
      </label>
      {erro && <div className="msg-erro">{erro}</div>}
      <p className="pequeno muted">Ao salvar, o status da cidade passa para "Fechado".</p>
      <div className="linha-botoes">
        <button className="btn primario">Salvar show</button>
        <button type="button" className="btn" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
