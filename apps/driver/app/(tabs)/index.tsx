import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { useColorScheme } from 'react-native'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/contexts/AuthContext'
import { useDriverStatus } from '@/contexts/DriverStatusContext'
import * as Location from 'expo-location'

const { width } = Dimensions.get('window')

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'dark'
  const colors = Colors[colorScheme]
  const { driver } = useAuth()
  const { isOnline, isUpdating, toggleOnlineStatus } = useDriverStatus()
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationError('Permissão de localização negada')
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      setLocation(currentLocation)
    })()
  }, [])

  const statusColor = isOnline ? colors.online : colors.offline

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Olá, motorista!
          </Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {driver?.name || 'Carregando...'}
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={[styles.ratingText, { color: colors.text }]}>
            {driver?.rating?.toFixed(1) || '5.0'}
          </Text>
        </View>
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {isOnline ? 'Você está online' : 'Você está offline'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: isOnline ? colors.error : colors.success },
          ]}
          onPress={toggleOnlineStatus}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.statusButtonText}>
              {isOnline ? 'Ficar Offline' : 'Ficar Online'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statValue, { color: colors.tint }]}>
            {driver?.totalRides || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Corridas hoje
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statValue, { color: colors.tint }]}>
            R$ 0,00
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Ganhos hoje
          </Text>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={[styles.mapContainer, { backgroundColor: colors.backgroundSecondary }]}>
        {location ? (
          <View style={styles.mapPlaceholder}>
            <Text style={[styles.mapText, { color: colors.textSecondary }]}>
              📍 Localização ativa
            </Text>
            <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
              {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
            </Text>
          </View>
        ) : locationError ? (
          <Text style={[styles.mapText, { color: colors.error }]}>
            {locationError}
          </Text>
        ) : (
          <ActivityIndicator color={colors.tint} />
        )}
      </View>

      {/* Pending Approval Warning */}
      {driver && !driver.isApproved && (
        <View style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}>
          <Text style={[styles.warningText, { color: colors.warning }]}>
            ⚠️ Seu cadastro está em análise. Você poderá receber corridas após a aprovação.
          </Text>
        </View>
      )}

      {/* Quick Info */}
      {isOnline && (
        <View style={[styles.infoCard, { backgroundColor: colors.tint + '20' }]}>
          <Text style={[styles.infoText, { color: colors.tint }]}>
            🔔 Aguardando novas corridas...
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingStar: {
    fontSize: 20,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
  },
  coordsText: {
    fontSize: 12,
    marginTop: 4,
  },
  warningCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
})
