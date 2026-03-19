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
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/contexts/AuthContext'
import { useDriverStatus } from '@/contexts/DriverStatusContext'
import { API_URL } from '@/lib/api'

interface RideRequest {
  id: string
  passengerName: string
  pickupAddress: string
  dropoffAddress: string
  distance: number
  estimatedFare: number
  createdAt: string
}

export default function RidesScreen() {
  const colorScheme = useColorScheme() ?? 'dark'
  const colors = Colors[colorScheme]
  const { session } = useAuth()
  const { isOnline } = useDriverStatus()

  const [rides, setRides] = useState<RideRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
        // Remover da lista e navegar para detalhes da corrida
        setRides((prev) => prev.filter((r) => r.id !== rideId))
      }
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error)
    }
  }

  const renderRideItem = ({ item }: { item: RideRequest }) => (
    <View style={[styles.rideCard, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.rideHeader}>
        <Text style={[styles.passengerName, { color: colors.text }]}>
          {item.passengerName}
        </Text>
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
  rideCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '600',
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
