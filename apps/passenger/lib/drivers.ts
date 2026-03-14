/**
 * Tipos e função para motoristas online.
 * Hoje usa dados mock; quando existir app do motorista, trocar por chamada à API.
 *
 * Estados:
 * - available  -> LIVRE (verde)
 * - on_route   -> A CAMINHO (amarelo)
 * - in_ride    -> OCUPADO (vermelho)
 * - offline    -> não exibido no mapa
 */

export type DriverStatus = 'available' | 'on_route' | 'in_ride' | 'offline'

export type OnlineDriver = {
  id: string
  latitude: number
  longitude: number
  status: DriverStatus
}

/**
 * Retorna motoristas online. Demo: dados fixos na região.
 * Depois: buscar da API (ex.: GET /api/drivers/nearby?lat=&lng=).
 */
export function getOnlineDrivers(centerLat?: number, centerLng?: number): OnlineDriver[] {
  const lat = centerLat ?? -15.77972
  const lng = centerLng ?? -47.92972
  const offset = 0.008

  return [
    { id: '1', latitude: lat + offset, longitude: lng, status: 'available' },
    { id: '2', latitude: lat - offset * 0.5, longitude: lng + offset, status: 'on_route' },
    { id: '3', latitude: lat + offset * 0.7, longitude: lng - offset * 0.6, status: 'in_ride' },
    { id: '4', latitude: lat - offset, longitude: lng - offset * 0.5, status: 'available' },
    { id: '5', latitude: lat + offset * 0.4, longitude: lng + offset * 0.8, status: 'on_route' },
    { id: '6', latitude: lat - offset * 0.6, longitude: lng + offset * 0.4, status: 'available' },
    { id: '7', latitude: lat + offset * 0.3, longitude: lng + offset * 0.3, status: 'in_ride' },
    { id: '8', latitude: lat - offset * 0.3, longitude: lng - offset * 0.9, status: 'available' },
  ]
}
