import { useEffect, useMemo, useRef, useState } from 'react'
import { View, StyleSheet, Text, Platform } from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Location from 'expo-location'
import { getOnlineDrivers, type OnlineDriver } from '@/lib/drivers'

const DEFAULT_REGION = {
  latitude: -15.77972,
  longitude: -47.92972,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

export type MapLatLng = { latitude: number; longitude: number }

type CityMapProps = {
  /** Motoristas mock ao redor (só quando não há rastreamento real). */
  showDemoDrivers?: boolean
  /** Rota principal (origem → destino da corrida). */
  tripCoordinates?: MapLatLng[]
  /** Rota motorista → embarque. */
  approachCoordinates?: MapLatLng[]
  /** Posição real do motorista (API track). */
  driverTrackingPosition?: MapLatLng | null
  /**
   * Durante a corrida: atualiza o marcador do passageiro com o GPS em tempo real
   * (watchPosition). O ajuste automático do zoom ignora o usuário para não “pular” a cada leitura.
   */
  liveUserTracking?: boolean
}

export default function CityMap({
  showDemoDrivers = false,
  tripCoordinates = [],
  approachCoordinates = [],
  driverTrackingPosition = null,
  liveUserTracking = false,
}: CityMapProps) {
  const mapRef = useRef<MapView>(null)
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null)
  const [initialRegion, setInitialRegion] = useState(DEFAULT_REGION)
  const [userCoords, setUserCoords] = useState<MapLatLng | null>(null)

  const drivers = useMemo<OnlineDriver[]>(() => {
    if (!showDemoDrivers) return []
    const center = userCoords ?? { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude }
    return getOnlineDrivers(center.latitude, center.longitude)
  }, [showDemoDrivers, userCoords])

  const allFitCoords = useMemo(() => {
    const list: MapLatLng[] = []
    if (!liveUserTracking && userCoords) list.push(userCoords)
    if (driverTrackingPosition) list.push(driverTrackingPosition)
    for (const c of tripCoordinates) list.push(c)
    for (const c of approachCoordinates) list.push(c)
    return list
  }, [liveUserTracking, userCoords, driverTrackingPosition, tripCoordinates, approachCoordinates])

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
        /* fallback */
      }
    }

    loadLocation()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!liveUserTracking) {
      locationWatchRef.current?.remove()
      locationWatchRef.current = null
      return
    }

    let mounted = true

    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (!mounted || status !== 'granted') return

      locationWatchRef.current?.remove()
      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5,
          timeInterval: 2500,
        },
        (loc) => {
          setUserCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
        }
      )
    })()

    return () => {
      mounted = false
      locationWatchRef.current?.remove()
      locationWatchRef.current = null
    }
  }, [liveUserTracking])

  useEffect(() => {
    if (allFitCoords.length < 2) return
    const id = requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(allFitCoords, {
        edgePadding: { top: 100, right: 48, bottom: 220, left: 48 },
        animated: true,
      })
    })
    return () => cancelAnimationFrame(id)
  }, [allFitCoords])

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <Text style={styles.placeholderText}>Mapa disponível no app (Android/iOS)</Text>
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
        showsUserLocation={userCoords == null}
        showsCompass={true}
      >
        {userCoords && (
          <Marker
            coordinate={userCoords}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.userMarker}>
              <Ionicons name="person" size={20} color="#050505" />
            </View>
          </Marker>
        )}

        {tripCoordinates.length >= 2 && (
          <Polyline
            coordinates={tripCoordinates}
            strokeColor="#2563eb"
            strokeWidth={5}
          />
        )}
        {approachCoordinates.length >= 2 && (
          <Polyline
            coordinates={approachCoordinates}
            strokeColor="#f59e0b"
            strokeWidth={4}
          />
        )}

        {driverTrackingPosition && (
          <Marker coordinate={driverTrackingPosition} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverTrackWrap}>
              <View style={[styles.driverCar, styles.driverOnRoute]}>
                <Ionicons name="car" size={18} color="#fff" />
              </View>
              <Text style={styles.driverStatusLabel}>MOTORISTA</Text>
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
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
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
  driverTrackWrap: { alignItems: 'center' },
  driverWrapper: { alignItems: 'center' },
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
  driverAvailable: { backgroundColor: '#22c55e' },
  driverOnRoute: { backgroundColor: '#facc15' },
  driverInRide: { backgroundColor: '#ef4444' },
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
  placeholderText: { color: '#fff', fontSize: 16, textAlign: 'center' },
})
