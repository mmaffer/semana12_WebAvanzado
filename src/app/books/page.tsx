'use client'

import { useState, useEffect } from 'react'

interface Author {
  id: string
  name: string
}

interface Book {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  author: { id: string; name: string; email: string }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface Filters {
  search: string
  genre: string
  authorId: string
  sortBy: string
  order: 'asc' | 'desc'
  page: number
}

const EMPTY_BOOK_FORM = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
  authorId: '',
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Fecha de creación' },
  { value: 'title', label: 'Título' },
  { value: 'publishedYear', label: 'Año de publicación' },
]

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)

  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<Filters>({
    search: '',
    genre: '',
    authorId: '',
    sortBy: 'createdAt',
    order: 'desc',
    page: 1,
  })

  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [form, setForm] = useState(EMPTY_BOOK_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Fetch authors and genres on mount
  useEffect(() => {
    async function init() {
      const [authorsRes, booksRes] = await Promise.all([
        fetch('/api/authors'),
        fetch('/api/books'),
      ])
      if (authorsRes.ok) {
        const data = await authorsRes.json()
        setAuthors(data.map((a: Author & { _count?: unknown }) => ({ id: a.id, name: a.name })))
      }
      if (booksRes.ok) {
        const data: Book[] = await booksRes.json()
        const uniqueGenres = [...new Set(data.map(b => b.genre).filter((g): g is string => g !== null))]
        setGenres(uniqueGenres.sort())
      }
    }
    init()
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch books when filters change
  useEffect(() => {
    async function fetchBooks() {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.genre) params.set('genre', filters.genre)
      if (filters.authorId) params.set('authorId', filters.authorId)
      params.set('sortBy', filters.sortBy)
      params.set('order', filters.order)
      params.set('page', filters.page.toString())
      params.set('limit', '10')

      const res = await fetch(`/api/books/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBooks(data.data)
        setPagination(data.pagination)
      }
      setLoading(false)
    }
    fetchBooks()
  }, [filters])

  function openCreate() {
    setEditingBook(null)
    setForm(EMPTY_BOOK_FORM)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(book: Book) {
    setEditingBook(book)
    setForm({
      title: book.title,
      description: book.description ?? '',
      isbn: book.isbn ?? '',
      publishedYear: book.publishedYear?.toString() ?? '',
      genre: book.genre ?? '',
      pages: book.pages?.toString() ?? '',
      authorId: book.authorId,
    })
    setFormError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    const payload = {
      ...form,
      publishedYear: form.publishedYear ? parseInt(form.publishedYear) : null,
      pages: form.pages ? parseInt(form.pages) : null,
    }

    const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books'
    const method = editingBook ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowModal(false)
      setFilters(prev => ({ ...prev }))
    } else {
      const data = await res.json()
      setFormError(data.error || 'Error al guardar')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar el libro "${title}"?`)) return
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
    if (res.ok) setFilters(prev => ({ ...prev, page: 1 }))
  }

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Libros</h1>
          <p className="text-gray-500 mt-1">
            {pagination ? `${pagination.total} resultados encontrados` : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nuevo Libro
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.genre}
            onChange={e => setFilter('genre', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos los géneros</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={filters.authorId}
            onChange={e => setFilter('authorId', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos los autores</option>
            {authors.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              value={filters.sortBy}
              onChange={e => setFilter('sortBy', e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setFilter('order', filters.order === 'asc' ? 'desc' : 'asc')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              title={filters.order === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {filters.order === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Book list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Buscando...</div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No se encontraron libros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Libro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Género
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {books.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{book.title}</div>
                      {book.isbn && (
                        <div className="text-xs text-gray-400 mt-0.5">ISBN: {book.isbn}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{book.author.name}</td>
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(book)}
                          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrev}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - pagination.page) <= 2)
              .map(p => (
                <button
                  key={p}
                  onClick={() => setFilters(prev => ({ ...prev, page: p }))}
                  className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                    p === pagination.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              disabled={!pagination.hasNext}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Book Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingBook ? 'Editar Libro' : 'Nuevo Libro'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {formError}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
                <select
                  required
                  value={form.authorId}
                  onChange={e => setForm(f => ({ ...f, authorId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccionar autor...</option>
                  {authors.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={form.isbn}
                    onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                  <input
                    type="text"
                    value={form.genre}
                    onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año de publicación
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={new Date().getFullYear()}
                    value={form.publishedYear}
                    onChange={e => setForm(f => ({ ...f, publishedYear: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Páginas</label>
                  <input
                    type="number"
                    min={1}
                    value={form.pages}
                    onChange={e => setForm(f => ({ ...f, pages: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
