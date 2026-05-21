const P1_BASE = 'http://localhost:8081'

export const getSessions = async () => {
  const res = await fetch(`${P1_BASE}/api/sessions`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const getTeams = async (sessionCode) => {
  const res = await fetch(`/api/sessions/${sessionCode}/teams`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
