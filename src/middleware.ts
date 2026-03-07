import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/baixar']
const AUTH_PATHS = ['/login', '/register', '/esqueci-senha', '/redefinir-senha']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/baixar')
}

function isAuthPage(pathname: string) {
  return AUTH_PATHS.some((p) => pathname.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const { response, session } = await updateSession(req)

  // Páginas públicas: sempre permitir
  if (isPublic(pathname)) {
    return response
  }

  // Páginas de auth (login, register, etc.)
  if (isAuthPage(pathname)) {
    // Nunca redirecionar quem está em /redefinir-senha (link do email de recuperação)
    if (pathname.startsWith('/redefinir-senha')) {
      return response
    }
    if (session?.user) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return response
  }

  // Rotas protegidas: exige sessão Supabase
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
