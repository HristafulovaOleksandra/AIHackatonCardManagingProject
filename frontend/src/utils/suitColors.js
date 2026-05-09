export const SUITS = {
  chains: { name: 'Chains', nameUa: 'Ланцюги', color: '#ef4444', description: 'Обмеження' },
  virus: { name: 'Virus', nameUa: 'Вірус', color: '#22c55e', description: 'Мутації проєкту' },
  wheel: { name: 'Wheel', nameUa: 'Колесо', color: '#3b82f6', description: 'Випадкові події' },
  bolt: { name: 'Bolt', nameUa: 'Блискавка', color: '#eab308', description: 'Прискорювачі' },
  eye: { name: 'Eye', nameUa: 'Око', color: '#a855f7', description: 'Таємні місії' },
  mask: { name: 'Mask', nameUa: 'Маска', color: '#f97316', description: 'Обмін між командами' },
  spiral: { name: 'Spiral', nameUa: 'Спіраль', color: '#ec4899', description: 'Plot Twist' },
  alert: { name: 'Alert', nameUa: 'Тривога', color: '#6b7280', description: 'ML-кризи' },
}

export const getSuitStyle = (suit) => {
  const s = SUITS[suit]
  if (!s) return {}
  return {
    borderColor: s.color,
    '--suit-color': s.color,
  }
}
