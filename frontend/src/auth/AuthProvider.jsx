import React, { createContext, useCallback, useEffect, useState } from 'react'
import { getCurrentUser } from '../services/authService'

const AuthContext = createContext(null)
const toAuthUser = (user) => ({ ...user, id: String(user.id), name: user.username })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { setLoading(false); return }
    getCurrentUser().then(({ data }) => {
      localStorage.setItem('auth_user', JSON.stringify(data))
      setUser(toAuthUser(data))
    }).catch(() => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth_user')
    }).finally(() => setLoading(false))
  }, [])

  const login = useCallback((account) => setUser(toAuthUser(account)), [])
  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: Boolean(user) }}>{children}</AuthContext.Provider>
}
export const useAuth = () => React.useContext(AuthContext)
