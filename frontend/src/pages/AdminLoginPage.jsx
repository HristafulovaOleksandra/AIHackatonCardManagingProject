import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminLoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })
      if (res.ok) {
        loginAdmin()
        navigate('/admin')
      } else {
        setError('Невірний логін або пароль')
      }
    } catch {
      setError('Сервіс недоступний')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center px-4">
      <div className="card-cyber w-full max-w-md">
        <h1 className="font-cyber text-2xl text-neon-cyan text-center mb-2">Адмін панель</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Тільки для організаторів</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Логін *"
            value={login}
            onChange={e => setLogin(e.target.value)}
            className="input-cyber w-full"
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="Пароль *"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-cyber w-full"
            autoComplete="current-password"
            required
          />
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full py-3 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                Перевірка...
              </span>
            ) : 'Увійти'}
          </button>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-cyber-border/30">
          <Link to="/login" className="text-gray-500 text-sm hover:text-neon-pink transition-colors">
            ← Вхід для команди
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
