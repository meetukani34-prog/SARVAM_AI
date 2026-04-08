import { useState, useEffect } from 'react'
import { authAPI } from '../services/api.js'

export function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ai_twin_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      const { access_token, user: u } = res.data
      localStorage.setItem('ai_twin_token', access_token)
      localStorage.setItem('ai_twin_user', JSON.stringify(u))
      setUser(u)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email, name, password) => {
    setLoading(true)
    // Final Proper Fix V5.0.0: Unified safety margin (100 chars)
    const safePassword = password.substring(0, 100)
    try {
      const res = await authAPI.signup(email, name, safePassword)
      const { access_token, user: u } = res.data
      localStorage.setItem('ai_twin_token', access_token)
      localStorage.setItem('ai_twin_user', JSON.stringify(u))
      setUser(u)
      return { success: true }
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message)
      const detail = err.response?.data?.detail
      let errorMsg = 'Signup failed'
      if (typeof detail === 'string') errorMsg = detail
      else if (Array.isArray(detail)) errorMsg = detail[0]?.msg || 'Validation error'
      else if (err.response?.status === 500) {
        errorMsg = detail || 'Server Error (500). Please check if DB is writable or Secret Key is set.'
      }
      
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async (token) => {
    setLoading(true)
    try {
      const res = await authAPI.googleLogin(token)
      const { access_token, user: u, is_new_user } = res.data
      localStorage.setItem('ai_twin_token', access_token)
      localStorage.setItem('ai_twin_user', JSON.stringify(u))
      setUser(u)
      return { success: true, is_new_user }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Google Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const setPassword = async (password) => {
    setLoading(true)
    try {
      await authAPI.setPassword(password)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to set password' }
    } finally {
      setLoading(false)
    }
  }


  const logout = () => {
    localStorage.removeItem('ai_twin_token')
    localStorage.removeItem('ai_twin_user')
    setUser(null)
    window.location.href = '/'
  }

  return { user, loading, login, signup, googleLogin, setPassword, logout }
}
