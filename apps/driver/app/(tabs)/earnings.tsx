import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useColorScheme } from 'react-native'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/contexts/AuthContext'
import { API_URL } from '@/lib/api'

interface EarningsSummary {
  today: number
  week: number
  month: number
  todayRides: number
  weekRides: number
  monthRides: number
}

export default function EarningsScreen() {
  const colorScheme = useColorScheme() ?? 'dark'
  const colors = Colors[colorScheme]
  const { session } = useAuth()

  const [earnings, setEarnings] = useState<EarningsSummary>({
    today: 0,
    week: 0,
    month: 0,
    todayRides: 0,
    weekRides: 0,
    monthRides: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEarnings = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/app/driver/earnings`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEarnings(data)
      }
    } catch (error) {
      console.error('Erro ao buscar ganhos:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  useEffect(() => {
    fetchEarnings()
  }, [fetchEarnings])

  const onRefresh = () => {
    setRefreshing(true)
    fetchEarnings()
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
    >
      {/* Today Card */}
      <View style={[styles.mainCard, { backgroundColor: colors.tint }]}>
        <Text style={styles.mainCardLabel}>Ganhos de hoje</Text>
        <Text style={styles.mainCardValue}>
          R$ {earnings.today.toFixed(2)}
        </Text>
        <Text style={styles.mainCardRides}>
          {earnings.todayRides} corrida{earnings.todayRides !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Period Cards */}
      <View style={styles.periodContainer}>
        <View style={[styles.periodCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
            Esta semana
          </Text>
          <Text style={[styles.periodValue, { color: colors.text }]}>
            R$ {earnings.week.toFixed(2)}
          </Text>
          <Text style={[styles.periodRides, { color: colors.textSecondary }]}>
            {earnings.weekRides} corridas
          </Text>
        </View>

        <View style={[styles.periodCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
            Este mês
          </Text>
          <Text style={[styles.periodValue, { color: colors.text }]}>
            R$ {earnings.month.toFixed(2)}
          </Text>
          <Text style={[styles.periodRides, { color: colors.textSecondary }]}>
            {earnings.monthRides} corridas
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          Resumo do mês
        </Text>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Média por corrida
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            R$ {earnings.monthRides > 0 ? (earnings.month / earnings.monthRides).toFixed(2) : '0.00'}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total de corridas
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {earnings.monthRides}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Dias trabalhados
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            -
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Os ganhos são atualizados em tempo real após cada corrida concluída.
        </Text>
      </View>
    </ScrollView>
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
  mainCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  mainCardLabel: {
    fontSize: 16,
    color: '#000',
    opacity: 0.7,
  },
  mainCardValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 8,
  },
  mainCardRides: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  periodCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 12,
  },
  periodValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  periodRides: {
    fontSize: 12,
  },
  statsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
})
