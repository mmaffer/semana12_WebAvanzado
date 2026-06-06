'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Author {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  createdAt: string
  _count: { books: number }
}

const EMPTY_FORM = { name: '', email: '', bio: '', nationality: '', birthYear: '' }

export default function Dashboard() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  async function fetchAuthors() {
    setLoading(true)
    const res = await fetch('/api/authors')
    if (res.ok) setAuthors(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchAuthors() }, [])

  function openCreate() {
    setEditingAuthor(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(author: Author) {
    setEditingAuthor(author)
    setForm({
      name: author.name,
      email: author.email,
      bio: author.bio ?? '',
      nationality: author.nationality ?? '',
      birthYear: author.birthYear?.toString() ?? '',
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
      birthYear: form.birthYear ? parseInt(form.birthYear) : null,
    }

    const url = editingAuthor ? `/api/authors/${editingAuthor.id}` : '/api/authors'
    const method = editingAuthor ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setShowModal(false)
      fetchAuthors()
    } else {
      const data = await res.json()
      setFormError(data.error || 'Error al guardar')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a "${name}"? Sus libros también serán eliminados.`)) return
    const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' })
    if (res.ok) fetchAuthors()
  }

  const totalBooks = authors.reduce((sum, a) => sum + a._count.books, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Gestión de autores y biblioteca</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nuevo Autor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Autores</p>
          <p className="text-4xl font-bold text-blue-600">{authors.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Libros</p>
          <p className="text-4xl font-bold text-green-600">{totalBooks}</p>
        </div>
      </div>

      {/* Author table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Autores</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : authors.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No hay autores registrados. Crea el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nacionalidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Libros
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {authors.map(author => (
                  <tr key={author.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{author.name}</div>
                      <div className="text-sm text-gray-500">{author.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {author.nationality ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {author._count.books} libros
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/authors/${author.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => openEdit(author)}
                          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(author.id, author.name)}
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingAuthor ? 'Editar Autor' : 'Nuevo Autor'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {formError}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={form.nationality}
                    onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año nacimiento</label>
                  <input
                    type="number"
                    min={1000}
                    max={new Date().getFullYear()}
                    value={form.birthYear}
                    onChange={e => setForm(f => ({ ...f, birthYear: e.target.value }))}
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
