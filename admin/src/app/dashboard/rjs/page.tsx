'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Trash2, Edit, Award, Heart } from 'lucide-react';
import { api } from '@/lib/api';

export default function RJManager() {
  const [rjs, setRjs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    designation: 'Senior RJ Host',
    bio: '',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    achievements: 'Golden Mic Award 2025',
    status: 'ACTIVE',
  });

  async function fetchRJs() {
    setLoading(true);
    try {
      const res = await api.get('/rj');
      if (res.data.success) {
        setRjs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRJs();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/rj', form);
      setModalOpen(false);
      fetchRJs();
    } catch (err) {}
  }

  async function handleDelete(id: string) {
    if (confirm('Delete RJ profile?')) {
      await api.delete(`/rj/${id}`);
      fetchRJs();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RJ & Presenter Management</h1>
          <p className="text-xs text-slate-400">Manage station hosts, designations, follower counts, and achievements</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add RJ Host</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rjs.map((rj) => (
            <div key={rj.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={rj.photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'}
                  alt={rj.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/40"
                />
                <div>
                  <h3 className="font-bold text-white text-base">{rj.name}</h3>
                  <span className="text-xs text-indigo-400 font-semibold">{rj.designation}</span>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Heart className="w-3 h-3 text-pink-500" />
                      <span>{rj.followers?.toLocaleString() || 0} Followers</span>
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2">{rj.bio}</p>

              {rj.achievements && (
                <div className="p-2 rounded-lg bg-slate-900 border border-border text-[11px] text-amber-300 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span className="truncate">{rj.achievements}</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  onClick={() => handleDelete(rj.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create RJ Profile</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">RJ Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  required
                  rows={2}
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Achievements</label>
                <input
                  type="text"
                  value={form.achievements}
                  onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Save RJ Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
