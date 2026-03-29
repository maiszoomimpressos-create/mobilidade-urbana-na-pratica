import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { fetchAppRideTypes, type AppRideType } from '@/lib/rideTypes'

type RideTypeCarouselProps = {
  tenantSlug: string
  cityId?: string | null
  primaryColor: string
  selectedId: string | null
  onSelect: (rideType: AppRideType | null) => void
}

const CARD_W = 100
const IMG_SIZE = 72

export function RideTypeCarousel({
  tenantSlug,
  cityId,
  primaryColor,
  selectedId,
  onSelect,
}: RideTypeCarouselProps) {
  const { width: windowWidth } = useWindowDimensions()
  const [items, setItems] = useState<AppRideType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!tenantSlug.trim()) {
        setItems([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const list = await fetchAppRideTypes(tenantSlug.trim(), cityId ?? undefined)
        if (!cancelled) setItems(list)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tenantSlug, cityId])

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={primaryColor} />
        <Text style={styles.loadingText}>Carregando modalidades…</Text>
      </View>
    )
  }

  if (items.length === 0) {
    return null
  }

  const maxScrollW = Math.min(windowWidth - 40, items.length * (CARD_W + 10))

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Tipo de corrida</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={items.length > 3}
        contentContainerStyle={styles.scrollContent}
        style={{ maxWidth: maxScrollW + 40 }}
      >
        {items.map((rt) => {
          const selected = selectedId === rt.id
          return (
            <Pressable
              key={rt.id}
              onPress={() => onSelect(selected ? null : rt)}
              style={[
                styles.card,
                { borderColor: selected ? primaryColor : '#e0e0e0' },
                selected && { backgroundColor: `${primaryColor}18` },
              ]}
            >
              <View style={[styles.imageRing, { borderColor: selected ? primaryColor : '#ddd' }]}>
                {rt.imageUrl ? (
                  <Image source={{ uri: rt.imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.placeholderIcon, { backgroundColor: `${primaryColor}22` }]}>
                    <Ionicons name="car-outline" size={32} color={primaryColor} />
                  </View>
                )}
              </View>
              <Text style={styles.cardName} numberOfLines={2}>
                {rt.name}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#666',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 8,
  },
  card: {
    width: CARD_W,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  imageRing: {
    width: IMG_SIZE + 6,
    height: IMG_SIZE + 6,
    borderRadius: (IMG_SIZE + 6) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  image: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: IMG_SIZE / 2,
  },
  placeholderIcon: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: IMG_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    lineHeight: 14,
  },
})
