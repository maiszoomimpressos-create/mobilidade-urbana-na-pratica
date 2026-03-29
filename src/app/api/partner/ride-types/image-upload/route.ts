import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPartnerTenantIdOrError } from '@/lib/partner-tenant-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
/** sharp quebra em alguns runtimes serverless; fallback envia JPEG/PNG/WebP original. */
export const runtime = 'nodejs'

const BUCKET_NAME = 'ride-type-images'
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

type PreparedImage = {
  buffer: Buffer
  contentType: string
  extension: string
}

/**
 * Tenta WebP via sharp (menor + padronizado). Se sharp falhar (comum na Vercel), usa o arquivo original.
 */
async function prepareImage(buffer: Buffer, fileMime: string): Promise<PreparedImage> {
  const mime = (fileMime || '').toLowerCase().split(';')[0].trim()

  try {
    const sharpMod = await import('sharp')
    const sharp = sharpMod.default
    const out = await sharp(buffer)
      .rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
    return { buffer: out, contentType: 'image/webp', extension: 'webp' }
  } catch (sharpErr) {
    console.warn('[partner/ride-types/image-upload] sharp falhou, usando imagem original', sharpErr)
  }

  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return { buffer, contentType: 'image/jpeg', extension: 'jpg' }
  }
  if (mime === 'image/png') {
    return { buffer, contentType: 'image/png', extension: 'png' }
  }
  if (mime === 'image/webp') {
    return { buffer, contentType: 'image/webp', extension: 'webp' }
  }

  throw new Error(
    `Não foi possível processar a imagem. Envie JPEG, PNG ou WebP (recebido: ${mime || 'desconhecido'}).`
  )
}

/**
 * Garante bucket sem depender de listBuckets (alguns projetos Supabase retornam erro em list).
 */
async function ensureBucketLikelyExists(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'],
  })
  if (!error) return
  const m = (error.message || '').toLowerCase()
  if (
    m.includes('already') ||
    m.includes('exists') ||
    m.includes('duplicate') ||
    m.includes('resource already')
  ) {
    return
  }
  console.warn('[partner/ride-types/image-upload] createBucket (aviso):', error.message)
}

/**
 * POST /api/partner/ride-types/image-upload
 * Envia imagem para o storage público e retorna URL (uso no app passageiro).
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      return NextResponse.json(
        {
          error: 'Upload indisponível: falta SUPABASE_SERVICE_ROLE_KEY no servidor.',
          detail:
            'Na Vercel: Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY + Redeploy.',
        },
        { status: 503 }
      )
    }

    const auth = await getPartnerTenantIdOrError(request)
    if (!auth.ok) return auth.response

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo de imagem não informado.' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Envie um arquivo de imagem válido.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 5MB.' }, { status: 400 })
    }

    const sourceBuffer = Buffer.from(await file.arrayBuffer())
    let prepared: PreparedImage
    try {
      prepared = await prepareImage(sourceBuffer, file.type)
    } catch (prepErr) {
      const msg = prepErr instanceof Error ? prepErr.message : String(prepErr)
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const filePath = `${auth.tenantId}/${Date.now()}-${crypto.randomUUID()}.${prepared.extension}`
    const supabase = createSupabaseAdminClient()

    await ensureBucketLikelyExists(supabase)

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, prepared.buffer, {
      contentType: prepared.contentType,
      upsert: false,
    })

    if (uploadError) {
      console.error('[partner/ride-types/image-upload] storage', uploadError)
      return NextResponse.json(
        {
          error: 'Falha ao enviar imagem no Supabase Storage.',
          detail: uploadError.message,
        },
        { status: 502 }
      )
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    return NextResponse.json({
      url: data.publicUrl,
      contentType: prepared.contentType,
    })
  } catch (error) {
    console.error('[partner/ride-types/image-upload] POST', error)
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('SUPABASE_SERVICE_ROLE_MISSING')) {
      return NextResponse.json(
        {
          error: 'Storage não configurado (service role).',
          detail: 'Defina SUPABASE_SERVICE_ROLE_KEY na Vercel e faça redeploy.',
        },
        { status: 503 }
      )
    }
    return NextResponse.json(
      {
        error: 'Erro ao fazer upload da imagem.',
        detail: msg.slice(0, 280),
      },
      { status: 500 }
    )
  }
}
