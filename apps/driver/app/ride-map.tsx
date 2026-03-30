import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchDriverActiveRide,
  parseTripCoords,
  type ActiveRidePayload,
} from '@/lib/activeRide'

export default function RideMapScreen() {
  const { session } = useAuth()
  const mapRef = useRef<MapView>(null)
  const [ride, setRide] = useState<ActiveRidePayload | null | undefined>(undefined)
  const [myPos, setMyPos] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    if (!session?.access_token) return
    let cancelled = false
    const tick = async () => {
      const r = await fetchDriverActiveRide(session.access_token!)
      if (!cancelled) setRide(r)
    }
    tick()
    const iv = setInterval(tick, 5000)
    return () => {
      cancelled = true
      clearInterval(iv)
    }
  }, [session?.access_token])

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
        (loc) => {
          setMyPos({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
        }
      )
    })()
    return () => {
      sub?.remove()
    }
  }, [])

  const trip = useMemo(() => (ride ? parseTripCoords(ride.tripRouteCoords) : []), [ride])

  const fitCoords = useMemo(() => {
    const list: { latitude: number; longitude: number }[] = []
    if (myPos) list.push(myPos)
    for (const c of trip) list.push(c)
    if (ride?.origin) list.push(ride.origin)
    if (ride?.destination) list.push(ride.destination)
    return list
  }, [myPos, trip, ride?.origin, ride?.destination])

  useEffect(() => {
    if (fitCoords.length < 2) return
    const id = requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(fitCoords, {
        edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
        animated: true,
      })
    })
    return () => cancelAnimationFrame(id)
  }, [fitCoords])

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Mapa disponível no app móvel.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </View>
    )
  }

  if (ride === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ebb000" />
      </View>
    )
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Nenhuma corrida ativa</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_DEFAULT : undefined}
        initialRegion={{
          latitude: ride.origin?.latitude ?? -15.78,
          longitude: ride.origin?.longitude ?? -47.93,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        showsUserLocation
        showsCompass
      >
        {trip.length >= 2 && (
          <Polyline coordinates={trip} strokeColor="#2563eb" strokeWidth={5} />
        )}
        {ride.origin && (
          <Marker coordinate={ride.origin} title="Embarque" description={ride.originAddress ?? ''}>
            <View style={styles.pinEmbarque}>
              <Ionicons name="person" size={16} color="#050505" />
            </View>
          </Marker>
        )}
        {ride.destination && (
          <Marker coordinate={ride.destination} title="Destino" description={ride.destinationAddress ?? ''}>
            <View style={styles.pinDestino}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </Marker>
        )}
        {myPos && (
          <Marker coordinate={myPos} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.carMe}>
              <Ionicons name="car" size={18} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.overlay}>
        <Pressable style={styles.closeFab} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
        <View style={styles.card}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {ride.destinationAddress ?? 'Corrida'}
          </Text>
          {ride.estimatedPrice != null && (
            <Text style={styles.cardPrice}>Estimado: R$ {ride.estimatedPrice.toFixed(2)}</Text>
          )}
          <Text style={styles.cardMeta}>
            {ride.distanceKm != null ? `${ride.distanceKm.toFixed(1)} km · ` : ''}
            {ride.durationMin != null ? `${ride.durationMin} min` : ''}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
    padding: 24,
    gap: 16,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  muted: { color: '#aaa', textAlign: 'center' },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ebb000',
    borderRadius: 10,
  },
  backBtnText: { color: '#050505', fontWeight: '700' },
  overlay: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    gap: 10,
  },
  closeFab: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  cardPrice: { marginTop: 6, fontSize: 18, fontWeight: '800', color: '#16a34a' },
  cardMeta: { marginTop: 4, fontSize: 13, color: '#444' },
  pinEmbarque: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ebb000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#050505',
  },
  pinDestino: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carMe: {
    width: 40,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
})
