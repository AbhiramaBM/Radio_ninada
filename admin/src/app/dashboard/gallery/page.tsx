'use client';

import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import ImageUpload from '@/components/common/ImageUpload';

export default function GalleryManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    mediaUrl: '',
    album: 'Studio Tour',
    category: 'Studio',
    type: 'PHOTO',
  });

  async function fetchGallery() {
    setLoading(true);
    try {
      const res = await api.get('/gallery');
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGallery();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/gallery', form);
      setModalOpen(false);
      setForm({
        title: '',
        mediaUrl: '',
        album: 'Studio Tour',
        category: 'Studio',
        type: 'PHOTO',
      });
      fetchGallery();
    } catch (err) {}
  }

  async function handleDelete(id: string) {
    if (confirm('Delete media file?')) {
      await api.delete(`/gallery/${id}`);
      fetchGallery();
    }
  }

  function resolveMediaUrl(url?: string) {
    if (!url) return 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80';
    if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
    return url;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Media Gallery Management</h1>
          <p className="text-xs text-slate-400">Organize photo albums, studio tours, and concert footage</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Media</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
              <img
                src={resolveMediaUrl(item.mediaUrl)}
                alt={item.title}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">{item.album}</span>
                <p className="text-xs font-bold text-white truncate">{item.title}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete media"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Add Gallery Image</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <ImageUpload
                label="Gallery Photo / Media File"
                value={form.mediaUrl}
                onChange={(url) => setForm({ ...form, mediaUrl: url })}
                placeholder="Click to upload gallery photo"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Image Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Main Studio Live Recording Setup"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Album Name</label>
                <input
                  type="text"
                  value={form.album}
                  onChange={(e) => setForm({ ...form, album: e.target.value })}
                  required
                  placeholder="e.g. Studio Tour"
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
                  Upload Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

