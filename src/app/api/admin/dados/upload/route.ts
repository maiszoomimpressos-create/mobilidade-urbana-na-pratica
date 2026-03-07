import { NextRequest, NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { exec } from 'child_process'

export const dynamic = 'force-dynamic'

function getTargetFilename(target: string): string | null {
  switch (target) {
    case 'municipios':
      return 'BR_Municipios_2024.zip'
    case 'regioesIntermediarias':
      return 'BR_RG_Intermediarias_2024.zip'
    case 'regioesImediatas':
      return 'BR_RG_Imediatas_2024.zip'
    default:
      return null
  }
}

/**
 * POST /api/admin/dados/upload
 * Recebe um ZIP do IBGE e salva em data/ibge com nome padrão.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionForServer()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const target = formData.get('target')

    if (!(file instanceof File) || typeof target !== 'string') {
      return NextResponse.json(
        { error: 'Arquivo ou destino inválido' },
        { status: 400 },
      )
    }

    const filename = getTargetFilename(target)
    if (!filename) {
      return NextResponse.json({ error: 'Destino desconhecido' }, { status: 400 })
    }

    const dataDir = path.join(process.cwd(), 'data', 'ibge')
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fullPath = path.join(dataDir, filename)
    await writeFile(fullPath, buffer)

    // Para municípios, tentamos extrair automaticamente (se tiver unzip instalado)
    if (target === 'municipios') {
      try {
        await new Promise<void>((resolve) => {
          exec(
            `powershell -Command "Expand-Archive -LiteralPath '${fullPath}' -DestinationPath '${dataDir}' -Force"`,
            () => resolve(),
          )
        })
      } catch {
        // Se falhar, deixamos só o ZIP e explicamos para o usuário extrair manualmente
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        target === 'municipios'
          ? 'Arquivo de municípios enviado. Se a extração automática falhar, extraia o ZIP manualmente para data/ibge/.'
          : 'Arquivo enviado com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao fazer upload de dados IBGE:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload de dados IBGE' },
      { status: 500 },
    )
  }
}

