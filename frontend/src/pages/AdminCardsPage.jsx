import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SUITS } from '../utils/suitColors'
import cardsApi from '../services/cardsApi'

const emptyForm = {
  nameUa: '', nameEn: '', descriptionUa: '', descriptionEn: '',
  suit: '', type: '', weight: 1, rounds: '',
}

function AdminCardsPage() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterSuit, setFilterSuit] = useState('')

  useEffect(() => { loadCards() }, [])

  const loadCards = async () => {
    setLoading(true)
    try {
      const res = await cardsApi.getCards()
      setCards(res.data)
    } catch (err) {
      console.error('Failed to load cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setError('')
  }

  const openEdit = (card) => {
    setEditingId(card.id)
    setForm({
      nameUa: card.nameUa || '',
      nameEn: card.nameEn || '',
      descriptionUa: card.descriptionUa || '',
      descriptionEn: card.descriptionEn || '',
      suit: card.suit || '',
      type: card.type || '',
      weight: card.weight || 1,
      rounds: card.rounds?.join(', ') || '',
    })
    setShowForm(true)
    setError('')
  }

  const handleSave = async () => {
    if (!form.nameUa || !form.suit) {
      setError('Назва (UA) та масть обов\'язкові')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = {
        nameUa: form.nameUa,
        nameEn: form.nameEn || form.nameUa,
        descriptionUa: form.descriptionUa,
        descriptionEn: form.descriptionEn,
        suit: form.suit,
        type: form.type || 'standard',
        weight: parseFloat(form.weight) || 1,
        rounds: form.rounds
          ? form.rounds.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r))
          : [],
      }

      if (editingId) {
        await cardsApi.updateCard(editingId, data)
      } else {
        await cardsApi.createCard(data)
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
      await loadCards()
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Видалити цю картку?')) return
    try {
      await cardsApi.deleteCard(id)
      await loadCards()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const toggleActive = async (card) => {
    try {
      await cardsApi.updateCard(card.id, { isActive: !card.isActive })
      await loadCards()
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const filteredCards = filterSuit
    ? cards.filter(c => c.suit === filterSuit)
    : cards

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-cyber text-3xl text-neon-cyan">Адмін: Картки</h1>
          <p className="text-gray-500 text-sm mt-1">{cards.length} карток у базі</p>
        </div>
        <div className="flex gap-3">
          <a href="http://localhost:3001" className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-all">
            Адмін сесій →
          </a>
          <a href="http://localhost:3003/admin" className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-all">
            Адмін балів →
          </a>
          <button onClick={openCreate} className="btn-neon-pink">
            + Нова картка
          </button>
        </div>
      </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="card-cyber mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-cyber text-lg text-neon-pink">
                {editingId ? 'Редагувати картку' : 'Нова картка'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="text-gray-500 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Назва (UA) *"
                value={form.nameUa}
                onChange={(e) => handleChange('nameUa', e.target.value)}
                className="input-cyber"
              />
              <input
                type="text"
                placeholder="Name (EN)"
                value={form.nameEn}
                onChange={(e) => handleChange('nameEn', e.target.value)}
                className="input-cyber"
              />
              <textarea
                placeholder="Опис (UA)"
                value={form.descriptionUa}
                onChange={(e) => handleChange('descriptionUa', e.target.value)}
                className="input-cyber h-20 resize-none"
              />
              <textarea
                placeholder="Description (EN)"
                value={form.descriptionEn}
                onChange={(e) => handleChange('descriptionEn', e.target.value)}
                className="input-cyber h-20 resize-none"
              />
              <select
                value={form.suit}
                onChange={(e) => handleChange('suit', e.target.value)}
                className="input-cyber"
              >
                <option value="">Оберіть масть *</option>
                {Object.entries(SUITS).map(([key, suit]) => (
                  <option key={key} value={key}>{suit.nameUa}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Тип (standard, special, ...)"
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="input-cyber"
              />
              <input
                type="number"
                placeholder="Вага (weight)"
                value={form.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                className="input-cyber"
                min="0.1"
                step="0.1"
              />
              <input
                type="text"
                placeholder="Раунди (1, 2, 3)"
                value={form.rounds}
                onChange={(e) => handleChange('rounds', e.target.value)}
                className="input-cyber"
              />
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving} className="btn-neon">
                {saving ? 'Збереження...' : (editingId ? 'Оновити' : 'Створити')}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                Скасувати
              </button>
            </div>
          </div>
        )}

        {/* Filter by suit */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterSuit('')}
            className={`px-3 py-1 rounded text-xs transition-all ${!filterSuit ? 'bg-neon-cyan text-cyber-darker' : 'text-gray-500 hover:text-white'}`}
          >
            Усі
          </button>
          {Object.entries(SUITS).map(([key, suit]) => (
            <button
              key={key}
              onClick={() => setFilterSuit(key)}
              className="px-3 py-1 rounded text-xs transition-all"
              style={{
                color: filterSuit === key ? suit.color : '#6b7280',
                backgroundColor: filterSuit === key ? `${suit.color}20` : 'transparent',
              }}
            >
              {suit.nameUa}
            </button>
          ))}
        </div>

        {/* Cards Table */}
        <div className="card-cyber overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">ID</th>
                <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Назва</th>
                <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Масть</th>
                <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Тип</th>
                <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Вага</th>
                <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Статус</th>
                <th className="py-3 px-4 text-neon-cyan font-cyber text-sm">Дії</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    <span className="inline-block w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mr-2" />
                    Завантаження...
                  </td>
                </tr>
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    {cards.length === 0 ? 'Карток ще немає. Створіть першу!' : 'Немає карток для цього фільтру'}
                  </td>
                </tr>
              ) : (
                filteredCards.map(card => {
                  const suit = SUITS[card.suit]
                  return (
                    <tr key={card.id} className="border-b border-cyber-border/30 hover:bg-cyber-dark/50">
                      <td className="py-3 px-4 text-sm text-gray-500">{card.id}</td>
                      <td className="py-3 px-4">
                        <p className="text-white text-sm">{card.nameUa}</p>
                        <p className="text-gray-600 text-xs">{card.nameEn}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            color: suit?.color || '#999',
                            backgroundColor: `${suit?.color || '#999'}20`,
                          }}
                        >
                          {suit?.nameUa || card.suit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">{card.type || '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">{card.weight}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActive(card)}
                          className={`text-xs px-2 py-0.5 rounded cursor-pointer ${
                            card.isActive
                              ? 'text-green-400 bg-green-400/20'
                              : 'text-red-400 bg-red-400/20'
                          }`}
                        >
                          {card.isActive ? 'Активна' : 'Неактивна'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(card)}
                            className="text-neon-cyan hover:text-white text-xs transition-colors"
                          >
                            Ред.
                          </button>
                          <button
                            onClick={() => handleDelete(card.id)}
                            className="text-red-400 hover:text-red-300 text-xs transition-colors"
                          >
                            Вид.
                          </button>
                        </div>
                      </td>
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

export default AdminCardsPage
