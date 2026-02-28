"use client"

import { MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

const Footer = () => {
  return (
    <footer className="bg-hero border-t border-hero-foreground/10 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-mobility-gradient flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-hero-foreground">
                Mai Drive
              </span>
            </div>
            <p className="text-hero-foreground/60 text-sm mb-6">
              Transformando a mobilidade urbana para um futuro mais conectado e sustentável.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-hero-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Facebook className="w-5 h-5 text-hero-foreground/70" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-hero-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Twitter className="w-5 h-5 text-hero-foreground/70" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-hero-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Instagram className="w-5 h-5 text-hero-foreground/70" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-hero-foreground/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Linkedin className="w-5 h-5 text-hero-foreground/70" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-hero-foreground mb-4">Produto</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Recursos</a></li>
              <li><a href="#pricing" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Preços</a></li>
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Para Empresas</a></li>
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Parceiros</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-hero-foreground mb-4">Empresa</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Carreiras</a></li>
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Blog</a></li>
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Imprensa</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-hero-foreground mb-4">Suporte</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Contato</a></li>
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Privacidade</a></li>
              <li><a href="#" className="text-hero-foreground/60 hover:text-primary text-sm transition-colors">Termos de Uso</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-hero-foreground/10 mt-12 pt-8 text-center">
          <p className="text-hero-foreground/50 text-sm">
            © 2024 Mai Drive. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

