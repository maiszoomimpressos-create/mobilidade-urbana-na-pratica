import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import * as Location from 'expo-location'
import { useAuth } from './AuthContext'
import { API_URL } from '@/lib/api'
import { postDriverLocation } from '@/lib/activeRide'

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
  const isOnline = driver?.isOnline ?? false
  const watchRef = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    if (!session?.access_token || !isOnline) {
      watchRef.current?.remove()
      watchRef.current = null
      return
    }

    let cancelled = false

    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (cancelled || status !== 'granted') return

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 12,
          timeInterval: 8000,
        },
        async (loc) => {
          try {
            await postDriverLocation(session.access_token!, {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracy: loc.coords.accuracy ?? undefined,
              heading: loc.coords.heading ?? undefined,
              speed: loc.coords.speed ?? undefined,
            })
          } catch {
            /* rede */
          }
        }
      )
      if (cancelled) {
        sub.remove()
        return
      }
      watchRef.current = sub
    })()

    return () => {
      cancelled = true
      watchRef.current?.remove()
      watchRef.current = null
    }
  }, [session?.access_token, isOnline])

  const updateStatus = useCallback(async (online: boolean) => {
    if (!session?.access_token || !driver) return

    setIsUpdating(true)
    try {
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
        isOnline,
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
