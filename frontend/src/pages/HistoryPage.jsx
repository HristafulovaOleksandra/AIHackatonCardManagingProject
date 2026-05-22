import { useState, useEffect } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { SUITS } from '../utils/suitColors'
import cardsApi from '../services/cardsApi'
import { getSessions, getTeams } from '../services/sessionsApi'
import { useAuth } from '../context/AuthContext'

function HistoryPage() {
  const { teamAuth, adminAuth } = useAuth()
  const [searchParams] = useSearchParams()
  const [sessionId, setSessionId] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [roundFilter, setRoundFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Admin dropdown state
  const [sessions, setSessions] = useState([])
  const [teams, setTeams] = useState([])
  const [sessionsAvailable, setSessionsAvailable] = useState(null)

  // Prefill from auth context or URL/localStorage
  useEffect(() => {
    if (teamAuth) {
      setSessionId(teamAuth.sessionCode)
      setTeamFilter(String(teamAuth.teamId))
    } else {
      const urlSession = searchParams.get('session')
      const urlTeam = searchParams.get('team')
      setSessionId(urlSession || localStorage.getItem('hackathon_session') || '')
      if (urlTeam) setTeamFilter(urlTeam)
    }
  }, [teamAuth])

  // Auto-load history for team users
  useEffect(() => {
    if (teamAuth && sessionId && teamFilter) {
      loadHistory()
    }
  }, [teamAuth, sessionId, teamFilter])

  // Load sessions list for admin dropdown
  useEffect(() => {
    if (!adminAuth) return
    getSessions()
      .then(data => { setSessions(Array.isArray(data) ? data : []); setSessionsAvailable(true) })
      .catch(() => setSessionsAvailable(false))
  }, [adminAuth])

  // Load teams when session changes (admin mode)
  useEffect(() => {
    if (!adminAuth || sessionId.length !== 6) { setTeams([]); return }
    getTeams(sessionId)
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => setTeams([]))
  }, [sessionId, adminAuth])

  const loadHistory = async () => {
    if (!sessionId.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      let res
      if (teamFilter) {
        res = await cardsApi.getTeamHistory(sessionId, teamFilter)
      } else {
        res = await cardsApi.getSessionHistory(sessionId)
      }
      let data = res.data

      // Client-side filtering for round and action
      if (roundFilter) {
        data = data.filter(h => h.round === parseInt(roundFilter))
      }
      if (actionFilter) {
        data = data.filter(h => h.action === actionFilter)
      }

      setHistory(data)

      // Calculate stats from fetched data (avoid double-fetch)
      if (!teamFilter) {
        setStats({
          totalDraws: data.filter(h => h.action === 'drawn').length,
          totalTrades: data.filter(h => h.action === 'given').length,
          totalActions: data.length,
        })
      } else {
        // Need full session data for stats
        try {
          const statsRes = await cardsApi.getSessionHistory(sessionId)
          const all = statsRes.data
          setStats({
            totalDraws: all.filter(h => h.action === 'drawn').length,
            totalTrades: all.filter(h => h.action === 'given').length,
            totalActions: all.length,
          })
        } catch {
          setStats(null)
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    if (history.length === 0) return
    const headers = ['Час', 'Команда', 'Картка', 'Масть', 'Дія', 'Від', 'Кому', 'Раунд']
    const rows = history.map(h => [
      new Date(h.timestamp).toLocaleString('uk-UA'),
      h.teamId,
      h.cardName || '',
      h.cardSuit || '',
      h.action,
      h.fromTeamId || '',
      h.toTeamId || '',
      h.round || '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `history_${sessionId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const actionLabels = {
    drawn: { text: 'Витягнуто', cls: 'text-neon-cyan' },
    given: { text: 'Віддано', cls: 'text-neon-pink' },
    received: { text: 'Отримано', cls: 'text-neon-green' },
    traded: { text: 'Обмін', cls: 'text-yellow-400' },
  }

  if (!teamAuth && !adminAuth) return <Navigate to="/login" replace />

  return (
    <div className="space-y-6">
      <h1 className="font-cyber text-3xl text-neon-cyan text-center">Історія карток</h1>

      {/* Search & Filters */}
      <div className="card-cyber">
        <div className="flex gap-3 mb-4">
          {teamAuth ? (
            <div className="input-cyber flex-1 font-mono tracking-widest text-gray-400 bg-cyber-dark/50 flex items-center">
              {teamAuth.sessionCode}
            </div>
          ) : adminAuth && sessionsAvailable ? (
            <div className="flex gap-1 flex-1">
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="input-cyber text-sm font-mono flex-1"
              >
                <option value="">Оберіть сесію...</option>
                {sessions.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name} ({s.status})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => getSessions()
                  .then(d => { setSessions(Array.isArray(d) ? d : []); setSessionsAvailable(true) })
                  .catch(() => {})}
                className="px-2 text-gray-400 hover:text-white border border-cyber-border rounded transition-colors"
                title="Оновити список"
              >↻</button>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Код сесії..."
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && loadHistory()}
              maxLength={6}
              className="input-cyber flex-1 font-mono tracking-widest uppercase"
            />
          )}
          {!teamAuth && (
            <button onClick={loadHistory} disabled={loading} className="btn-neon">
              {loading ? 'Пошук...' : 'Пошук'}
            </button>
          )}
          <button
            onClick={exportCsv}
            disabled={history.length === 0}
            className="btn-neon-pink text-sm disabled:opacity-50"
          >
            Експорт CSV
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {teamAuth ? (
            <div className="input-cyber text-sm bg-cyber-dark/50 text-gray-400 flex items-center">
              {teamAuth.teamName}
            </div>
          ) : adminAuth && teams.length > 0 ? (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="input-cyber text-sm"
            >
              <option value="">Усі команди</option>
              {teams.map(t => (
                <option key={t.id} value={String(t.id)}>
                  {t.id} — {t.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Team ID"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="input-cyber text-sm"
            />
          )}
          <input
            type="number"
            placeholder="Раунд"
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="input-cyber text-sm"
            min="1"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-cyber text-sm"
          >
            <option value="">Усі дії</option>
            <option value="drawn">Витягнуто</option>
            <option value="given">Віддано</option>
            <option value="received">Отримано</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card-cyber text-center py-3">
            <p className="font-cyber text-2xl text-neon-cyan">{stats.totalDraws}</p>
            <p className="text-xs text-gray-500">Витягнуто</p>
          </div>
          <div className="card-cyber text-center py-3">
            <p className="font-cyber text-2xl text-neon-pink">{stats.totalTrades}</p>
            <p className="text-xs text-gray-500">Обмінів</p>
          </div>
          <div className="card-cyber text-center py-3">
            <p className="font-cyber text-2xl text-neon-green">{stats.totalActions}</p>
            <p className="text-xs text-gray-500">Всього</p>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="card-cyber overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-cyber-border">
              <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Час</th>
              <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Команда</th>
              <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Картка</th>
              <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Масть</th>
              <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Дія</th>
              <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Раунд</th>
            </tr>
          </thead>
          <tbody>
            {!searched ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  Введіть код сесії для перегляду історії
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  <span className="inline-block w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mr-2" />
                  Завантаження...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  Історію не знайдено
                </td>
              </tr>
            ) : (
              history.map((h) => {
                const suit = SUITS[h.cardSuit]
                const action = actionLabels[h.action] || { text: h.action, cls: 'text-gray-400' }
                return (
                  <tr key={h.id} className="border-b border-cyber-border/30 hover:bg-cyber-dark/50">
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(h.timestamp).toLocaleString('uk-UA', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        day: '2-digit', month: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      {h.teamId}
                      {h.action === 'given' && h.toTeamId && (
                        <span className="text-gray-500 text-xs ml-1"> → {h.toTeamId}</span>
                      )}
                      {h.action === 'received' && h.fromTeamId && (
                        <span className="text-gray-500 text-xs ml-1"> ← {h.fromTeamId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{h.cardName}</td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          color: suit?.color || '#999',
                          backgroundColor: `${suit?.color || '#999'}20`,
                        }}
                      >
                        {suit?.nameUa || h.cardSuit}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm font-medium ${action.cls}`}>
                      {action.text}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">{h.round || '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default HistoryPage
