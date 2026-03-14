import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, StyleSheet, Text, Platform } from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Location from 'expo-location'
import { getOnlineDrivers, type OnlineDriver } from '@/lib/drivers'

// Centro do Brasil (fallback se localização falhar)
const DEFAULT_REGION = {
  latitude: -15.77972,
  longitude: -47.92972,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

export default function CityMap() {
  const mapRef = useRef<MapView>(null)
  const [initialRegion, setInitialRegion] = useState(DEFAULT_REGION)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  // Motoristas online (demo). Depois: buscar da API em tempo real.
  const drivers = useMemo<OnlineDriver[]>(() => {
    const center = userCoords ?? { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude }
    return getOnlineDrivers(center.latitude, center.longitude)
  }, [userCoords])

  useEffect(() => {
    let cancelled = false

    async function loadLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (cancelled) return
        if (status !== 'granted') return

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        if (cancelled) return

        const { latitude, longitude } = loc.coords
        setUserCoords({ latitude, longitude })
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
        setInitialRegion(newRegion)
        mapRef.current?.animateToRegion(newRegion, 500)
      } catch {
        // Fallback: mapa permanece no centro do Brasil
      }
    }

    loadLocation()
    return () => { cancelled = true }
  }, [])

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <Text style={styles.placeholderText}>
          Mapa disponível no app (Android/iOS)
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_DEFAULT : undefined}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsCompass={true}
      >
        {userCoords && (
          <Marker coordinate={userCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userMarker}>
              <Ionicons name="person" size={20} color="#050505" />
            </View>
          </Marker>
        )}
        {drivers
          .filter((d) => d.status !== 'offline')
          .map((d) => {
            let statusStyle = styles.driverAvailable
            let statusLabel = 'LIVRE'

            if (d.status === 'on_route') {
              statusStyle = styles.driverOnRoute
              statusLabel = 'A CAMINHO'
            } else if (d.status === 'in_ride') {
              statusStyle = styles.driverInRide
              statusLabel = 'OCUPADO'
            }

            return (
              <Marker
                key={d.id}
                coordinate={{ latitude: d.latitude, longitude: d.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.driverWrapper}>
                  <View style={[styles.driverCar, statusStyle]}>
                    <Ionicons name="car" size={18} color="#fff" />
                  </View>
                  <Text style={styles.driverStatusLabel}>{statusLabel}</Text>
                </View>
              </Marker>
            )
          })}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ebb000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#050505',
  },
  driverWrapper: {
    alignItems: 'center',
  },
  driverCar: {
    width: 40,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  driverAvailable: {
    backgroundColor: '#22c55e', // verde
  },
  driverOnRoute: {
    backgroundColor: '#facc15', // amarelo
  },
  driverInRide: {
    backgroundColor: '#ef4444', // vermelho
  },
  driverStatusLabel: {
    marginTop: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
})
