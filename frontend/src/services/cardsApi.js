import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

const cardsApi = {
  // Cards
  getCards: (params) => api.get('/cards', { params }),
  getCardsBySuit: (suit) => api.get(`/cards/suits/${suit}`),
  getCard: (id) => api.get(`/cards/${id}`),
  createCard: (data) => api.post('/cards', data),
  updateCard: (id, data) => api.put(`/cards/${id}`, data),
  deleteCard: (id) => api.delete(`/cards/${id}`),
  searchCards: (query) => api.get('/cards/search', { params: { q: query } }),

  // Randomizer
  drawRandom: (data) => api.post('/cards/random', data),
  drawRandomMulti: (data) => api.post('/cards/random/multi', data),

  // History
  getSessionHistory: (sessionId) => api.get(`/history/${sessionId}`),
  getTeamHistory: (sessionId, teamId) => api.get(`/history/${sessionId}/team/${teamId}`),
  recordTrade: (data) => api.post('/history/trade', data),
  exportHistory: (sessionId) => api.get(`/history/${sessionId}/export`, { responseType: 'blob' }),

  // Export
  exportCardsPdf: () => api.get('/cards/export/pdf', { responseType: 'blob' }),
  exportSuitPdf: (suit) => api.get(`/cards/export/pdf/${suit}`, { responseType: 'blob' }),
}

export default cardsApi
