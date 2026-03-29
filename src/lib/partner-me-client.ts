'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Opções de fetch para GET /api/partner/me no browser.
 * Inclui Authorization Bearer quando há sessão Supabase — necessário em previews Vercel
 * e quando cookies da sessão não chegam à API route.
 */
export async function partnerMeFetchInit(): Promise<RequestInit> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }
  return {
    credentials: 'include',
    cache: 'no-store',
    headers,
  }
}

/** POST com JSON — mesmo Bearer/cookies (ex.: staging Vercel). */
export async function partnerJsonPostInit(body: unknown): Promise<RequestInit> {
  const base = await partnerMeFetchInit()
  const prev = (base.headers as Record<string, string>) || {}
  return {
    ...base,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...prev,
    },
    body: JSON.stringify(body),
  }
}

/** POST multipart — só repassa Authorization (o browser define Content-Type com boundary). */
export async function partnerFormDataPostInit(formData: FormData): Promise<RequestInit> {
  const base = await partnerMeFetchInit()
  const prev = (base.headers as Record<string, string>) || {}
  const headers: Record<string, string> = {}
  if (prev.Authorization) headers.Authorization = prev.Authorization
  return {
    credentials: 'include',
    cache: 'no-store',
    method: 'POST',
    headers: Object.keys(headers).length ? headers : undefined,
    body: formData,
  }
}

export async function partnerPatchJsonInit(body: unknown): Promise<RequestInit> {
  const base = await partnerMeFetchInit()
  const prev = (base.headers as Record<string, string>) || {}
  return {
    ...base,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...prev,
    },
    body: JSON.stringify(body),
  }
}
