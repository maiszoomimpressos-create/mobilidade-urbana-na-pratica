import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { isMasterAdmin } from '@/lib/auth-master'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BUCKET_NAME = 'tenant-logos'
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
    throw new Error('Não foi possível criar bucket para logos.')
  }

  return supabase
}

/**
 * POST /api/admin/tenants/logo-upload
 * Recebe imagem, converte para WebP e retorna URL pública.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const tenantIdInput = formData.get('tenantId')
    const tenantId = typeof tenantIdInput === 'string' ? tenantIdInput.trim() : ''

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
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const safeTenantId = tenantId || 'geral'
    const filePath = `${safeTenantId}/${Date.now()}-${crypto.randomUUID()}.webp`
    const supabase = await ensureBucketExists()

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      throw new Error('Falha ao enviar imagem para o storage.')
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    return NextResponse.json({
      url: data.publicUrl,
      contentType: 'image/webp',
    })
  } catch (error) {
    console.error('[admin/tenants/logo-upload] POST', error)
    return NextResponse.json({ error: 'Erro ao fazer upload da logo.' }, { status: 500 })
  }
}
