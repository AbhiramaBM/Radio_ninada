'use client';

import React, { useEffect, useState } from 'react';
import { Mic, Download, Plus, Trash2, Play, AlertTriangle, Upload, Link } from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { getFirebaseDb, uploadFileToStorage } from '@/lib/firebase';

export default function PodcastManager() {
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

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

  useEffect(() => {
    const db = getFirebaseDb();
    const q = query(collection(db, 'podcasts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPodcasts(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as any[]);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWarning('');
    setSubmitting(true);

    try {
      let audioUrl = form.audioUrl;
      let coverUrl = form.coverUrl;

      if (sourceType === 'file' && audioFile) {
        audioUrl = await uploadFileToStorage(audioFile, 'podcasts/audio');
      }

      if (coverFile) {
        coverUrl = await uploadFileToStorage(coverFile, 'podcasts/covers');
      }

      const db = getFirebaseDb();
      await setDoc(doc(db, 'podcasts', crypto.randomUUID()), {
        title: form.title,
        description: form.description,
        category: form.category,
        season: form.season,
        episodeNumber: form.episodeNumber,
        duration: form.duration,
        audioUrl,
        coverUrl,
        featured: form.featured,
        visibility: form.visibility,
        downloads: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setModalOpen(false);
      setAudioFile(null);
      setCoverFile(null);
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
    } catch (err: any) {
      setWarning(err.message || 'Error uploading session. Please verify file format and size.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this recorded session / podcast episode?')) {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'podcasts', id));
    }
  }

  function resolveAudioUrl(url: string) {
    if (!url) return '';
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
          <audio controls autoPlay src={resolveAudioUrl(playingUrl)} className="h-8" />
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
                  src={resolveAudioUrl(pod.coverUrl) || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'}
                  alt={pod.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    S{pod.season} E{pod.episodeNumber} • {pod.category}
                  </span>
                  <h3 className="font-bold text-white text-sm truncate mt-0.5">{pod.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{pod.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <div className="flex items-center space-x-3 text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{pod.downloads}</span>
                  </span>
                  <span>{pod.duration}</span>
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
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Upload Recorded Session</h3>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setSourceType('file')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 ${
                    sourceType === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('url')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 ${
                    sourceType === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <Link className="w-3 h-3" />
                  <span>Server URL</span>
                </button>
              </div>
            </div>

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

              {/* Audio Source Input */}
              {sourceType === 'file' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Audio Recording File (.mp3, .wav, .aac, .m4a)</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    required
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">External Storage Server Audio URL</label>
                  <input
                    type="url"
                    value={form.audioUrl}
                    onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                    required
                    placeholder="https://your-storage-server.com/recordings/session.mp3"
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Cover Image Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Artwork Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

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
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 cursor-pointer"
                >
                  {submitting ? (
                    <span>Uploading...</span>
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
