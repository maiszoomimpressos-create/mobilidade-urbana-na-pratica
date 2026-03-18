import React, { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

interface DriverStatusContextType {
  isOnline: boolean
  isUpdating: boolean
  toggleOnlineStatus: () => Promise<void>
  setOnline: () => Promise<void>
  setOffline: () => Promise<void>
}

const DriverStatusContext = createContext<DriverStatusContextType | undefined>(undefined)

export function DriverStatusProvider({ children }: { children: React.ReactNode }) {
  const { session, driver, refreshDriver } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  const updateStatus = useCallback(async (online: boolean) => {
    if (!session?.access_token || !driver) return

    setIsUpdating(true)
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || ''
      const response = await fetch(`${API_URL}/api/app/driver/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ isOnline: online }),
      })

      if (response.ok) {
        await refreshDriver()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [session, driver, refreshDriver])

  const toggleOnlineStatus = useCallback(async () => {
    await updateStatus(!driver?.isOnline)
  }, [driver, updateStatus])

  const setOnline = useCallback(async () => {
    await updateStatus(true)
  }, [updateStatus])

  const setOffline = useCallback(async () => {
    await updateStatus(false)
  }, [updateStatus])

  return (
    <DriverStatusContext.Provider
      value={{
        isOnline: driver?.isOnline ?? false,
        isUpdating,
        toggleOnlineStatus,
        setOnline,
        setOffline,
      }}
    >
      {children}
    </DriverStatusContext.Provider>
  )
}

export function useDriverStatus() {
  const context = useContext(DriverStatusContext)
  if (context === undefined) {
    throw new Error('useDriverStatus must be used within a DriverStatusProvider')
  }
  return context
}
