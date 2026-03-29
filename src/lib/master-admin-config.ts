/**
 * E-mails considerados admin master (env). Centralizado para evitar import circular
 * entre auth-master e supabase-auth.
 */
export function getMasterAdminEmails(): string[] {
  const multi = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS?.trim()
  if (multi) {
    return multi
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  }
  const single = (
    process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? 'maiszoomimpressos@gmail.com'
  )
    .trim()
    .toLowerCase()
  return single ? [single] : []
}
