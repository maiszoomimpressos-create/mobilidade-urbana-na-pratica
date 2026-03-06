import { useSession } from 'next-auth/react'

const DEFAULT_MASTER_EMAIL = 'maiszoomimpressos@gmail.com'

function getMasterAdminEmail(): string {
  return process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? DEFAULT_MASTER_EMAIL
}

export function useAuth() {
  const { data: session, status } = useSession()

  const user = session?.user
  const masterEmail = getMasterAdminEmail()

  return {
    user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isMasterAdmin: user?.email ? user.email === masterEmail : false,
  }
}

