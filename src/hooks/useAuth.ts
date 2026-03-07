import { useAuth as useAuthContext } from '@/components/AuthProvider'

export function useAuth() {
  return useAuthContext()
}
