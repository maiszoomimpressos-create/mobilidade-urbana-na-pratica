import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useBranding } from '@/contexts/BrandingContext'

export default function VincularContaScreen() {
  const { branding } = useBranding()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVincular = async () => {
    setError('')
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (!isSupabaseConfigured) {
      setError('Supabase não configurado.')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({
        email: email.trim(),
        password,
      })
      if (err) {
        setError(err.message === 'User already registered' ? 'Este e-mail já está em uso.' : err.message)
        return
      }
      router.replace('/(tabs)')
    } catch {
      setError('Erro ao vincular. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Vincular conta</Text>
        <Text style={styles.subtitle}>
          Adicione e-mail e senha para transformar sua conta anônima em permanente.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha (mín. 6 caracteres)"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: branding.primaryColor },
            pressed && styles.buttonPressed,
          ]}
          onPress={handleVincular}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Vinculando…' : 'Vincular conta'}</Text>
        </Pressable>

        <Pressable style={styles.linkWrap} onPress={() => router.back()}>
          <Text style={[styles.link, { color: branding.primaryColor }]}>Voltar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#050505',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  error: {
    color: '#c00',
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    fontSize: 15,
  },
})
