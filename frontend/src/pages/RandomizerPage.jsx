import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as signalR from '@microsoft/signalr'
import { SUITS, RARITY } from '../utils/suitColors'
import cardsApi from '../services/cardsApi'

const P1_HUB_URL = import.meta.env.VITE_P1_HUB_URL || 'http://localhost:8081/hubs/session'

function formatTime(seconds) {
  if (seconds == null || seconds < 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function RandomizerPage() {
  const [searchParams] = useSearchParams()
  const [selectedSuit, setSelectedSuit] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [round, setRound] = useState('')
  const [drawCount, setDrawCount] = useState(1)
  const [isDrawing, setIsDrawing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  // SignalR state
  const [hubStatus, setHubStatus] = useState('idle') // idle | connecting | connected | error
  const [activeRound, setActiveRound] = useState(null)
  const [timerRemaining, setTimerRemaining] = useState(null)
  const [roundEndedToast, setRoundEndedToast] = useState(null)
  const connectionRef = useRef(null)
  const toastTimerRef = useRef(null)

  // Prefill from URL query params or localStorage
  useEffect(() => {
    const urlSession = searchParams.get('session')
    const urlTeam = searchParams.get('team')
    setSessionId(urlSession || localStorage.getItem('hackathon_session') || '')
    setTeamId(urlTeam || localStorage.getItem('hackathon_teamId') || '')
  }, [])

  // SignalR: connect when session code is complete (6 chars)
  useEffect(() => {
    if (sessionId.length !== 6) {
      if (connectionRef.current) {
        connectionRef.current.stop()
        connectionRef.current = null
        setHubStatus('idle')
        setActiveRound(null)
        setTimerRemaining(null)
      }
      return
    }

    setHubStatus('connecting')

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(P1_HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('RoundStarted', ({ round: r, roundEndTime }) => {
      setActiveRound(r)
      setRound(String(r))
      setRoundEndedToast(null)
      if (roundEndTime) {
        const secsLeft = Math.round((new Date(roundEndTime) - Date.now()) / 1000)
        setTimerRemaining(secsLeft > 0 ? secsLeft : null)
      }
    })

    connection.on('RoundEnded', ({ round: r }) => {
      setActiveRound(null)
      setTimerRemaining(null)
      clearTimeout(toastTimerRef.current)
      setRoundEndedToast(`Раунд ${r} завершено`)
      toastTimerRef.current = setTimeout(() => setRoundEndedToast(null), 5000)
    })

    connection.on('TimerTick', ({ remaining }) => {
      setTimerRemaining(remaining)
    })

    connection.onreconnecting(() => setHubStatus('connecting'))
    connection.onreconnected(() => setHubStatus('connected'))
    connection.onclose(() => setHubStatus('error'))

    connection.start()
      .then(() => {
        setHubStatus('connected')
        return connection.invoke('JoinSession', sessionId)
      })
      .catch(err => {
        console.warn('SignalR connection failed:', err)
        setHubStatus('error')
      })

    connectionRef.current = connection

    return () => {
      connection.stop()
      connectionRef.current = null
      clearTimeout(toastTimerRef.current)
    }
  }, [sessionId])

  const handleDraw = async () => {
    if (!sessionId || !teamId) {
      setError('Введіть код сесії та Team ID')
      return
    }
    setIsDrawing(true)
    setError('')
    setResults([])

    try {
      const payload = {
        sessionId,
        teamId: parseInt(teamId),
        suit: selectedSuit || undefined,
        round: round ? parseInt(round) : undefined,
      }

      if (drawCount > 1) {
        const res = await cardsApi.drawRandomMulti({ ...payload, count: drawCount })
        for (let i = 0; i < res.data.length; i++) {
          await new Promise(r => setTimeout(r, 600))
          setResults(prev => [...prev, res.data[i]])
        }
      } else {
        const res = await cardsApi.drawRandom(payload)
        await new Promise(r => setTimeout(r, 800))
        setResults([res.data])
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Помилка при витягуванні картки'
      setError(msg)
    } finally {
      setIsDrawing(false)
    }
  }

  // Hub status indicator config
  const hubIndicator = {
    idle:       { color: '#6b7280', label: null },
    connecting: { color: '#f59e0b', label: 'Підключення до P1...' },
    connected:  { color: '#22c55e', label: activeRound ? `Раунд ${activeRound} активний` : 'P1 підключено' },
    error:      { color: '#ef4444', label: 'P1 недоступний' },
  }[hubStatus]

  return (
    <div className="space-y-6">
      <h1 className="font-cyber text-4xl text-neon-pink text-center">Рандомізатор</h1>

      {/* SignalR status bar */}
      {hubIndicator.label && (
        <div
          className="max-w-2xl mx-auto rounded-lg px-4 py-2 flex items-center justify-between text-sm"
          style={{
            backgroundColor: `${hubIndicator.color}15`,
            borderLeft: `3px solid ${hubIndicator.color}`,
            color: hubIndicator.color,
          }}
        >
          <div className="flex items-center gap-2">
            {hubStatus === 'connecting' ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-current" />
            )}
            <span className="font-mono">{hubIndicator.label}</span>
          </div>

          {/* Timer */}
          {hubStatus === 'connected' && timerRemaining != null && (
            <div className="flex items-center gap-3">
              <span className="font-cyber text-lg tracking-wider">
                {formatTime(timerRemaining)}
              </span>
              {/* Progress bar — fills right-to-left as time runs out */}
              <div className="w-24 h-1.5 rounded-full bg-current/20 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    backgroundColor: timerRemaining < 30 ? '#ef4444' : hubIndicator.color,
                    width: `${Math.min(100, (timerRemaining / 300) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Round ended toast */}
      {roundEndedToast && (
        <div className="max-w-2xl mx-auto rounded-lg px-4 py-2 text-sm font-cyber text-center"
          style={{ backgroundColor: '#f59e0b15', border: '1px solid #f59e0b55', color: '#f59e0b' }}>
          {roundEndedToast}
        </div>
      )}

      {/* Controls */}
      <div className="card-cyber max-w-2xl mx-auto">
        <h2 className="font-cyber text-sm text-gray-400 uppercase mb-4">Параметри витягування</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="Код сесії *"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value.toUpperCase())}
            maxLength={6}
            className="input-cyber text-sm font-mono tracking-widest uppercase"
          />
          <input
            type="text"
            placeholder="Team ID *"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="input-cyber text-sm"
          />
        </div>

        <select
          value={selectedSuit}
          onChange={(e) => setSelectedSuit(e.target.value)}
          className="input-cyber mb-4"
        >
          <option value="">Будь-яка масть</option>
          {Object.entries(SUITS).map(([key, suit]) => (
            <option key={key} value={key}>{suit.nameUa} — {suit.description}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <input
              type="number"
              placeholder="Раунд (необов'язково)"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="input-cyber text-sm w-full"
              min="1"
            />
            {activeRound && round === String(activeRound) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-400">live</span>
            )}
          </div>
          <input
            type="number"
            placeholder="Кількість карток"
            value={drawCount}
            onChange={(e) => setDrawCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            className="input-cyber text-sm"
            min="1"
            max="10"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={handleDraw}
          disabled={isDrawing}
          className="w-full py-4 rounded-lg font-cyber text-xl font-bold transition-all duration-300
                     border-2 border-neon-pink text-neon-pink
                     hover:bg-neon-pink hover:text-cyber-darker hover:shadow-neon-pink
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDrawing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-neon-pink border-t-transparent rounded-full animate-spin" />
              Тягнемо...
            </span>
          ) : (
            `Тягнути ${drawCount > 1 ? drawCount + ' карток' : 'картку'}`
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="font-cyber text-lg text-neon-cyan">
            Результат ({results.length} {results.length === 1 ? 'картка' : 'карток'})
          </h2>
          {results.map((result, i) => {
            const card = result.card
            const suit = SUITS[card.suit]
            const rarity = RARITY[card.rarity] ?? RARITY.common
            return (
              <div
                key={result.historyId || i}
                className="card-cyber animate-fade-in"
                style={{
                  borderColor: suit?.color,
                  animationDelay: `${i * 100}ms`,
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold uppercase px-2 py-1 rounded"
                      style={{
                        color: suit?.color,
                        backgroundColor: `${suit?.color}20`,
                      }}
                    >
                      {suit?.nameUa || card.suit}
                    </span>
                    <span
                      className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
                      style={{
                        color: rarity.color,
                        backgroundColor: `${rarity.color}18`,
                        borderColor: `${rarity.color}55`,
                      }}
                    >
                      {rarity.labelUa}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(result.timestamp).toLocaleTimeString('uk-UA')}
                  </span>
                </div>
                <h3 className="font-cyber text-2xl text-white mb-1">{card.nameUa}</h3>
                <p className="text-gray-500 text-sm italic mb-3">{card.nameEn}</p>
                <p className="text-gray-300">{card.descriptionUa}</p>
                {card.descriptionEn && (
                  <p className="text-gray-500 text-sm italic mt-2">{card.descriptionEn}</p>
                )}
                <div className="flex gap-4 mt-3 text-xs text-gray-600">
                  <span>Вага: {card.weight}</span>
                  {card.rounds?.length > 0 && <span>Раунди: {card.rounds.join(', ')}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RandomizerPage
