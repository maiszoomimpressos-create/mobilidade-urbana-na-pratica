import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useColorScheme } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/contexts/AuthContext'
import { useDriverStatus } from '@/contexts/DriverStatusContext'
import { API_URL } from '@/lib/api'
import { fetchDriverActiveRide, type ActiveRidePayload } from '@/lib/activeRide'

interface RideRequest {
  id: string
  passengerName: string
  pickupAddress: string
  dropoffAddress: string
  distance: number
  estimatedFare: number
  createdAt: string
  /** Central da corrida (taxas / tabela desta central). */
  rideCentralName?: string
  rideCentralSlug?: string
}

export default function RidesScreen() {
  const colorScheme = useColorScheme() ?? 'dark'
  const colors = Colors[colorScheme]
  const { session } = useAuth()
  const { isOnline } = useDriverStatus()

  const [rides, setRides] = useState<RideRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeRide, setActiveRide] = useState<ActiveRidePayload | null>(null)

  const fetchRides = useCallback(async () => {
    if (!session?.access_token || !isOnline) {
      setRides([])
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/app/driver/rides/available`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRides(data.rides || [])
      }
    } catch (error) {
      console.error('Erro ao buscar corridas:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session, isOnline])

  useEffect(() => {
    fetchRides()
    
    // Atualizar a cada 10 segundos se online
    const interval = isOnline ? setInterval(fetchRides, 10000) : null
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchRides, isOnline])

  const refreshActive = useCallback(async () => {
    if (!session?.access_token || !isOnline) {
      setActiveRide(null)
      return
    }
    const r = await fetchDriverActiveRide(session.access_token)
    setActiveRide(r)
  }, [session?.access_token, isOnline])

  useEffect(() => {
    refreshActive()
    const iv = isOnline ? setInterval(refreshActive, 8000) : null
    return () => {
      if (iv) clearInterval(iv)
    }
  }, [refreshActive, isOnline])

  const onRefresh = () => {
    setRefreshing(true)
    fetchRides()
  }

  const handleAcceptRide = async (rideId: string) => {
    if (!session?.access_token) return

    try {
      const response = await fetch(`${API_URL}/api/app/driver/rides/${rideId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        setRides((prev) => prev.filter((r) => r.id !== rideId))
        await refreshActive()
        router.push('/ride-map')
      }
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error)
    }
  }

  const renderRideItem = ({ item }: { item: RideRequest }) => (
    <View style={[styles.rideCard, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.rideHeader}>
        <View style={styles.rideHeaderLeft}>
          <Text style={[styles.passengerName, { color: colors.text }]}>
            {item.passengerName}
          </Text>
          {item.rideCentralName ? (
            <Text style={[styles.centralLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              Taxas: {item.rideCentralName}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.fare, { color: colors.tint }]}>
          R$ {item.estimatedFare.toFixed(2)}
        </Text>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={[styles.address, { color: colors.text }]} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
        </View>
        <View style={[styles.addressLine, { borderColor: colors.border }]} />
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>🏁</Text>
          <Text style={[styles.address, { color: colors.text }]} numberOfLines={1}>
            {item.dropoffAddress}
          </Text>
        </View>
      </View>

      <View style={styles.rideFooter}>
        <Text style={[styles.distance, { color: colors.textSecondary }]}>
          {item.distance.toFixed(1)} km
        </Text>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.success }]}
          onPress={() => handleAcceptRide(item.id)}
        >
          <Text style={styles.acceptButtonText}>Aceitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (!isOnline) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={styles.offlineIcon}>🔴</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Você está offline
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Fique online para receber corridas
        </Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          activeRide ? (
            <TouchableOpacity
              style={[styles.activeBanner, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/ride-map')}
              activeOpacity={0.85}
            >
              <Text style={styles.activeBannerTitle}>Corrida em andamento</Text>
              <Text style={styles.activeBannerSub} numberOfLines={2}>
                {activeRide.destinationAddress ?? 'Ver rota no mapa'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma corrida disponível
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aguarde, novas solicitações aparecerão aqui
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  activeBanner: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  activeBannerTitle: {
    color: '#050505',
    fontWeight: '800',
    fontSize: 15,
  },
  activeBannerSub: {
    color: '#1a1a1a',
    fontSize: 13,
    marginTop: 4,
  },
  rideCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  rideHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  centralLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  fare: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressIcon: {
    fontSize: 16,
  },
  address: {
    flex: 1,
    fontSize: 14,
  },
  addressLine: {
    width: 2,
    height: 20,
    marginLeft: 7,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: 14,
  },
  acceptButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  offlineIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
})
