import { useState, type FormEvent } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
    setEnviando(false)
  }

  return (
    <div className="centro">
      <form className="card login-card" onSubmit={entrar}>
        <div className="marca grande">
          <span className="marca-icone">🎸</span>
          <span>Shows MG</span>
        </div>
        <p className="muted">Prospecção de shows com prefeituras de Minas Gerais</p>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>
        {erro && <div className="msg-erro">{erro}</div>}
        <button className="btn primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="pequeno muted">Acesso interno. Usuários são criados no painel do Supabase.</p>
      </form>
    </div>
  )
}
