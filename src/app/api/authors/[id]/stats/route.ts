import { NextResponse } from 'next/server'
import type { Book } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: { orderBy: { publishedYear: 'asc' } },
      },
    })

    if (!author) {
      return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
    }

    const books: Book[] = author.books
    const booksWithYear = books.filter(b => b.publishedYear !== null)
    const booksWithPages = books.filter(b => b.pages !== null)

    const firstBook = booksWithYear.at(0) ?? null
    const latestBook = booksWithYear.at(-1) ?? null

    const averagePages =
      booksWithPages.length > 0
        ? Math.round(
            booksWithPages.reduce((acc, b) => acc + b.pages!, 0) / booksWithPages.length
          )
        : null

    const sortedByPages = [...booksWithPages].sort((a, b) => b.pages! - a.pages!)
    const longestBook = sortedByPages.at(0) ?? null
    const shortestBook = sortedByPages.at(-1) ?? null

    const genres = [
      ...new Set(books.map(b => b.genre).filter((g): g is string => g !== null)),
    ]

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: books.length,
      firstBook: firstBook ? { title: firstBook.title, year: firstBook.publishedYear } : null,
      latestBook: latestBook ? { title: latestBook.title, year: latestBook.publishedYear } : null,
      averagePages,
      genres,
      longestBook: longestBook ? { title: longestBook.title, pages: longestBook.pages } : null,
      shortestBook: shortestBook ? { title: shortestBook.title, pages: shortestBook.pages } : null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
