import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')

    // Se está autenticado e tenta acessar login/register, redireciona para a landing (página principal)
    if (token && isAuthPage) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                          req.nextUrl.pathname.startsWith('/register')
        const isPublicPage = req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/baixar'

        // Páginas públicas e de auth são acessíveis sem token
        if (isAuthPage || isPublicPage) {
          return true
        }

        // Outras páginas precisam de token
        return !!token
      },
    },
  }
)

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

