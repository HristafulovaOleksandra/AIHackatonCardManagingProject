import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import CardsPage from './pages/CardsPage'
import RandomizerPage from './pages/RandomizerPage'
import HistoryPage from './pages/HistoryPage'
import AdminCardsPage from './pages/AdminCardsPage'
import TeamLoginPage from './pages/TeamLoginPage'
import AdminLoginPage from './pages/AdminLoginPage'

const PROJECTS = [
  { label: 'Сесії', href: 'http://localhost:3001', port: 3001 },
  { label: 'Картки', href: 'http://localhost:3002', port: 3002 },
  { label: 'Бали & Форми', href: 'http://localhost:3003', port: 3003 },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { teamAuth, adminAuth, logout } = useAuth()
  const currentPort = window.location.port ? parseInt(window.location.port) : 3002

  const navItems = [
    { path: '/', label: 'Каталог' },
    { path: '/randomizer', label: 'Рандомізатор' },
    { path: '/history', label: 'Історія' },
    ...(adminAuth ? [{ path: '/admin', label: 'Адмін' }] : []),
  ]

  const isAuthPage = location.pathname === '/login' || location.pathname === '/admin-login'

  return (
    <div className="min-h-screen bg-cyber-darker">
      {/* Cross-Project Navigation Bar */}
      <div className="bg-cyber-darker border-b border-cyber-border/50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10">
          <span className="font-cyber text-xs text-gray-500 tracking-widest">AI HACKATHON: THE GAME</span>
          <div className="flex gap-1">
            {PROJECTS.map(p => (
              <a
                key={p.port}
                href={p.href}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  currentPort === p.port
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Internal Navigation */}
      {!isAuthPage && (
        <nav className="bg-cyber-dark/80 backdrop-blur border-b border-cyber-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="font-cyber text-neon-pink text-lg tracking-wider">
                CARDS
              </Link>
              <div className="flex gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                      location.pathname === item.path
                        ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/50'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {teamAuth || adminAuth ? (
                  <>
                    {teamAuth && (
                      <span className="text-xs text-gray-400 font-mono">
                        {teamAuth.teamName} <span className="text-gray-600">/ {teamAuth.sessionCode}</span>
                      </span>
                    )}
                    {adminAuth && (
                      <span className="text-xs text-yellow-400 font-cyber">АДМІН</span>
                    )}
                    <button
                      onClick={logout}
                      className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-400 hover:text-neon-pink hover:border-neon-pink/50 transition-all"
                    >
                      Вийти
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50 transition-all"
                    >
                      Увійти як команда
                    </button>
                    <button
                      onClick={() => navigate('/admin-login')}
                      className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/50 transition-all"
                    >
                      Адмін
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={isAuthPage ? '' : 'max-w-7xl mx-auto px-4 py-6'}>
        <Routes>
          <Route path="/login" element={<TeamLoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/" element={<CardsPage />} />
          <Route path="/randomizer" element={<RandomizerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin" element={<AdminCardsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}

export default App
