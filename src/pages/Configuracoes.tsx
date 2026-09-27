import { useState, type FormEvent } from 'react'
import { useDados } from '../lib/dados'
import type { Config } from '../types'
import { preencher } from '../lib/util'

export default function Configuracoes() {
  const { config, salvarConfig, municipios } = useDados()
  const [f, setF] = useState<Config>(config)
  const [cidadeBase, setCidadeBase] = useState(municipios.find((m) => String(m.id) === config.cidade_base)?.nome ?? '')
  const [msg, setMsg] = useState<string | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const base = municipios.find((m) => m.nome.toLowerCase() === cidadeBase.trim().toLowerCase())
    if (!base) return setMsg('Cidade-base não encontrada. Escolha uma da lista.')
    const erro = await salvarConfig({ ...f, cidade_base: String(base.id) })
    setMsg(erro ?? 'Configurações salvas. Distâncias e prioridades recalculadas.')
  }

  const exemplo = { cidade: 'Pará de Minas', contato: 'Maria', banda: f.nome_banda }
  const set = (k: keyof Config, v: string) => setF((p) => ({ ...p, [k]: v }))

  return (
    <div className="pagina">
      <h1>Ajustes</h1>
      <form className="grade-2" onSubmit={salvar}>
        <section className="card">
          <h2>Prioridade e distância</h2>
          <label>
            Cidade-base (de onde a banda sai)
            <input list="cidades-cfg" value={cidadeBase} onChange={(e) => setCidadeBase(e.target.value)} />
            <datalist id="cidades-cfg">
              {municipios.map((m) => (
                <option key={m.id} value={m.nome} />
              ))}
            </datalist>
          </label>
          <div className="campos-2">
            <label>
              Raio prioridade A (km)
              <input type="number" min={10} value={f.raio_a} onChange={(e) => set('raio_a', e.target.value)} />
            </label>
            <label>
              Raio prioridade B (km)
              <input type="number" min={10} value={f.raio_b} onChange={(e) => set('raio_b', e.target.value)} />
            </label>
          </div>
          <label>
            Fator estrada (× distância em linha reta)
            <input type="number" step={0.05} min={1} value={f.fator_estrada} onChange={(e) => set('fator_estrada', e.target.value)} />
          </label>
          <p className="pequeno muted">
            A distância é uma estimativa: linha reta entre as cidades × esse fator. Confira a rota real antes de orçar o frete.
          </p>
        </section>

        <section className="card">
          <h2>Modelos de mensagem</h2>
          <p className="pequeno muted">
            Use <code>{'{cidade}'}</code>, <code>{'{contato}'}</code> e <code>{'{banda}'}</code>. Eles são trocados automaticamente ao clicar em WhatsApp ou E-mail na ficha da cidade.
          </p>
          <label>
            Nome da banda
            <input value={f.nome_banda} onChange={(e) => set('nome_banda', e.target.value)} />
          </label>
          <label>
            WhatsApp
            <textarea rows={4} value={f.msg_whatsapp} onChange={(e) => set('msg_whatsapp', e.target.value)} />
          </label>
          <div className="previa pequeno">{preencher(f.msg_whatsapp, exemplo)}</div>
          <label>
            Assunto do e-mail
            <input value={f.msg_email_assunto} onChange={(e) => set('msg_email_assunto', e.target.value)} />
          </label>
          <label>
            Corpo do e-mail
            <textarea rows={9} value={f.msg_email_corpo} onChange={(e) => set('msg_email_corpo', e.target.value)} />
          </label>
        </section>

        <div className="linha-botoes largura-total">
          <button className="btn primario">Salvar ajustes</button>
          {msg && <span className="pequeno">{msg}</span>}
        </div>
      </form>
    </div>
  )
}
