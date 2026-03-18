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

interface Ride {
  id: string
  passengerName: string
  pickupAddress: string
  dropoffAddress: string
  distance: number
  fare: number
  status: 'completed' | 'cancelled'
  completedAt: string
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'dark'
  const colors = Colors[colorScheme]
  const { session } = useAuth()

  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHistory = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || ''
      const response = await fetch(`${API_URL}/api/app/driver/rides/history`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRides(data.rides || [])
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const onRefresh = () => {
    setRefreshing(true)
    fetchHistory()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderRideItem = ({ item }: { item: Ride }) => (
    <TouchableOpacity
      style={[styles.rideCard, { backgroundColor: colors.backgroundSecondary }]}
    >
      <View style={styles.rideHeader}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === 'completed' ? colors.success : colors.error,
              },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {item.status === 'completed' ? 'Concluída' : 'Cancelada'}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatDate(item.completedAt)}
        </Text>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={[styles.address, { color: colors.text }]} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
        </View>
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
        <Text
          style={[
            styles.fare,
            {
              color:
                item.status === 'completed' ? colors.success : colors.textSecondary,
            },
          ]}
        >
          {item.status === 'completed' ? `R$ ${item.fare.toFixed(2)}` : '-'}
        </Text>
      </View>
    </TouchableOpacity>
  )

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
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma corrida realizada
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Seu histórico de corridas aparecerá aqui
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
  },
  rideCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
  },
  addressContainer: {
    gap: 8,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressIcon: {
    fontSize: 14,
  },
  address: {
    flex: 1,
    fontSize: 14,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  distance: {
    fontSize: 14,
  },
  fare: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
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
