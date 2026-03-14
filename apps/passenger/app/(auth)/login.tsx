import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native'
import { router } from 'expo-router'
import { Link } from 'expo-router'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useBranding } from '@/contexts/BrandingContext'

export default function LoginScreen() {
  const { branding } = useBranding()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [anonLoading, setAnonLoading] = useState(false)

  const handleContinuarSemConta = async () => {
    if (!isSupabaseConfigured) return
    setAnonLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase.auth.signInAnonymously()
      if (err) {
        setError('Não foi possível continuar. Habilite "Anonymous sign-ins" no Supabase (Auth > Providers).')
        return
      }
      if (data.session) {
        router.replace('/(tabs)')
      }
    } catch {
      setError('Erro ao entrar. Tente de novo.')
    } finally {
      setAnonLoading(false)
    }
  }

  const handleLogin = async () => {
    setError('')
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (err) {
        setError('E-mail ou senha inválidos.')
        return
      }
      if (data.session) {
        router.replace('/(tabs)')
      }
    } catch {
      setError('Erro ao entrar. Tente de novo.')
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
        {branding.logo ? (
          <Image source={{ uri: branding.logo }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: branding.primaryColor }]}>
            <Text style={styles.logoPlaceholderText}>{branding.name.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.title}>{branding.name}</Text>
        <Text style={styles.subtitle}>Entre na sua conta</Text>

        {!isSupabaseConfigured && (
          <Text style={styles.warning}>
            Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env do app (pasta apps/passenger).
          </Text>
        )}
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
          placeholder="Senha"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <Pressable
          style={styles.forgotWrap}
          onPress={() => router.push('/(auth)/esqueci-senha')}
        >
          <Text style={[styles.forgotLink, { color: branding.primaryColor }]}>
            Esqueci a senha
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: branding.primaryColor },
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Entrando…' : 'Entrar'}</Text>
        </Pressable>

        {isSupabaseConfigured && (
          <Pressable
            style={({ pressed }) => [
              styles.buttonOutline,
              { borderColor: branding.primaryColor },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinuarSemConta}
            disabled={anonLoading}
          >
            <Text style={[styles.buttonOutlineText, { color: branding.primaryColor }]}>
              {anonLoading ? 'Entrando…' : 'Continuar sem conta'}
            </Text>
          </Pressable>
        )}

        <Link href="/(auth)/register" asChild>
          <Pressable style={styles.linkWrap}>
            <Text style={[styles.link, { color: branding.primaryColor }]}>Não tem conta? Cadastre-se</Text>
          </Pressable>
        </Link>
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
  logo: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  logoPlaceholderText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  warning: {
    color: '#b8860b',
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: '#fffbe6',
    padding: 10,
    borderRadius: 8,
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 14,
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
  buttonOutline: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
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
