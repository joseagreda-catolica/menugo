import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const savedUser = localStorage.getItem('menugo_usuario')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState(() => {
    return localStorage.getItem('menugo_token') || null
  })

  const login = (userData, userToken) => {
    setUsuario(userData)
    setToken(userToken)
    localStorage.setItem('menugo_usuario', JSON.stringify(userData))
    localStorage.setItem('menugo_token', userToken)
  }

  const logout = () => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem('menugo_usuario')
    localStorage.removeItem('menugo_token')
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)