import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  fetchAddressSuggestions,
  type AddressSuggestion,
} from '@/lib/addressAutocomplete'

type Props = {
  value: string
  onChangeText: (text: string) => void
  /** Quando o usuário escolhe uma sugestão (inclui lat/lng se disponível). */
  onPickSuggestion?: (suggestion: AddressSuggestion) => void
  placeholder: string
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  authToken: string | null
  tenantSlug: string
  userLatitude: number | null
  userLongitude: number | null
}

const DEBOUNCE_MS = 380

export function DestinoComSugestoes({
  value,
  onChangeText,
  onPickSuggestion,
  placeholder,
  isActive,
  onActivate,
  onDeactivate,
  authToken,
  tenantSlug,
  userLatitude,
  userLongitude,
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const blurClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearBlurTimer = useCallback(() => {
    if (blurClearRef.current) {
      clearTimeout(blurClearRef.current)
      blurClearRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isActive || !authToken) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const q = value.trim()
    if (q.length < 3) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    const t = setTimeout(() => {
      fetchAddressSuggestions(authToken, q, {
        tenantSlug,
        latitude: userLatitude,
        longitude: userLongitude,
      })
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)

    return () => clearTimeout(t)
  }, [
    value,
    isActive,
    authToken,
    tenantSlug,
    userLatitude,
    userLongitude,
  ])

  const pick = useCallback(
    (s: AddressSuggestion) => {
      clearBlurTimer()
      onChangeText(s.label)
      onPickSuggestion?.(s)
      setSuggestions([])
      onDeactivate()
    },
    [onChangeText, onDeactivate, clearBlurTimer, onPickSuggestion]
  )

  return (
    <View style={styles.wrap}>
      <View style={styles.searchDestinoBar}>
        <Ionicons name="search" size={18} color="#666" />
        <TextInput
          style={styles.searchDestinoInput}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            clearBlurTimer()
            onActivate()
          }}
          onBlur={() => {
            clearBlurTimer()
            blurClearRef.current = setTimeout(() => onDeactivate(), 350)
          }}
        />
        {loading ? <ActivityIndicator size="small" color="#666" /> : null}
      </View>
      {isActive && suggestions.length > 0 ? (
        <View style={styles.suggestionsBox}>
          {suggestions.map((s, i) => (
            <Pressable
              key={`${s.label}-${i}`}
              style={({ pressed }) => [
                styles.suggestionRow,
                pressed && styles.suggestionRowPressed,
              ]}
              onPress={() => pick(s)}
            >
              <Ionicons name="location-outline" size={16} color="#444" />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
  },
  searchDestinoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  searchDestinoInput: {
    flex: 1,
    color: '#1a1a1a',
    fontSize: 15,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 20,
  },
  suggestionsBox: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  suggestionRowPressed: {
    backgroundColor: '#f3f3f3',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
})
