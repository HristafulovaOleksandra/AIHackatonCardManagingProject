import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTeams } from '../services/sessionsApi'

function TeamLoginPage() {
  const [sessionCode, setSessionCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { loginTeam } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!sessionCode || !teamName) return
    setLoading(true)
    setError('')
    try {
      const teams = await getTeams(sessionCode)
      const found = Array.isArray(teams)
        ? teams.find(t => t.name?.toLowerCase() === teamName.trim().toLowerCase())
        : null
      if (found) {
        loginTeam(sessionCode, found.id, found.name)
        navigate('/randomizer')
      } else {
        setError('Команду не знайдено в цій сесії')
      }
    } catch {
      setError('Сервіс сесій недоступний')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-darker flex items-center justify-center px-4">
      <div className="card-cyber w-full max-w-md">
        <h1 className="font-cyber text-2xl text-neon-pink text-center mb-2">Вхід для команди</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Введіть код сесії та назву вашої команди</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Код сесії *"
            value={sessionCode}
            onChange={e => setSessionCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="input-cyber w-full font-mono tracking-widest uppercase text-center text-lg"
            required
          />
          <input
            type="text"
            placeholder="Назва вашої команди *"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            className="input-cyber w-full"
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
          <Link to="/admin-login" className="text-gray-500 text-sm hover:text-neon-cyan transition-colors">
            Увійти як адмін →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TeamLoginPage
