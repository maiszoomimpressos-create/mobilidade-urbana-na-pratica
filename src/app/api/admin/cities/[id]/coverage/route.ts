import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cityId = params.id
    const body = await request.json()
    const { coverageArea } = body

    if (!coverageArea) {
      return NextResponse.json(
        { error: 'coverageArea é obrigatório' },
        { status: 400 }
      )
    }

    // Atualizar área de cobertura da cidade
    const city = await prisma.city.update({
      where: { id: cityId },
      data: {
        coverageArea: coverageArea,
      },
    })

    return NextResponse.json({
      success: true,
      city,
    })
  } catch (error) {
    console.error('Erro ao salvar área de cobertura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cityId = params.id

    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: {
        id: true,
        name: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        coverageArea: true,
        isActive: true,
      },
    })

    if (!city) {
      return NextResponse.json(
        { error: 'Cidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(city)
  } catch (error) {
    console.error('Erro ao buscar cidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

