import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { API_URL } from '@/lib/api'

interface Driver {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  cnh: string | null
  vehiclePlate: string | null
  vehicleModel: string | null
  vehicleColor: string | null
  rating: number
  totalRides: number
  isOnline: boolean
  isApproved: boolean
  createdAt: string
  /** Central de cadastro / vínculo (corridas podem ser de outras centrais). */
  tenantName?: string
  tenantSlug?: string
  linkedCentral?: { id: string; name: string; slug: string }
}

interface AuthContextType {
  session: Session | null
  user: User | null
  driver: Driver | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    name: string,
    phone: string
  ) => Promise<{ error: Error | null; session: Session | null }>
  signOut: () => Promise<void>
  refreshDriver: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDriver = useCallback(async (userId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/app/driver/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.driver) {
          setDriver(data.driver)
          return
        }
        // Usuário logado mas sem perfil de motorista → criar automaticamente
        const registerRes = await fetch(`${API_URL}/api/app/driver/register`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (registerRes.ok) {
          const registerData = await registerRes.json()
          setDriver(registerData.driver)
        } else {
          setDriver(null)
        }
      } else {
        setDriver(null)
      }
    } catch (error) {
      console.error('Erro ao buscar motorista:', error)
      setDriver(null)
    }
  }, [])

  const refreshDriver = useCallback(async () => {
    if (session?.user?.id && session?.access_token) {
      await fetchDriver(session.user.id, session.access_token)
    }
  }, [session, fetchDriver])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user?.id && session?.access_token) {
        fetchDriver(session.user.id, session.access_token)
      }
      
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user?.id && session?.access_token) {
        fetchDriver(session.user.id, session.access_token)
      } else {
        setDriver(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchDriver])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone,
          user_type: 'driver',
        },
      },
    })
    return { error, session: data.session ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setDriver(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        driver,
        loading,
        signIn,
        signUp,
        signOut,
        refreshDriver,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
