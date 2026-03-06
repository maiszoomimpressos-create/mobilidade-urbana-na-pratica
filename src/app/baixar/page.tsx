import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { Smartphone, Apple, Play } from 'lucide-react'
import Link from 'next/link'

const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PASSENGER_APP_PLAY_STORE_URL || '#'
const APP_STORE_URL = process.env.NEXT_PUBLIC_PASSENGER_APP_APP_STORE_URL || '#'

export default function BaixarPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-mobility-gradient flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              App do Passageiro
            </h1>
            <p className="text-muted-foreground text-lg mb-10">
              Baixe o app Mai Drive e solicite suas corridas com facilidade. Disponível para Android e iPhone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="hero"
                size="xl"
                className="group"
                asChild
              >
                <Link
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play className="w-5 h-5" />
                  Google Play (Android)
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="group border-2 border-primary hover:bg-primary hover:text-primary-foreground"
                asChild
              >
                <Link
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Apple className="w-5 h-5" />
                  App Store (iPhone)
                </Link>
              </Button>
            </div>

            {(PLAY_STORE_URL === '#' || APP_STORE_URL === '#') && (
              <p className="text-sm text-muted-foreground mt-6">
                Os links das lojas serão configurados quando o app estiver publicado.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
