import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getPartnerTenantIdOrError } from '@/lib/partner-tenant-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BUCKET_NAME = 'ride-type-images'
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

async function ensureBucketExists() {
  const supabase = createSupabaseAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error('Não foi possível listar buckets de armazenamento.')
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME)
  if (bucketExists) return supabase

  const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'],
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error('Não foi possível criar bucket para imagens de tipo de corrida.')
  }

  return supabase
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
            'Na Vercel: Project → Settings → Environment Variables → adicione SUPABASE_SERVICE_ROLE_KEY (service_role do Supabase, não o anon). Depois redeploy.',
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
    const webpBuffer = await sharp(sourceBuffer)
      .rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const filePath = `${auth.tenantId}/${Date.now()}-${crypto.randomUUID()}.webp`
    const supabase = await ensureBucketExists()

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      console.error('[partner/ride-types/image-upload]', uploadError)
      return NextResponse.json({ error: 'Falha ao enviar imagem.' }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    return NextResponse.json({
      url: data.publicUrl,
      contentType: 'image/webp',
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
    return NextResponse.json({ error: 'Erro ao fazer upload da imagem.' }, { status: 500 })
  }
}
