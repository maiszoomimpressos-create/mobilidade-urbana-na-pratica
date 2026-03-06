"use client"

import { useState, useEffect } from "react"

/**
 * Mostra a URL (host + porta) no canto da tela em desenvolvimento,
 * para você saber em qual porta o app está rodando.
 */
export default function DevPortBanner() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    setUrl(window.location.origin)
  }, [])

  if (process.env.NODE_ENV !== "development" || !url) return null

  return (
    <div
      className="fixed bottom-3 left-3 z-[9999] rounded-md bg-foreground/90 px-3 py-1.5 text-xs text-background shadow-lg"
      title="Porta em uso (apenas em dev)"
    >
      {url}
    </div>
  )
}
