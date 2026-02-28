"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface City {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
}

interface CitySearchProps {
  onCitySelect: (city: City) => void
  placeholder?: string
  className?: string
}

export default function CitySearch({
  onCitySelect,
  placeholder = "Buscar cidade...",
  className,
}: CitySearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchCities = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/admin/cities/search?q=${encodeURIComponent(searchTerm)}`
        )
        if (!response.ok) throw new Error("Erro ao buscar")
        const data = await response.json()
        setResults(data)
        setIsOpen(data.length > 0)
      } catch (error) {
        console.error("Erro ao buscar cidades:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchCities, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  const handleSelect = (city: City) => {
    onCitySelect(city)
    setSearchTerm(`${city.name}, ${city.state}`)
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && results.length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((city) => (
            <button
              key={city.id}
              onClick={() => handleSelect(city)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {city.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {city.state}, {city.country}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchTerm.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
          Nenhuma cidade encontrada
        </div>
      )}
    </div>
  )
}

