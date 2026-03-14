import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import * as Linking from 'expo-linking'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { setTenantSlug } from '@/lib/branding'

export default function GateScreen() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const url = await Linking.getInitialURL()
        const match = url?.match(/maidrive:\/\/tenant\/([^/?]+)/)
        if (match?.[1]) {
          await setTenantSlug(match[1])
        }

        if (!isSupabaseConfigured) {
          router.replace('/(auth)/login')
          return
        }
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.replace('/(tabs)')
        } else {
          router.replace('/(auth)/login')
        }
      } catch {
        router.replace('/(auth)/login')
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ebb000" />
      </View>
    )
  }
  return null
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
