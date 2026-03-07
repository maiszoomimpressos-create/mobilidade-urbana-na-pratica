/**
 * Envio de email (Resend).
 * Para recuperação de senha: configure RESEND_API_KEY e opcionalmente RESEND_FROM.
 */

const FROM = process.env.RESEND_FROM ?? 'Mai Drive <onboarding@resend.dev>'

export type SendPasswordResetResult = { ok: true } | { ok: false; error: string }

/**
 * Envia email com link para redefinir senha.
 * Se RESEND_API_KEY não estiver definida, apenas registra o link no console (útil em dev).
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<SendPasswordResetResult> {
  const apiKey = process.env.RESEND_API_KEY
  const isProduction = process.env.NODE_ENV === 'production'

  if (!apiKey) {
    // Em produção, sem API key o email não pode ser enviado
    if (isProduction) {
      console.error('[email] RESEND_API_KEY não definida em produção. Configure na Vercel.')
      return { ok: false, error: 'Envio de email não configurado' }
    }
    // Dev: log para testar sem quebrar o fluxo
    console.info('[email] RESEND_API_KEY não definida. Link de redefinição:', resetLink)
    return { ok: true }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: 'Redefinir sua senha - Mai Drive',
      html: `
        <p>Você solicitou a redefinição de senha.</p>
        <p><a href="${resetLink}">Clique aqui para definir uma nova senha</a></p>
        <p>O link expira em 1 hora. Se não foi você, ignore este email.</p>
      `,
    })
    if (error) {
      console.error('[email] Erro Resend:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao enviar email'
    console.error('[email]', message)
    return { ok: false, error: message }
  }
}
