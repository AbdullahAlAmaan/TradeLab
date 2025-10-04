import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthContext: Initializing authentication...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext: Error getting session:', error)
      } else {
        console.log('AuthContext: Initial session:', session ? 'Found' : 'None')
        setUser(session?.user ?? null)
        
        // Store token if session exists
        if (session?.access_token) {
          localStorage.setItem('supabase.auth.token', session.access_token)
          console.log('AuthContext: Token stored in localStorage')
        }
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? 'Session found' : 'No session')
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Handle token refresh
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        localStorage.setItem('supabase.auth.token', session.access_token)
        console.log('AuthContext: Token refreshed and stored')
      } else if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('supabase.auth.token')
        console.log('AuthContext: User signed out, token removed')
      } else if (session?.access_token) {
        localStorage.setItem('supabase.auth.token', session.access_token)
        console.log('AuthContext: Token updated in localStorage')
      }
    })

    // Set up automatic token refresh
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('AuthContext: Error refreshing session:', error)
        } else if (session?.access_token) {
          localStorage.setItem('supabase.auth.token', session.access_token)
          console.log('AuthContext: Token refreshed automatically')
        }
      } catch (error) {
        console.error('AuthContext: Error in refresh interval:', error)
      }
    }, 5 * 60 * 1000) // Refresh every 5 minutes

    return () => {
      console.log('AuthContext: Cleaning up subscription and interval')
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    console.log('AuthContext: Attempting sign in for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (data.session) {
      console.log('AuthContext: Sign in successful, storing token')
      localStorage.setItem('supabase.auth.token', data.session.access_token)
    } else if (error) {
      console.error('AuthContext: Sign in failed:', error)
    }
    
    return { data, error }
  }

  const signOut = async () => {
    console.log('AuthContext: Signing out user')
    const { error } = await supabase.auth.signOut()
    localStorage.removeItem('supabase.auth.token')
    setUser(null)
    console.log('AuthContext: User signed out, token removed')
    return { error }
  }

  const checkTokenExpiration = () => {
    const token = localStorage.getItem('supabase.auth.token')
    if (!token) return false
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      const isExpired = payload.exp < now
      
      if (isExpired) {
        console.log('AuthContext: Token expired, signing out user')
        signOut()
        return false
      }
      return true
    } catch (error) {
      console.error('AuthContext: Error checking token expiration:', error)
      signOut()
      return false
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    checkTokenExpiration,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
