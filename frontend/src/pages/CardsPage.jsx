import { useState, useEffect } from 'react'
import { SUITS, RARITY } from '../utils/suitColors'
import cardsApi from '../services/cardsApi'
import { useAuth } from '../context/AuthContext'

function CardsPage() {
  const { teamAuth } = useAuth()
  const [activeSuit, setActiveSuit] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [seenCardIds, setSeenCardIds] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => { loadCards() }, [activeSuit])

  useEffect(() => {
    if (!teamAuth) { setSeenCardIds(null); return }
    cardsApi.getTeamCardIds(teamAuth.sessionCode, teamAuth.teamId)
      .then(res => setSeenCardIds(new Set(res.data.cardIds)))
      .catch(() => setSeenCardIds(new Set()))
  }, [teamAuth])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelectedCard(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const loadCards = async () => {
    setLoading(true)
    try {
      const res = activeSuit
        ? await cardsApi.getCardsBySuit(activeSuit)
        : await cardsApi.getCards()
      setCards(res.data)
    } catch (err) {
      console.error('Failed to load cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCards = cards.filter(card => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      card.nameUa?.toLowerCase().includes(q) ||
      card.nameEn?.toLowerCase().includes(q) ||
      card.descriptionUa?.toLowerCase().includes(q) ||
      card.descriptionEn?.toLowerCase().includes(q)
    )
  })

  // "Усі" tab in team mode: show only seen cards
  const cardsToShow = (teamAuth && seenCardIds !== null && activeSuit === null)
    ? filteredCards.filter(c => seenCardIds.has(c.id))
    : filteredCards

  const isWaitingForSeen = teamAuth && seenCardIds === null && activeSuit === null

  return (
    <>
      <style>{`
        @keyframes cardExpand {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-cyber text-3xl text-neon-cyan">Каталог карток</h1>
          <p className="text-gray-400 mt-1">8 мастей, {cards.length} карток</p>
        </div>

        <input
          type="text"
          placeholder="Пошук карток за назвою або описом..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-cyber mb-6"
        />

        {/* Suit Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveSuit(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${!activeSuit ? 'bg-neon-cyan text-cyber-darker' : 'border border-cyber-border text-gray-400 hover:border-neon-cyan'}`}
          >
            Усі
          </button>
          {Object.entries(SUITS).map(([key, suit]) => (
            <button key={key} onClick={() => setActiveSuit(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                borderWidth: '1px', borderStyle: 'solid',
                borderColor: activeSuit === key ? suit.color : 'rgba(255,255,255,0.1)',
                color: activeSuit === key ? suit.color : '#9ca3af',
                backgroundColor: activeSuit === key ? `${suit.color}15` : 'transparent',
              }}
            >
              {suit.nameUa}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {loading || isWaitingForSeen ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 mt-3">Завантаження карток...</p>
          </div>
        ) : teamAuth && seenCardIds !== null && activeSuit === null && seenCardIds.size === 0 ? (
          <div className="card-cyber text-center py-12">
            <p className="text-gray-500 text-lg">Ви ще не витягували жодної картки</p>
            <p className="text-gray-600 text-sm mt-2">Перейдіть до Рандомізатора щоб витягнути першу картку</p>
          </div>
        ) : cardsToShow.length === 0 ? (
          <div className="card-cyber text-center py-12">
            <p className="text-gray-500">Карток не знайдено</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neon-cyan text-sm mt-2 hover:underline">
                Скинути пошук
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {cardsToShow.map(card => {
              const suit = SUITS[card.suit]
              const rarity = RARITY[card.rarity] ?? RARITY.common
              const hasImage = !!card.imageData
              const isMystery = teamAuth && seenCardIds !== null && activeSuit !== null && !seenCardIds.has(card.id)

              if (isMystery) return (
                <div key={card.id}
                  className="bg-cyber-card rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center"
                  style={{ borderColor: suit?.color || '#333', height: '560px' }}
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 text-5xl font-cyber"
                    style={{ backgroundColor: `${suit?.color || '#999'}20`, color: suit?.color || '#999' }}>
                    ?
                  </div>
                  <span className="text-xs font-bold uppercase px-2 py-1 rounded mb-3"
                    style={{ color: suit?.color, backgroundColor: `${suit?.color}20` }}>
                    {suit?.nameUa || card.suit}
                  </span>
                  <p className="text-gray-600 text-sm">Ще не відкрита</p>
                </div>
              )

              return hasImage ? (
                <div key={card.id} onClick={() => setSelectedCard(card)}
                  className="bg-cyber-card rounded-xl border-2 overflow-hidden flex flex-col cursor-pointer
                             transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
                  style={{ borderColor: suit?.color || '#333', height: '560px' }}
                >
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
                    <h3 className="font-cyber text-xl text-white leading-tight">{card.nameUa}</h3>
                    <p className="text-gray-500 text-sm italic mt-0.5">{card.nameEn}</p>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={card.imageData} alt={card.nameUa}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                  </div>
                  <div className="px-3 pt-2 pb-3 flex-shrink-0">
                    <p className="text-gray-300 text-sm leading-snug mb-1 line-clamp-2">{card.descriptionUa}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600 mt-1">
                      <span>Ймовірність випаду: {card.weight}</span>
                      {card.rounds?.length > 0 && <span>Раунди: {card.rounds.join(', ')}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={card.id} onClick={() => setSelectedCard(card)}
                  className="bg-cyber-card rounded-xl border-2 overflow-hidden flex flex-col cursor-pointer
                             transition-transform duration-200 hover:scale-[1.02]"
                  style={{ borderColor: suit?.color || '#333', height: '560px' }}
                >
                  <div className="px-4 pt-4 pb-3 flex-shrink-0">
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
                    <h3 className="font-cyber text-xl text-white leading-tight">{card.nameUa}</h3>
                    <p className="text-gray-500 text-sm italic mt-0.5">{card.nameEn}</p>
                  </div>
                  <div className="px-4 pb-3 flex flex-col flex-1 overflow-hidden">
                    <p className="text-gray-400 text-base leading-snug flex-1 overflow-hidden">{card.descriptionUa}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600 mt-2 flex-shrink-0">
                      <span>Ймовірність випаду: {card.weight}</span>
                      {card.rounds?.length > 0 && <span>Раунди: {card.rounds.join(', ')}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Card expand overlay ── */}
      {selectedCard && (() => {
        const suit = SUITS[selectedCard.suit]
        const rarity = RARITY[selectedCard.rarity] ?? RARITY.common
        return (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.82)',
              backdropFilter: 'blur(4px)',
              zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setSelectedCard(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="bg-cyber-card rounded-xl border-2 overflow-y-auto"
              style={{
                maxWidth: '480px',
                width: '100%',
                maxHeight: '90vh',
                borderColor: suit?.color || '#333',
                animation: 'cardExpand 0.3s ease forwards',
              }}
            >
              {/* Image */}
              {selectedCard.imageData && (
                <div style={{ background: '#000' }}>
                  <img src={selectedCard.imageData} alt={selectedCard.nameUa}
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }} />
                </div>
              )}

              <div className="px-5 py-5">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold uppercase px-2 py-1 rounded"
                    style={{ color: suit?.color, backgroundColor: `${suit?.color}20` }}>
                    {suit?.nameUa || selectedCard.suit}
                  </span>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded border"
                    style={{ color: rarity.color, backgroundColor: `${rarity.color}18`, borderColor: `${rarity.color}55` }}>
                    {rarity.labelUa}
                  </span>
                </div>

                <h2 className="font-cyber text-3xl text-white mb-1">{selectedCard.nameUa}</h2>
                <p className="text-gray-500 text-base italic mb-4">{selectedCard.nameEn}</p>
                <p className="text-gray-300 text-base leading-relaxed">{selectedCard.descriptionUa}</p>
                {selectedCard.descriptionEn && (
                  <p className="text-gray-500 text-sm italic mt-3">{selectedCard.descriptionEn}</p>
                )}
                <div className="flex flex-wrap gap-x-4 text-xs text-gray-600 mt-4 pt-4 border-t border-cyber-border/30">
                  <span>Ймовірність випаду: {selectedCard.weight}</span>
                  {selectedCard.rounds?.length > 0 && <span>Раунди: {selectedCard.rounds.join(', ')}</span>}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

export default CardsPage
