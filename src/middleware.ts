import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

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

  // Páginas públicas: sempre permitir
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // Páginas de auth (login/register)
  if (isAuthPage(pathname)) {
    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      })
      if (token) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch {
      // Secret não configurado: deixa acessar login
    }
    return NextResponse.next()
  }

  // Outras páginas: verificar token
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

