'use client';

import React, { useEffect, useState } from 'react';
import { RadioTower, Play, Square, Save, Activity, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

export default function LiveRadioManager() {
  const [liveState, setLiveState] = useState<any>(null);
  const [form, setForm] = useState({
    streamUrl: '',
    title: '',
    currentProgram: '',
    currentRJ: '',
    currentSong: '',
    bitrate: 320,
    quality: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function fetchLiveState() {
    try {
      const res = await api.get('/live');
      if (res.data.success) {
        setLiveState(res.data.data);
        setForm({
          streamUrl: res.data.data.streamUrl,
          title: res.data.data.title,
          currentProgram: res.data.data.currentProgram,
          currentRJ: res.data.data.currentRJ,
          currentSong: res.data.data.currentSong,
          bitrate: res.data.data.bitrate,
          quality: res.data.data.quality,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLiveState();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/live', form);
      if (res.data.success) {
        setLiveState(res.data.data);
        setMessage('Live Broadcast configuration updated successfully!');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error updating live settings');
    } finally {
      setSaving(false);
    }
  }

  async function toggleLive() {
    try {
      const res = await api.post('/live/toggle');
      if (res.data.success) {
        setLiveState(res.data.data);
        setMessage(`Stream is now ${res.data.data.isLive ? 'LIVE ON AIR' : 'OFF AIR'}`);
      }
    } catch (err) {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Radio Management</h1>
          <p className="text-xs text-slate-400">Control live streaming, current program, RJ host, and audio bitrate</p>
        </div>

        <button
          onClick={toggleLive}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-lg ${
            liveState?.isLive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
          }`}
        >
          {liveState?.isLive ? (
            <>
              <Square className="w-4 h-4 fill-white" />
              <span>STOP LIVE STREAM</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>GO LIVE NOW</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Stream Form */}
      <form onSubmit={handleUpdate} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Stream Broadcast URL</label>
            <input
              type="url"
              value={form.streamUrl}
              onChange={(e) => setForm({ ...form, streamUrl: e.target.value })}
              required
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Stream Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Program Name</label>
            <input
              type="text"
              value={form.currentProgram}
              onChange={(e) => setForm({ ...form, currentProgram: e.target.value })}
              required
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current On-Air RJ Host</label>
            <input
              type="text"
              value={form.currentRJ}
              onChange={(e) => setForm({ ...form, currentRJ: e.target.value })}
              required
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Now Playing Song / Segment</label>
            <input
              type="text"
              value={form.currentSong}
              onChange={(e) => setForm({ ...form, currentSong: e.target.value })}
              required
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Stream Quality Presets</label>
            <input
              type="text"
              value={form.quality}
              onChange={(e) => setForm({ ...form, quality: e.target.value })}
              required
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Live Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
