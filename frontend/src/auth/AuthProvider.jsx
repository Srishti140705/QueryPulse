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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(({ email }) => {
    setLoading(true)
    window.setTimeout(() => {
      setUser(dummyUser(email))
      setLoading(false)
    }, 400)
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
    setLoading(true)
    window.setTimeout(() => {
      setUser(null)
      setLoading(false)
    }, 200)
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
