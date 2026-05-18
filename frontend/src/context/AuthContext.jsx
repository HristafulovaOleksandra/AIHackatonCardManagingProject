import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [teamAuth, setTeamAuth] = useState(() => {
    const saved = sessionStorage.getItem('teamAuth')
    return saved ? JSON.parse(saved) : null
  })
  const [adminAuth, setAdminAuth] = useState(() => {
    return sessionStorage.getItem('adminAuth') === 'true'
  })

  const loginTeam = (sessionCode, teamId, teamName) => {
    const auth = { sessionCode, teamId, teamName }
    sessionStorage.setItem('teamAuth', JSON.stringify(auth))
    setTeamAuth(auth)
  }

  const loginAdmin = () => {
    sessionStorage.setItem('adminAuth', 'true')
    setAdminAuth(true)
  }

  const logout = () => {
    sessionStorage.removeItem('teamAuth')
    sessionStorage.removeItem('adminAuth')
    setTeamAuth(null)
    setAdminAuth(false)
  }

  return (
    <AuthContext.Provider value={{ teamAuth, adminAuth, loginTeam, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
