'use client';

import React, { useEffect, useState } from 'react';
import { Mic, Download, Plus, Trash2, Play, AlertTriangle, Upload, Link } from 'lucide-react';
import { api } from '@/lib/api';
import ImageUpload from '@/components/common/ImageUpload';

export default function PodcastManager() {
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Talk Show',
    season: 1,
    episodeNumber: 1,
    duration: '35:00',
    audioUrl: '',
    coverUrl: '',
    featured: false,
    visibility: 'PUBLIC',
  });

  async function fetchPodcasts() {
    setLoading(true);
    try {
      const res = await api.get('/podcasts');
      if (res.data.success) {
        setPodcasts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPodcasts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWarning('');
    if (!form.audioUrl) {
      setWarning('Please upload an audio file or provide an audio URL.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/podcasts', form);
      setModalOpen(false);
      setForm({
        title: '',
        description: '',
        category: 'Talk Show',
        season: 1,
        episodeNumber: 1,
        duration: '35:00',
        audioUrl: '',
        coverUrl: '',
        featured: false,
        visibility: 'PUBLIC',
      });
      fetchPodcasts();
    } catch (err: any) {
      setWarning(err.response?.data?.message || 'Error publishing podcast session.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this recorded session / podcast episode?')) {
      try {
        await api.delete(`/podcasts/${id}`);
        fetchPodcasts();
      } catch (err) {
        console.error(err);
      }
    }
  }

  function resolveMediaUrl(url?: string) {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
    return url;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Recorded Sessions & Podcast Manager</h1>
          <p className="text-xs text-slate-400">Upload recorded radio shows, audio episodes, or connect external stream servers</p>
        </div>

        <button
          onClick={() => { setWarning(''); setModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Recorded Session</span>
        </button>
      </div>

      {/* Audio Player Drawer */}
      {playingUrl && (
        <div className="bg-indigo-900/30 border border-indigo-500/40 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-300 flex items-center space-x-2">
            <Mic className="w-4 h-4 text-indigo-400" />
            <span>Playing Recorded Audio Session Preview</span>
          </span>
          <audio controls autoPlay src={resolveMediaUrl(playingUrl)} className="h-8" />
        </div>
      )}

      {/* Podcast Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {podcasts.map((pod) => (
            <div key={pod.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-start space-x-3">
                <img
                  src={resolveMediaUrl(pod.coverUrl) || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'}
                  alt={pod.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    S{pod.season || 1} E{pod.episodeNumber || 1} • {pod.category}
                  </span>
                  <h3 className="font-bold text-white text-sm truncate mt-0.5">{pod.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{pod.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <div className="flex items-center space-x-3 text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{pod.downloads || 0}</span>
                  </span>
                  <span>{pod.duration || '30:00'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPlayingUrl(pod.audioUrl)}
                    className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                    title="Play Audio"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pod.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Episode"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Upload Recorded Session</h3>

            {warning && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{warning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session / Episode Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Evening Chill Session - Live Broadcast"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={2}
                  placeholder="Details about this recorded session or show..."
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Audio File Upload */}
              <ImageUpload
                label="Audio Recording File (.mp3, .wav, .aac, .m4a)"
                accept="audio/*"
                fileType="audio"
                value={form.audioUrl}
                onChange={(url) => setForm({ ...form, audioUrl: url })}
                placeholder="Click or drop audio recording file here"
              />

              {/* Cover Artwork Image Upload */}
              <ImageUpload
                label="Cover Artwork Image"
                accept="image/*"
                fileType="image"
                value={form.coverUrl}
                onChange={(url) => setForm({ ...form, coverUrl: url })}
                placeholder="Click or drop podcast cover photo"
              />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Season #</label>
                  <input
                    type="number"
                    value={form.season}
                    onChange={(e) => setForm({ ...form, season: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Episode #</label>
                  <input
                    type="number"
                    value={form.episodeNumber}
                    onChange={(e) => setForm({ ...form, episodeNumber: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 cursor-pointer shadow-md"
                >
                  {submitting ? (
                    <span>Publishing...</span>
                  ) : (
                    <span>Publish Recording</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

