import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { configurado, supabase } from './supabase'
import { DadosProvider, useDados } from './lib/dados'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Cidades from './pages/Cidades'
import Cidade from './pages/Cidade'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Shows from './pages/Shows'

export default function App() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!configurado) return
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!configurado) {
    return (
      <div className="centro">
        <div className="card login-card">
          <h1>Falta configurar</h1>
          <p>
            Crie o arquivo <code>.env</code> na pasta do projeto com <code>VITE_SUPABASE_URL</code> e{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> (veja o README) e reinicie o <code>npm run dev</code>.
          </p>
        </div>
      </div>
    )
  }
  if (sessao === undefined) return <div className="centro muted">Carregando…</div>
  if (!sessao) return <Login />

  return (
    <DadosProvider>
      <Shell email={sessao.user.email ?? ''} />
    </DadosProvider>
  )
}

function Shell({ email }: { email: string }) {
  const { carregando, erro, recarregar } = useDados()
  const links = [
    ['/', 'Início', '◉'],
    ['/cidades', 'Cidades', '☰'],
    ['/shows', 'Shows', '♪'],
    ['/relatorios', 'Relatórios', '▤'],
    ['/config', 'Ajustes', '⚙'],
  ] as const
  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <span className="marca-icone">🎸</span>
          <span>Shows MG</span>
        </div>
        <nav className="nav-topo">
          {links.map(([to, rot]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {rot}
            </NavLink>
          ))}
        </nav>
        <div className="usuario">
          <span className="muted pequeno esconde-mobile">{email}</span>
          <button className="btn-link" onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </header>
      <main className="conteudo">
        {erro ? (
          <div className="card erro">
            <strong>Não consegui carregar os dados.</strong>
            <p>{erro}</p>
            <p className="pequeno">Confira se você rodou os arquivos schema.sql e seed.sql no Supabase.</p>
            <button className="btn" onClick={recarregar}>
              Tentar de novo
            </button>
          </div>
        ) : carregando ? (
          <div className="muted">Carregando cidades…</div>
        ) : (
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/cidades" element={<Cidades />} />
            <Route path="/cidades/:id" element={<Cidade />} />
            <Route path="/shows" element={<Shows />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/config" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </main>
      <nav className="nav-baixo">
        {links.map(([to, rot, ic]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <span className="nav-ic">{ic}</span>
            <span>{rot}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
