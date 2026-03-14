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

export default function EsqueciSenhaScreen() {
  const { branding } = useBranding()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const apiUrl = (process.env.EXPO_PUBLIC_APP_API_URL ?? '').trim()
  const redirectTo = apiUrl ? `${apiUrl.replace(/\/$/, '')}/redefinir-senha` : undefined

  const handleSubmit = async () => {
    setError('')
    if (!email.trim()) {
      setError('Informe seu e-mail.')
      return
    }
    if (!isSupabaseConfigured) {
      setError('Supabase não configurado.')
      return
    }
    if (!redirectTo) {
      setError('Configure EXPO_PUBLIC_APP_API_URL no .env do app.')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })
      if (err) {
        setError(err.message)
        return
      }
      setSuccess(true)
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Verifique seu e-mail</Text>
          <Text style={styles.subtitle}>
            Enviamos um link para redefinir a senha para:
          </Text>
          <Text style={styles.email}>{email.trim()}</Text>
          <Text style={styles.hint}>
            Verifique a caixa de entrada e a pasta de spam. O link expira em 1 hora.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: branding.primaryColor },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Voltar ao login</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Esqueci a senha</Text>
        <Text style={styles.subtitle}>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
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

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: branding.primaryColor },
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Enviando…' : 'Enviar link'}</Text>
        </Pressable>

        <Pressable style={styles.linkWrap} onPress={() => router.back()}>
          <Text style={[styles.link, { color: branding.primaryColor }]}>Voltar ao login</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  email: {
    fontSize: 15,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#666',
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
    marginBottom: 16,
  },
  button: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
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
    alignItems: 'center',
  },
  link: {
    fontSize: 15,
  },
})
