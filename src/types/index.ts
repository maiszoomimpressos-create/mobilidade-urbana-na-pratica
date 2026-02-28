// Tipos globais do sistema

export type UserRole = 'admin' | 'manager' | 'driver' | 'passenger'

export type RideStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type DriverStatus = 'offline' | 'online' | 'in_ride' | 'paused'

export type PlanInterval = 'monthly' | 'yearly'

export type TenantPlanStatus = 'active' | 'cancelled' | 'expired'

