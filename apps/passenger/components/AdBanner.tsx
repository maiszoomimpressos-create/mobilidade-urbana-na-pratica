import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
} from 'react-native'
import { useBranding } from '@/contexts/BrandingContext'

interface Ad {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
}

interface AdBannerProps {
  position?: 'PASSENGER_HOME' | 'PASSENGER_RIDE'
}

const SCREEN_WIDTH = Dimensions.get('window').width

export function AdBanner({ position = 'PASSENGER_HOME' }: AdBannerProps) {
  const { branding } = useBranding()
  const [ads, setAds] = useState<Ad[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const loadAds = useCallback(async () => {
    const apiUrl = process.env.EXPO_PUBLIC_APP_API_URL?.trim()
    if (!apiUrl) return

    try {
      const url = `${apiUrl.replace(/\/$/, '')}/api/app/advertisements?tenant=${encodeURIComponent(branding.slug)}&position=${position}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.ads && data.ads.length > 0) {
        setAds(data.ads)
        trackImpression(data.ads[0].id)
      }
    } catch (err) {
      console.error('Error loading ads:', err)
    }
  }, [branding.slug, position])

  useEffect(() => {
    loadAds()
  }, [loadAds])

  useEffect(() => {
    if (ads.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % ads.length
        trackImpression(ads[next].id)
        return next
      })
    }, 8000)

    return () => clearInterval(interval)
  }, [ads])

  async function trackImpression(adId: string) {
    const apiUrl = process.env.EXPO_PUBLIC_APP_API_URL?.trim()
    if (!apiUrl) return

    try {
      await fetch(`${apiUrl.replace(/\/$/, '')}/api/app/advertisements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, action: 'impression' }),
      })
    } catch {}
  }

  async function trackClick(adId: string) {
    const apiUrl = process.env.EXPO_PUBLIC_APP_API_URL?.trim()
    if (!apiUrl) return

    try {
      await fetch(`${apiUrl.replace(/\/$/, '')}/api/app/advertisements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, action: 'click' }),
      })
    } catch {}
  }

  async function handlePress(ad: Ad) {
    await trackClick(ad.id)

    if (ad.linkUrl) {
      try {
        await Linking.openURL(ad.linkUrl)
      } catch {}
    }
  }

  if (ads.length === 0) {
    return null
  }

  const currentAd = ads[currentIndex]

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handlePress(currentAd)}
        style={styles.touchable}
      >
        <Image
          source={{ uri: currentAd.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {ads.length > 1 && (
        <View style={styles.dotsContainer}>
          {ads.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 20,
    marginHorizontal: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  touchable: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 135,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#ebb000',
    width: 18,
  },
})
