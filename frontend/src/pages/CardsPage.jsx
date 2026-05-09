import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SUITS, getSuitStyle } from '../utils/suitColors'
import cardsApi from '../services/cardsApi'

function CardsPage() {
  const [activeSuit, setActiveSuit] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [flippedCards, setFlippedCards] = useState({})

  useEffect(() => {
    loadCards()
  }, [activeSuit])

  const loadCards = async () => {
    setLoading(true)
    try {
      let res
      if (activeSuit) {
        res = await cardsApi.getCardsBySuit(activeSuit)
      } else {
        res = await cardsApi.getCards()
      }
      setCards(res.data)
    } catch (err) {
      console.error('Failed to load cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleFlip = (id) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }))
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-cyber text-3xl text-neon-cyan">Каталог карток</h1>
        <p className="text-gray-400 mt-1">8 мастей, {cards.length} карток</p>
      </div>

      {/* Search */}
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
            <button
              key={key}
              onClick={() => setActiveSuit(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
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
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 mt-3">Завантаження карток...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="card-cyber text-center py-12">
            <p className="text-gray-500">Карток не знайдено</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neon-cyan text-sm mt-2 hover:underline">
                Скинути пошук
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map(card => {
              const suit = SUITS[card.suit]
              const isFlipped = flippedCards[card.id]

              return (
                <div
                  key={card.id}
                  onClick={() => toggleFlip(card.id)}
                  className="cursor-pointer"
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="relative transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                      minHeight: '200px',
                    }}
                  >
                    {/* Front */}
                    <div
                      className="absolute inset-0 bg-cyber-card rounded-xl p-5 border-2 backface-hidden"
                      style={{
                        borderColor: suit?.color || '#333',
                        backfaceVisibility: 'hidden',
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className="text-xs font-bold uppercase px-2 py-1 rounded"
                          style={{
                            color: suit?.color,
                            backgroundColor: `${suit?.color}20`,
                          }}
                        >
                          {suit?.nameUa || card.suit}
                        </span>
                        {card.type && (
                          <span className="text-xs text-gray-500">{card.type}</span>
                        )}
                      </div>
                      <h3 className="font-cyber text-lg text-white mb-1">{card.nameUa}</h3>
                      <p className="text-gray-500 text-sm italic mb-3">{card.nameEn}</p>
                      <p className="text-gray-400 text-sm line-clamp-3">{card.descriptionUa}</p>
                      <div className="absolute bottom-4 right-4 text-xs text-gray-600">
                        Натисни для деталей
                      </div>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute inset-0 bg-cyber-card rounded-xl p-5 border-2"
                      style={{
                        borderColor: suit?.color || '#333',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <h3 className="font-cyber text-lg mb-3" style={{ color: suit?.color }}>
                        {card.nameUa}
                      </h3>
                      <p className="text-gray-300 text-sm mb-4">{card.descriptionUa}</p>
                      {card.descriptionEn && (
                        <p className="text-gray-500 text-sm italic mb-4">{card.descriptionEn}</p>
                      )}
                      <div className="space-y-1 text-xs text-gray-500">
                        <p>Вага: {card.weight}</p>
                        {card.rounds?.length > 0 && (
                          <p>Раунди: {card.rounds.join(', ')}</p>
                        )}
                        <p>Статус: {card.isActive ? 'Активна' : 'Неактивна'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}

export default CardsPage
