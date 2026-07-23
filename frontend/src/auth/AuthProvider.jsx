import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const dummyUser = (email) => ({
  id: 'user_001',
  name: 'Jordan Smith',
  email: email || 'jordan.smith@querypulse.dev',
  role: 'Admin',
  joined: 'April 12, 2025',
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('auth_user')
    if (!token || !savedUser) return null

    try {
      const { id, username, email } = JSON.parse(savedUser)
      return { ...dummyUser(email), id: String(id), name: username, email }
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth_user')
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(({ id, username, email }) => {
    setUser({
      ...dummyUser(email),
      id: String(id),
      name: username,
      email,
    })
  }, [])
  const register = useCallback(({ name, email }) => {
    setLoading(true)
    window.setTimeout(() => {
      setUser({
        id: 'user_002',
        name: name || 'Jordan Smith',
        email: email || 'jordan.smith@querypulse.dev',
        role: 'Admin',
        joined: 'April 12, 2025',
      })
      setLoading(false)
    }, 400)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  const value = {
    user,
    login,
    logout,
    register,
    loading,
    isAuthenticated: Boolean(user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
