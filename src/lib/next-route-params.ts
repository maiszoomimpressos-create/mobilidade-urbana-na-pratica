/**
 * Next 14 expõe `params` síncrono; Next 15+ pode usar `Promise`. Unifica para route handlers.
 */
export async function resolveDynamicRouteParam(
  params: Promise<Record<string, string>> | Record<string, string> | undefined,
  key: string
): Promise<string | null> {
  if (params == null) return null
  const resolved =
    typeof (params as Promise<unknown>).then === 'function'
      ? await (params as Promise<Record<string, string>>)
      : (params as Record<string, string>)
  const v = resolved?.[key]
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null
}
