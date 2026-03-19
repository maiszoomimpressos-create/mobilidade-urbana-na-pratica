import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { Smartphone, Apple, Play, Car } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const PASSENGER_APK_URL = process.env.NEXT_PUBLIC_PASSENGER_APP_APK_URL || ''
const PASSENGER_PLAY_STORE_URL = process.env.NEXT_PUBLIC_PASSENGER_APP_PLAY_STORE_URL || ''
const PASSENGER_APP_STORE_URL = process.env.NEXT_PUBLIC_PASSENGER_APP_APP_STORE_URL || ''

const DRIVER_APK_URL = process.env.NEXT_PUBLIC_DRIVER_APP_APK_URL || ''
const DRIVER_PLAY_STORE_URL = process.env.NEXT_PUBLIC_DRIVER_APP_PLAY_STORE_URL || ''

export default async function BaixarPage({
  searchParams,
}: {
  searchParams: { tenant?: string }
}) {
  const tenantSlug = searchParams?.tenant?.trim() || 'mai-drive'
  const isTenant = tenantSlug !== 'mai-drive'

  let centralName: string | null = null
  if (isTenant) {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlug, isActive: true },
      select: { name: true },
    })
    if (tenant) centralName = tenant.name
  }

  const passengerAndroidHref = PASSENGER_APK_URL || PASSENGER_PLAY_STORE_URL || '#'
  const passengerAndroidLabel = PASSENGER_APK_URL ? 'Baixar APK' : 'Google Play'

  const driverAndroidHref = DRIVER_APK_URL || DRIVER_PLAY_STORE_URL || '#'
  const driverAndroidLabel = DRIVER_APK_URL ? 'Baixar APK' : 'Google Play'

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Baixe o App Mai Drive
            </h1>
            <p className="text-muted-foreground text-lg">
              Escolha seu app abaixo.
              {centralName && (
                <span className="block mt-2 font-medium text-foreground">
                  Central {centralName}
                </span>
              )}
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Passageiro */}
            <div className="rounded-2xl border bg-card p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-mobility-gradient flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Passageiro</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Solicite corridas com facilidade
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="hero" size="lg" className="w-full" asChild>
                  <Link href={passengerAndroidHref} target="_blank" rel="noopener noreferrer">
                    <Play className="w-5 h-5" />
                    Android — {passengerAndroidLabel}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-primary hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href={PASSENGER_APP_STORE_URL || '#'} target="_blank" rel="noopener noreferrer">
                    <Apple className="w-5 h-5" />
                    iPhone — App Store
                  </Link>
                </Button>
              </div>
            </div>

            {/* Motorista */}
            <div className="rounded-2xl border bg-card p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mx-auto">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Motorista</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Aceite corridas e ganhe dinheiro
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="hero" size="lg" className="w-full" asChild>
                  <Link href={driverAndroidHref} target="_blank" rel="noopener noreferrer">
                    <Play className="w-5 h-5" />
                    Android — {driverAndroidLabel}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-primary hover:bg-primary hover:text-primary-foreground"
                  disabled
                >
                  <Apple className="w-5 h-5" />
                  iPhone — Em breve
                </Button>
              </div>
            </div>
          </div>

          {!PASSENGER_APK_URL && !PASSENGER_PLAY_STORE_URL && !DRIVER_APK_URL && !DRIVER_PLAY_STORE_URL && (
            <p className="text-sm text-muted-foreground mt-8 text-center">
              Links de download serão atualizados quando os builds terminarem.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
