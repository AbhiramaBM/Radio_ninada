'use client';

import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Video, Film, Camera, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import ImageUpload from '@/components/common/ImageUpload';

export default function GalleryManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'bts' | 'photo'>('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    thumbnail: '',
    duration: '',
    album: 'Behind The Mic',
    category: 'BTS Shorts',
    type: 'VIDEO',
  });

  async function fetchGallery() {
    setLoading(true);
    try {
      const res = await api.get('/gallery');
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
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
      const res = await api.post('/gallery', form);
      if (res.data && res.data.success) {
        setModalOpen(false);
        setForm({
          title: '',
          description: '',
          mediaUrl: '',
          thumbnail: '',
          duration: '',
          album: 'Behind The Mic',
          category: 'BTS Shorts',
          type: 'VIDEO',
        });
        fetchGallery();
      }
    } catch (err: any) {
      console.error('Error uploading gallery item:', err);
      alert(err.response?.data?.message || 'Failed to publish media item. Please check the file and try again.');
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this media item?')) {
      try {
        await api.delete(`/gallery/${id}`);
        fetchGallery();
      } catch (err) {
        console.error('Error deleting gallery item:', err);
      }
    }
  }

  function resolveMediaUrl(url?: string) {
    if (!url) return 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80';
    if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
    return url;
  }

  const filteredItems = items.filter((item) => {
    const isVideo = item.type === 'VIDEO' || item.category === 'BTS Shorts' || (item.mediaUrl && item.mediaUrl.match(/\.(mp4|webm|mov|mkv)$/i));
    if (activeFilter === 'bts') return isVideo;
    if (activeFilter === 'photo') return !isVideo;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Camera className="w-6 h-6 text-indigo-400" />
            <span>Behind The Mic &amp; BTS Shorts Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage media gallery photos, video shorts, and studio operator bloopers shown on the public site
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Photo / Video Short</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Media ({items.length})
        </button>
        <button
          onClick={() => setActiveFilter('bts')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeFilter === 'bts'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>BTS Shorts &amp; Bloopers</span>
        </button>
        <button
          onClick={() => setActiveFilter('photo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeFilter === 'photo'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Photos</span>
        </button>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-surface/50 border border-border rounded-xl">
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No media items found in this section</p>
          <p className="text-xs text-slate-500 mt-1">Click &quot;Add Photo / Video Short&quot; to upload new media.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isVideo = item.type === 'VIDEO' || item.category === 'BTS Shorts' || (item.mediaUrl && item.mediaUrl.match(/\.(mp4|webm|mov|mkv)$/i));
            const displayImg = resolveMediaUrl(item.thumbnail || item.mediaUrl);

            return (
              <div key={item.id} className="group relative bg-surface border border-border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={displayImg}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center space-x-1">
                    <span className="bg-black/70 backdrop-blur-sm text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                      {isVideo ? <Video className="w-3 h-3 text-emerald-400" /> : <Camera className="w-3 h-3 text-indigo-400" />}
                      {isVideo ? 'BTS Video Short' : 'Photo'}
                    </span>
                  </div>

                  {item.duration && (
                    <span className="absolute top-2 right-2 bg-indigo-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {item.duration}
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                    title="Delete media"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-900/60 border-t border-border flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">
                      {item.category || item.album}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate" title={item.title}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Media Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>Add Media to Behind The Mic</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Media Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Media Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: 'VIDEO',
                        category: 'BTS Shorts',
                        album: 'Behind The Mic',
                        duration: form.duration || '0:45 Shorts',
                      })
                    }
                    className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all cursor-pointer ${
                      form.type === 'VIDEO'
                        ? 'border-indigo-500 bg-indigo-600/10 text-white'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Video className={`w-5 h-5 ${form.type === 'VIDEO' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold">BTS Video Short</p>
                      <p className="text-[10px] opacity-75">Bloopers, studio clips, MP4 video</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: 'PHOTO',
                        category: 'Photos',
                        album: 'Behind The Mic',
                        duration: '',
                      })
                    }
                    className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all cursor-pointer ${
                      form.type === 'PHOTO'
                        ? 'border-indigo-500 bg-indigo-600/10 text-white'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Camera className={`w-5 h-5 ${form.type === 'PHOTO' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold">Studio Photo</p>
                      <p className="text-[10px] opacity-75">High-res photos &amp; booth gear</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder={
                    form.type === 'VIDEO'
                      ? 'e.g. Studio Operator Bloopers & Mixing Console Secret Tips'
                      : 'e.g. Live Radio Broadcast Booth Setup'
                  }
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Subtitle</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of this blooper or studio photo"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Duration (For Video) */}
              {form.type === 'VIDEO' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Video Duration Tag</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 0:45 Shorts, 1:15 Shorts"
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Media File Upload */}
              <ImageUpload
                label={form.type === 'VIDEO' ? 'Video File Upload / MP4' : 'Photo Upload'}
                value={form.mediaUrl}
                onChange={(url) => setForm({ ...form, mediaUrl: url })}
                fileType={form.type === 'VIDEO' ? 'video' : 'image'}
                placeholder={
                  form.type === 'VIDEO'
                    ? 'Click to upload video short (MP4, WEBM)'
                    : 'Click to upload photo image'
                }
              />

              {/* Direct Media URL Input Option */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Or enter Direct Media URL (MP4 / Image / Unsplash URL)
                </label>
                <input
                  type="text"
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Optional Thumbnail URL for Video */}
              {form.type === 'VIDEO' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom Video Thumbnail Cover Image (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.thumbnail}
                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                    placeholder="https://images.unsplash.com/... or upload path"
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Album & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Section Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BTS Shorts">BTS Shorts</option>
                    <option value="Studio Bloopers">Studio Bloopers</option>
                    <option value="Photos">Photos</option>
                    <option value="Behind The Mic">Behind The Mic</option>
                    <option value="Events">Events</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Album Name</label>
                  <input
                    type="text"
                    value={form.album}
                    onChange={(e) => setForm({ ...form, album: e.target.value })}
                    required
                    placeholder="Behind The Mic"
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 cursor-pointer shadow-md flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Media</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
