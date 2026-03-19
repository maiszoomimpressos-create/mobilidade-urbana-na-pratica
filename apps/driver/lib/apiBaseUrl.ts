import { Platform } from 'react-native'

const FALLBACK = 'https://mobilidade-urbana-na-pratica.vercel.app'

/**
 * URL base do backend Next.js.
 * No emulador Android, `localhost` / `127.0.0.1` apontam para o próprio emulador;
 * o host da máquina é acessível via **10.0.2.2** (Android Emulator).
 */
export function getApiBaseUrl(): string {
  let raw = (process.env.EXPO_PUBLIC_API_URL || FALLBACK).trim()
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
