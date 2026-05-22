import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import * as signalR from '@microsoft/signalr'
import gsap from 'gsap'
import { SUITS, RARITY } from '../utils/suitColors'
import cardsApi from '../services/cardsApi'
import { getSessions, getTeams } from '../services/sessionsApi'
import { useAuth } from '../context/AuthContext'

const P1_HUB_URL = import.meta.env.VITE_P1_HUB_URL || 'http://localhost:8081/hubs/session'

function formatTime(seconds) {
  if (seconds == null || seconds < 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Unique incrementing key — guarantees no duplicate even on rapid draws
let _animKeyCounter = 0
function nextAnimKey() { return ++_animKeyCounter }

function CardDisplay({ result, onClick }) {
  const card = result.card
  const suit = SUITS[card.suit]
  const rarity = RARITY[card.rarity] ?? RARITY.common
  const cardRef = useRef(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    gsap.set(el, { rotationY: 180, y: 400, scale: 0.8, opacity: 0, transformPerspective: 1000 })
    const tl = gsap.timeline()
    tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 1,   ease: 'back.out(1.7)' }, 0)
      .to(el, { rotationY: 740,          duration: 1.25, ease: 'sine.inOut' },       0)
      .to(el, { rotationY: 720,          duration: 0.15, ease: 'power2.out' })
      .set(el, { rotationY: 0 })
    return () => { tl.kill() }
  }, [])

  const handleMouseMove = (e) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width  - 0.5
    const ny = (e.clientY - rect.top)  / rect.height - 0.5
    gsap.to(el, { rotationY: nx * 40, rotationX: -ny * 40, transformPerspective: 1000, duration: 0.3, ease: 'power2.out' })
  }

  const handleMouseLeave = () => {
    const el = cardRef.current
    if (!el) return
    gsap.to(el, { rotationY: 0, rotationX: 0, duration: 0.6, ease: 'power2.out' })
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="bg-cyber-card rounded-xl border-2 overflow-hidden flex flex-col"
      style={{ opacity: 0, borderColor: suit?.color || '#333', height: '560px', cursor: 'pointer' }}
    >
      {/* Badges + name */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase px-2 py-1 rounded"
            style={{ color: suit?.color, backgroundColor: `${suit?.color}20` }}>
            {suit?.nameUa || card.suit}
          </span>
          <span className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
            style={{ color: rarity.color, backgroundColor: `${rarity.color}18`, borderColor: `${rarity.color}55` }}>
            {rarity.labelUa}
          </span>
        </div>
        <h2 className="font-cyber text-xl text-white leading-tight">{card.nameUa}</h2>
        <p className="text-gray-500 text-sm italic mt-0.5">{card.nameEn}</p>
      </div>

      {/* Image — flex:1 fills remaining space */}
      {card.imageData ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={card.imageData} alt={card.nameUa}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Description */}
      <div className="px-3 pt-2 pb-3 flex-shrink-0">
        <p className="text-gray-300 text-sm leading-snug mb-1 line-clamp-2">{card.descriptionUa}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600 mt-1">
          <span>Ймовірність випаду: {card.weight}</span>
          {card.rounds?.length > 0 && <span>Раунди: {card.rounds.join(', ')}</span>}
        </div>
      </div>
    </div>
  )
}

function RandomizerPage() {
  const { teamAuth, adminAuth } = useAuth()
  const [searchParams] = useSearchParams()
  const [selectedSuit, setSelectedSuit] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [round, setRound] = useState('')
  const [drawCount, setDrawCount] = useState(1)
  const [isDrawing, setIsDrawing] = useState(false)
  // Array of { result, animKey } — accumulates across draws
  const [drawnCards, setDrawnCards] = useState([])
  const [error, setError] = useState('')
  const [expandedCard, setExpandedCard] = useState(null)

  const [sessions, setSessions] = useState([])
  const [teams, setTeams] = useState([])
  const [sessionsAvailable, setSessionsAvailable] = useState(null)

  const [hubStatus, setHubStatus] = useState('idle')
  const [activeRound, setActiveRound] = useState(null)
  const [timerRemaining, setTimerRemaining] = useState(null)
  const [roundEndedToast, setRoundEndedToast] = useState(null)
  const connectionRef = useRef(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setExpandedCard(null) }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  useEffect(() => {
    if (teamAuth) {
      setSessionId(teamAuth.sessionCode)
      setTeamId(String(teamAuth.teamId))
    } else {
      const urlSession = searchParams.get('session')
      const urlTeam = searchParams.get('team')
      setSessionId(urlSession || localStorage.getItem('hackathon_session') || '')
      setTeamId(urlTeam || localStorage.getItem('hackathon_teamId') || '')
    }
  }, [teamAuth])

  useEffect(() => {
    if (!adminAuth) return
    getSessions()
      .then(data => { setSessions(Array.isArray(data) ? data : []); setSessionsAvailable(true) })
      .catch(() => setSessionsAvailable(false))
  }, [adminAuth])

  useEffect(() => {
    if (!adminAuth || sessionId.length !== 6) { setTeams([]); return }
    getTeams(sessionId)
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => setTeams([]))
  }, [sessionId, adminAuth])

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
    connection.on('TimerTick', ({ remaining }) => setTimerRemaining(remaining))
    connection.onreconnecting(() => setHubStatus('connecting'))
    connection.onreconnected(() => setHubStatus('connected'))
    connection.onclose(() => setHubStatus('error'))
    connection.start()
      .then(() => { setHubStatus('connected'); return connection.invoke('JoinSession', sessionId) })
      .catch(err => { console.warn('SignalR:', err); setHubStatus('error') })
    connectionRef.current = connection
    return () => {
      connection.stop()
      connectionRef.current = null
      clearTimeout(toastTimerRef.current)
    }
  }, [sessionId])

  const handleDraw = async () => {
    if (!sessionId || !teamId) { setError('Введіть код сесії та Team ID'); return }
    setIsDrawing(true)
    setError('')
    try {
      const payload = {
        sessionId,
        teamId: parseInt(teamId),
        suit: selectedSuit || undefined,
        round: round ? parseInt(round) : undefined,
      }
      if (drawCount > 1) {
        const res = await cardsApi.drawRandomMulti({ ...payload, count: drawCount })
        for (const result of res.data) {
          await new Promise(r => setTimeout(r, 800))
          setDrawnCards(prev => [...prev, { result, animKey: nextAnimKey() }])
        }
      } else {
        const res = await cardsApi.drawRandom(payload)
        setDrawnCards(prev => [...prev, { result: res.data, animKey: nextAnimKey() }])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка при витягуванні картки')
    } finally {
      setIsDrawing(false)
    }
  }

  const hubIndicator = {
    idle:       { color: '#6b7280', label: null },
    connecting: { color: '#f59e0b', label: 'Підключення до P1...' },
    connected:  { color: '#22c55e', label: activeRound ? `Раунд ${activeRound} активний` : 'P1 підключено' },
    error:      { color: '#ef4444', label: 'P1 недоступний' },
  }[hubStatus]

  // Grid layout based on total card count
  const count = drawnCards.length
  const gridStyle = count === 1
    ? { display: 'grid', gridTemplateColumns: '1fr', maxWidth: '380px', margin: '0 auto' }
    : count === 2
      ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', alignItems: 'start', maxWidth: '780px', margin: '0 auto' }
      : { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', alignItems: 'start', maxWidth: '780px', margin: '0 auto', overflowY: 'auto', maxHeight: '90vh', paddingRight: '4px' }

  if (!teamAuth && !adminAuth) return <Navigate to="/login" replace />

  return (
    <>
    <style>{`
      @keyframes cardExpand {
        from { transform: scale(0.88); opacity: 0; }
        to   { transform: scale(1);    opacity: 1; }
      }
    `}</style>
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', minHeight: 'calc(100vh - 140px)' }}>

      {/* ── LEFT COLUMN 40% ── */}
      <div style={{ width: '40%', flexShrink: 0 }}>
        <h1 className="font-cyber text-3xl text-neon-pink mb-6">Рандомізатор</h1>

        <div className="card-cyber mb-4">
          <h2 className="font-cyber text-sm text-gray-400 uppercase mb-4">Параметри витягування</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {teamAuth ? (
              <div className="input-cyber text-sm font-mono tracking-widest bg-cyber-dark/50 text-gray-400 flex items-center">
                {teamAuth.sessionCode}
              </div>
            ) : adminAuth && sessionsAvailable ? (
              <div className="flex gap-1">
                <select value={sessionId} onChange={e => setSessionId(e.target.value)} className="input-cyber text-sm font-mono flex-1">
                  <option value="">Оберіть сесію *</option>
                  {sessions.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name} ({s.status})</option>)}
                </select>
                <button type="button"
                  onClick={() => getSessions().then(d => { setSessions(Array.isArray(d) ? d : []); setSessionsAvailable(true) }).catch(() => {})}
                  className="px-2 text-gray-400 hover:text-white border border-cyber-border rounded transition-colors"
                  title="Оновити"
                >↻</button>
              </div>
            ) : (
              <input type="text" placeholder="Код сесії *" value={sessionId}
                onChange={e => setSessionId(e.target.value.toUpperCase())} maxLength={6}
                className="input-cyber text-sm font-mono tracking-widest uppercase" />
            )}

            {teamAuth ? (
              <div className="input-cyber text-sm bg-cyber-dark/50 text-gray-400 flex items-center">
                {teamAuth.teamName}
              </div>
            ) : adminAuth && teams.length > 0 ? (
              <select value={teamId} onChange={e => setTeamId(e.target.value)} className="input-cyber text-sm">
                <option value="">Оберіть команду *</option>
                {teams.map(t => <option key={t.id} value={String(t.id)}>{t.id} — {t.name}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="Team ID *" value={teamId}
                onChange={e => setTeamId(e.target.value)} className="input-cyber text-sm" />
            )}
          </div>

          <select value={selectedSuit} onChange={e => setSelectedSuit(e.target.value)} className="input-cyber mb-4">
            <option value="">Будь-яка масть</option>
            {Object.entries(SUITS).map(([key, suit]) => (
              <option key={key} value={key}>{suit.nameUa} — {suit.description}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input type="number" placeholder="Раунд" value={round}
                onChange={e => setRound(e.target.value)} className="input-cyber text-sm w-full" min="1" />
              {activeRound && round === String(activeRound) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-400">live</span>
              )}
            </div>
            <input type="number" placeholder="Кількість" value={drawCount}
              onChange={e => setDrawCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="input-cyber text-sm" min="1" max="10" />
          </div>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* Draw button */}
        <button
          onClick={handleDraw}
          disabled={isDrawing}
          className="w-full py-4 rounded-lg font-cyber text-xl font-bold transition-all duration-300
                     border-2 border-neon-pink text-neon-pink mb-3
                     hover:bg-neon-pink hover:text-cyber-darker hover:shadow-neon-pink
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDrawing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-neon-pink border-t-transparent rounded-full animate-spin" />
              Тягнемо...
            </span>
          ) : `Тягнути ${drawCount > 1 ? drawCount + ' карток' : 'картку'}`}
        </button>

        {/* Clear button */}
        {drawnCards.length > 0 && (
          <button
            onClick={() => setDrawnCards([])}
            className="w-full py-2 rounded-lg text-sm transition-all duration-200 mb-4
                       border border-gray-600 text-gray-400
                       hover:border-gray-400 hover:text-white"
          >
            Очистити результати ({drawnCards.length})
          </button>
        )}

        {/* P1 status bar */}
        {hubIndicator.label && (
          <div className="rounded-lg px-4 py-2 flex items-center justify-between text-sm"
            style={{ backgroundColor: `${hubIndicator.color}15`, borderLeft: `3px solid ${hubIndicator.color}`, color: hubIndicator.color }}>
            <div className="flex items-center gap-2">
              {hubStatus === 'connecting'
                ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <span className="w-2 h-2 rounded-full bg-current" />}
              <span className="font-mono">{hubIndicator.label}</span>
            </div>
            {hubStatus === 'connected' && timerRemaining != null && (
              <div className="flex items-center gap-3">
                <span className="font-cyber text-lg tracking-wider">{formatTime(timerRemaining)}</span>
                <div className="w-20 h-1.5 rounded-full bg-current/20 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ backgroundColor: timerRemaining < 30 ? '#ef4444' : hubIndicator.color, width: `${Math.min(100, (timerRemaining / 300) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {roundEndedToast && (
          <div className="mt-3 rounded-lg px-4 py-2 text-sm font-cyber text-center"
            style={{ backgroundColor: '#f59e0b15', border: '1px solid #f59e0b55', color: '#f59e0b' }}>
            {roundEndedToast}
          </div>
        )}
      </div>

      {/* ── RIGHT COLUMN 60% ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {drawnCards.length === 0 && !isDrawing ? (
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            <p className="font-cyber text-2xl text-gray-500 text-center leading-relaxed" style={{ opacity: 0.35 }}>
              Тягни картку<br />щоб побачити результат
            </p>
          </div>
        ) : drawnCards.length === 0 && isDrawing ? (
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            <span className="w-14 h-14 border-4 border-neon-pink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div style={gridStyle}>
            {drawnCards.map(({ result, animKey }) => (
              <CardDisplay key={animKey} result={result} onClick={() => setExpandedCard(result)} />
            ))}
          </div>
        )}
      </div>

    </div>

    {/* ── Expanded card overlay ── */}
    {expandedCard && (() => {
      const card = expandedCard.card
      const suit = SUITS[card.suit]
      const rarity = RARITY[card.rarity] ?? RARITY.common
      return (
        <div
          onClick={() => setExpandedCard(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-cyber-card rounded-xl border-2 overflow-y-auto"
            style={{
              maxWidth: '480px', width: '100%',
              maxHeight: '90vh',
              borderColor: suit?.color || '#333',
              animation: 'cardExpand 0.3s ease forwards',
            }}
          >
            {card.imageData && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a' }}>
                <img src={card.imageData} alt={card.nameUa}
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }} />
              </div>
            )}
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase px-2 py-1 rounded"
                  style={{ color: suit?.color, backgroundColor: `${suit?.color}20` }}>
                  {suit?.nameUa || card.suit}
                </span>
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
                  style={{ color: rarity.color, backgroundColor: `${rarity.color}18`, borderColor: `${rarity.color}55` }}>
                  {rarity.labelUa}
                </span>
              </div>
              <h2 className="font-cyber text-3xl text-white mb-1">{card.nameUa}</h2>
              <p className="text-gray-500 text-base italic mb-4">{card.nameEn}</p>
              <p className="text-gray-300 text-base leading-relaxed">{card.descriptionUa}</p>
              {card.descriptionEn && (
                <p className="text-gray-500 text-sm italic mt-3">{card.descriptionEn}</p>
              )}
            </div>
          </div>
        </div>
      )
    })()}
    </>
  )
}

export default RandomizerPage
