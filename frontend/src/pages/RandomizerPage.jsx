import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SUITS } from '../utils/suitColors'
import cardsApi from '../services/cardsApi'

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

  // Prefill from URL query params or localStorage
  useEffect(() => {
    const urlSession = searchParams.get('session')
    const urlTeam = searchParams.get('team')
    setSessionId(urlSession || localStorage.getItem('hackathon_session') || '')
    setTeamId(urlTeam || localStorage.getItem('hackathon_teamId') || '')
  }, [])

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
        // Animate results one by one
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

  return (
    <div className="space-y-6">
      <h1 className="font-cyber text-4xl text-neon-pink text-center">Рандомізатор</h1>

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
          <input
            type="number"
            placeholder="Раунд (необов'язково)"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            className="input-cyber text-sm"
            min="1"
          />
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
                  <span
                    className="text-xs font-bold uppercase px-2 py-1 rounded"
                    style={{
                      color: suit?.color,
                      backgroundColor: `${suit?.color}20`,
                    }}
                  >
                    {suit?.nameUa || card.suit}
                  </span>
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
