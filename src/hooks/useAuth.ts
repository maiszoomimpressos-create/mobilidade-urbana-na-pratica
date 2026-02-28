import { useSession } from 'next-auth/react'

const MASTER_ADMIN_EMAIL = 'maiszoomimpressos@gmail.com'

export function useAuth() {
  const { data: session, status } = useSession()

  const user = session?.user

  return {
    user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isMasterAdmin: user?.email === MASTER_ADMIN_EMAIL,
  }
}

