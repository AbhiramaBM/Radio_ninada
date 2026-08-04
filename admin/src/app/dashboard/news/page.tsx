'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import ImageUpload from '@/components/common/ImageUpload';

const newsCategories = ['College', 'Local', 'State', 'National', 'International'];

export default function NewsManager() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [warning, setWarning] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Local',
    featuredImage: '',
    status: 'PUBLISHED',
  });

  async function fetchNews() {
    setLoading(true);
    try {
      const res = await api.get('/news');
      if (res.data.success) {
        setNewsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWarning('');
    try {
      await api.post('/news', form);
      setModalOpen(false);
      setForm({
        title: '',
        content: '',
        category: 'Local',
        featuredImage: '',
        status: 'PUBLISHED',
      });
      fetchNews();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setWarning(err.response.data.message);
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this news headline?')) {
      await api.delete(`/news/${id}`);
      fetchNews();
    }
  }

  function resolveImage(url?: string) {
    if (!url) return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80';
    if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
    return url;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">News & Editorial Management</h1>
          <p className="text-xs text-slate-400">Publish articles across College, Local, State, and National categories</p>
        </div>

        <button
          onClick={() => { setWarning(''); setModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Publish News Article</span>
        </button>
      </div>

      {/* News Articles Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsList.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-xl p-4 flex space-x-4">
              <img
                src={resolveImage(item.featuredImage)}
                alt={item.title}
                className="w-24 h-24 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm truncate mt-1">{item.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.content}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete news article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Create News Article</h3>

            {warning && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{warning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <ImageUpload
                label="Article Featured Cover Image"
                value={form.featuredImage}
                onChange={(url) => setForm({ ...form, featuredImage: url })}
                placeholder="Click to upload article cover image"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Headline Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Campus Cultural Fest Registrations Open Next Week"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {newsCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Article Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={4}
                  placeholder="Full bulletin body text..."
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 cursor-pointer shadow-md"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

