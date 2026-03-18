import { getSessionForServer, SessionWithUser } from './supabase-auth'

export const authOptions = {}

export async function getServerSession(): Promise<SessionWithUser> {
  return getSessionForServer()
}
