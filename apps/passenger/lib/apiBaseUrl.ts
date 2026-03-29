import { Platform } from 'react-native'

const FALLBACK = 'https://maidrive.com.br'

/**
 * URL base do Next.js (API + páginas como /redefinir-senha).
 * Aceita EXPO_PUBLIC_APP_API_URL (preferencial) ou EXPO_PUBLIC_API_URL (igual ao motorista).
 */
export function getApiBaseUrl(): string {
  let raw = (
    process.env.EXPO_PUBLIC_APP_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    FALLBACK
  ).trim()
  if (!raw) raw = FALLBACK
  raw = raw.replace(/\/$/, '')

  if (typeof __DEV__ !== 'undefined' && __DEV__ && Platform.OS === 'android') {
    try {
      const withProto = raw.includes('://') ? raw : `http://${raw}`
      const u = new URL(withProto)
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        u.hostname = '10.0.2.2'
        return u.toString().replace(/\/$/, '')
      }
    } catch {
      /* mantém raw */
    }
  }

  return raw
}
