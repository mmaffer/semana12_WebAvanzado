'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Book {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  createdAt: string
}

interface Author {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  createdAt: string
  books: Book[]
}

interface Stats {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number } | null
  latestBook: { title: string; year: number } | null
  averagePages: number | null
  genres: string[]
  longestBook: { title: string; pages: number } | null
  shortestBook: { title: string; pages: number } | null
}

const EMPTY_BOOK_FORM = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
}

export default function AuthorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [showEditAuthor, setShowEditAuthor] = useState(false)
  const [authorForm, setAuthorForm] = useState({
    name: '', email: '', bio: '', nationality: '', birthYear: '',
  })
  const [authorSubmitting, setAuthorSubmitting] = useState(false)
  const [authorError, setAuthorError] = useState('')

  const [showAddBook, setShowAddBook] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [bookForm, setBookForm] = useState(EMPTY_BOOK_FORM)
  const [bookSubmitting, setBookSubmitting] = useState(false)
  const [bookError, setBookError] = useState('')

  async function fetchData() {
    setLoading(true)
    const [authorRes, statsRes] = await Promise.all([
      fetch(`/api/authors/${id}`),
      fetch(`/api/authors/${id}/stats`),
    ])

    if (!authorRes.ok) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const [authorData, statsData] = await Promise.all([
      authorRes.json(),
      statsRes.ok ? statsRes.json() : null,
    ])

    setAuthor(authorData)
    setStats(statsData)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  function openEditAuthor() {
    if (!author) return
    setAuthorForm({
      name: author.name,
      email: author.email,
      bio: author.bio ?? '',
      nationality: author.nationality ?? '',
      birthYear: author.birthYear?.toString() ?? '',
    })
    setAuthorError('')
    setShowEditAuthor(true)
  }

  async function handleAuthorSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthorSubmitting(true)
    setAuthorError('')

    const res = await fetch(`/api/authors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...authorForm,
        birthYear: authorForm.birthYear ? parseInt(authorForm.birthYear) : null,
      }),
    })

    if (res.ok) {
      setShowEditAuthor(false)
      fetchData()
    } else {
      const data = await res.json()
      setAuthorError(data.error || 'Error al guardar')
    }
    setAuthorSubmitting(false)
  }

  async function handleDeleteAuthor() {
    if (!author) return
    if (!confirm(`¿Eliminar a "${author.name}"? Sus libros también serán eliminados.`)) return
    const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/')
  }

  function openAddBook() {
    setEditingBook(null)
    setBookForm(EMPTY_BOOK_FORM)
    setBookError('')
    setShowAddBook(true)
  }

  function openEditBook(book: Book) {
    setEditingBook(book)
    setBookForm({
      title: book.title,
      description: book.description ?? '',
      isbn: book.isbn ?? '',
      publishedYear: book.publishedYear?.toString() ?? '',
      genre: book.genre ?? '',
      pages: book.pages?.toString() ?? '',
    })
    setBookError('')
    setShowAddBook(true)
  }

  async function handleBookSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBookSubmitting(true)
    setBookError('')

    const payload = {
      ...bookForm,
      authorId: id,
      publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : null,
      pages: bookForm.pages ? parseInt(bookForm.pages) : null,
    }

    const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books'
    const method = editingBook ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowAddBook(false)
      fetchData()
    } else {
      const data = await res.json()
      setBookError(data.error || 'Error al guardar')
    }
    setBookSubmitting(false)
  }

  async function handleDeleteBook(bookId: string, title: string) {
    if (!confirm(`¿Eliminar el libro "${title}"?`)) return
    const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Cargando...</div>
  }

  if (notFound || !author) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500 mb-4">Autor no encontrado.</p>
        <button onClick={() => router.push('/')} className="text-blue-600 hover:underline text-sm">
          Volver al dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Author header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{author.name}</h1>
            <p className="text-gray-500 mt-1">{author.email}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              {author.nationality && (
                <span>Nacionalidad: <strong>{author.nationality}</strong></span>
              )}
              {author.birthYear && (
                <span>Nacimiento: <strong>{author.birthYear}</strong></span>
              )}
            </div>
            {author.bio && (
              <p className="mt-4 text-gray-700 text-sm leading-relaxed max-w-2xl">{author.bio}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={openEditAuthor}
              className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={handleDeleteAuthor}
              className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Total libros</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalBooks}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Prom. páginas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.averagePages ?? '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Primer libro</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {stats.firstBook?.year ?? '—'}
              </p>
              {stats.firstBook && (
                <p className="text-xs text-gray-500 mt-1 truncate" title={stats.firstBook.title}>
                  {stats.firstBook.title}
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Último libro</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {stats.latestBook?.year ?? '—'}
              </p>
              {stats.latestBook && (
                <p className="text-xs text-gray-500 mt-1 truncate" title={stats.latestBook.title}>
                  {stats.latestBook.title}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.genres.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Géneros</p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.genres.map(g => (
                    <span key={g} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {stats.longestBook && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Libro más largo</p>
                <p className="font-medium text-gray-900 text-sm">{stats.longestBook.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stats.longestBook.pages} páginas</p>
              </div>
            )}
            {stats.shortestBook && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Libro más corto</p>
                <p className="font-medium text-gray-900 text-sm">{stats.shortestBook.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stats.shortestBook.pages} páginas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Books list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Libros ({author.books.length})
          </h2>
          <button
            onClick={openAddBook}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Agregar libro
          </button>
        </div>

        {author.books.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            Este autor no tiene libros registrados.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Género
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Páginas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {author.books.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{book.title}</div>
                      {book.isbn && (
                        <div className="text-xs text-gray-400 mt-0.5">ISBN: {book.isbn}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {book.genre ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {book.genre}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {book.publishedYear ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {book.pages ? `${book.pages} págs.` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditBook(book)}
                          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Author Modal */}
      {showEditAuthor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Editar Autor</h3>
            </div>
            <form onSubmit={handleAuthorSubmit} className="p-6 space-y-4">
              {authorError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{authorError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={authorForm.name}
                  onChange={e => setAuthorForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={authorForm.email}
                  onChange={e => setAuthorForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                <textarea
                  rows={3}
                  value={authorForm.bio}
                  onChange={e => setAuthorForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={authorForm.nationality}
                    onChange={e => setAuthorForm(f => ({ ...f, nationality: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año nacimiento</label>
                  <input
                    type="number"
                    value={authorForm.birthYear}
                    onChange={e => setAuthorForm(f => ({ ...f, birthYear: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditAuthor(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={authorSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {authorSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingBook ? 'Editar Libro' : 'Agregar Libro'}
              </h3>
            </div>
            <form onSubmit={handleBookSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {bookError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{bookError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={bookForm.description}
                  onChange={e => setBookForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={e => setBookForm(f => ({ ...f, isbn: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                  <input
                    type="text"
                    value={bookForm.genre}
                    onChange={e => setBookForm(f => ({ ...f, genre: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año publicación</label>
                  <input
                    type="number"
                    min={1000}
                    max={new Date().getFullYear()}
                    value={bookForm.publishedYear}
                    onChange={e => setBookForm(f => ({ ...f, publishedYear: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Páginas</label>
                  <input
                    type="number"
                    min={1}
                    value={bookForm.pages}
                    onChange={e => setBookForm(f => ({ ...f, pages: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBook(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={bookSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {bookSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
