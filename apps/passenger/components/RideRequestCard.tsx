import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useBranding } from '@/contexts/BrandingContext'
import { supabase } from '@/lib/supabase'

const MAX_STOPS = 6

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export type RideRequestCardProps = {
  onRequestWithDestinations?: (destinations: string[]) => void
  /** 'modal' = card flutuante com altura fixa; 'screen' = preenche a tela (ex.: aba Corridas) */
  variant?: 'modal' | 'screen'
}

export default function RideRequestCard({
  onRequestWithDestinations,
  variant = 'modal',
}: RideRequestCardProps) {
  const { branding } = useBranding()
  const { height: windowHeight } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [userName, setUserName] = useState<string>('')
  const [destinations, setDestinations] = useState<string[]>([''])
  const cardHeight = Math.min(250, Math.floor(windowHeight * 0.34))
  const isScreen = variant === 'screen'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name =
        data.user?.user_metadata?.full_name ??
        data.user?.user_metadata?.name ??
        data.user?.email?.split('@')[0] ??
        'Passageiro'
      setUserName(name)
    })
  }, [])

  const greeting = getGreeting()
  const canAddStop = destinations.length < MAX_STOPS

  const updateDestination = (index: number, value: string) => {
    setDestinations((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const addStop = () => {
    if (!canAddStop) return
    setDestinations((prev) => [...prev, ''])
    const delay = Platform.OS === 'android' ? 350 : 150
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), delay)
  }

  const removeStop = (index: number) => {
    if (destinations.length <= 1) return
    setDestinations((prev) => prev.filter((_, i) => i !== index))
  }

  const filledDestinations = destinations.filter((d) => d.trim().length > 0)
  const handleRequestWithDestinations = () => {
    if (filledDestinations.length > 0 && onRequestWithDestinations) {
      onRequestWithDestinations(filledDestinations)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.wrapper, isScreen ? styles.wrapperScreen : { height: cardHeight }]}
    >
      <View style={[styles.card, { borderColor: branding.primaryColor }, isScreen && styles.cardScreen]}>
        <View style={styles.cardHeader}>
          <Text style={styles.greeting}>
            {greeting}, {userName}
          </Text>
          <Text style={styles.label}>Buscar destino</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={[styles.destinationsScroll, isScreen && styles.destinationsScrollScreen]}
          contentContainerStyle={styles.destinationsScrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={true}
          persistentScrollbar={Platform.OS === 'android'}
        >
          {destinations.map((value, index) => (
            <View key={index} style={styles.destinationRow}>
              <View style={styles.inputWrap}>
                <Ionicons name="location-outline" size={18} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={index === 0 ? 'Para onde?' : `Parada ${index}`}
                  placeholderTextColor="#888"
                  value={value}
                  onChangeText={(v) => updateDestination(index, v)}
                />
              </View>
              {destinations.length > 1 && (
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeStop(index)}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={22} color="#999" />
                </Pressable>
              )}
            </View>
          ))}

          {canAddStop && (
            <Pressable style={styles.addStopBtn} onPress={addStop}>
              <Ionicons name="add-circle-outline" size={20} color={branding.primaryColor} />
              <Text style={[styles.addStopText, { color: branding.primaryColor }]}>
                Adicionar parada
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {filledDestinations.length > 0 && (
          <View style={styles.cardFooter}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: branding.primaryColor }]}
              onPress={handleRequestWithDestinations}
            >
              <Text style={styles.primaryBtnText}>Pedir corrida com destino</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
  },
  wrapperScreen: {
    position: 'relative',
    flex: 1,
    bottom: undefined,
  },
  card: {
    flex: 1,
    maxHeight: '100%',
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 3,
    paddingHorizontal: 12,
  },
  cardScreen: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  cardHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  destinationsScroll: {
    flex: 1,
    maxHeight: 160,
  },
  destinationsScrollScreen: {
    maxHeight: undefined,
  },
  destinationsScrollContent: {
    paddingRight: 4,
    paddingBottom: 8,
  },
  cardFooter: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  greeting: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  removeBtn: {
    padding: 8,
    marginLeft: 4,
  },
  addStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  addStopText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#050505',
    fontSize: 16,
    fontWeight: '700',
  },
})
