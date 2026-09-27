import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { configurado } from './supabase'
import { DadosProvider, useDados } from './lib/dados'
import Inicio from './pages/Inicio'
import Cidades from './pages/Cidades'
import Cidade from './pages/Cidade'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Shows from './pages/Shows'

export default function App() {
  if (!configurado) {
    return (
      <div className="centro">
        <div className="card login-card">
          <h1>Falta configurar</h1>
          <p>
            Informe <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code> (veja o README).
          </p>
        </div>
      </div>
    )
  }
  return (
    <DadosProvider>
      <Shell />
    </DadosProvider>
  )
}

function Shell() {
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
