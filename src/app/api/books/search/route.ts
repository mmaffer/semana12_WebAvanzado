import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_SORT_FIELDS = ['title', 'publishedYear', 'createdAt'] as const
type SortField = typeof VALID_SORT_FIELDS[number]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') ?? ''
    const genre = searchParams.get('genre') ?? ''
    const authorName = searchParams.get('authorName') ?? ''
    const authorId = searchParams.get('authorId') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10') || 10))
    const sortByParam = searchParams.get('sortBy') ?? 'createdAt'
    const sortBy: SortField = (VALID_SORT_FIELDS as readonly string[]).includes(sortByParam)
      ? (sortByParam as SortField)
      : 'createdAt'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    const where = {
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
      ...(genre && { genre }),
      ...(authorId
        ? { authorId }
        : authorName
          ? { author: { name: { contains: authorName, mode: 'insensitive' as const } } }
          : {}),
    }

    const [data, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al buscar libros' }, { status: 500 })
  }
}
