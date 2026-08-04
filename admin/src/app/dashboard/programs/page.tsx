'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, CheckCircle, AlertTriangle, Filter, Music } from 'lucide-react';
import { api } from '@/lib/api';
import ImageUpload from '@/components/common/ImageUpload';

export default function ProgramManager() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [warning, setWarning] = useState('');

  const [form, setForm] = useState({
    title: '',
    name: '',
    description: '',
    hostName: 'RJ Ananya',
    category: 'Music',
    duration: '60 min',
    language: 'Kannada',
    tags: 'music,morning',
    schedule: 'Mon - Fri @ 8:00 AM',
    thumbnail: '',
    featured: false,
    status: 'PUBLISHED',
  });

  async function fetchPrograms() {
    setLoading(true);
    try {
      const res = await api.get('/programs');
      if (res.data.success) {
        setPrograms(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrograms();
  }, []);

  function openCreateModal() {
    setEditId(null);
    setWarning('');
    setForm({
      title: '',
      name: '',
      description: '',
      hostName: 'RJ Ananya',
      category: 'Music',
      duration: '60 min',
      language: 'Kannada',
      tags: 'music,morning',
      schedule: 'Mon - Fri @ 8:00 AM',
      thumbnail: '',
      featured: false,
      status: 'PUBLISHED',
    });
    setModalOpen(true);
  }

  function openEditModal(program: any) {
    setEditId(program.id);
    setWarning('');
    setForm({
      title: program.title || program.name || '',
      name: program.name || program.title || '',
      description: program.description || '',
      hostName: program.hostName || 'RJ Ananya',
      category: program.category || 'Music',
      duration: program.duration || '60 min',
      language: program.language || 'Kannada',
      tags: program.tags || 'music',
      schedule: program.schedule || '',
      thumbnail: program.thumbnail || '',
      featured: program.featured || false,
      status: program.status || 'PUBLISHED',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWarning('');
    try {
      const payload = {
        ...form,
        title: form.title || form.name,
        name: form.name || form.title,
      };

      if (editId) {
        await api.put(`/programs/${editId}`, payload);
      } else {
        await api.post('/programs', payload);
      }
      setModalOpen(false);
      fetchPrograms();
    } catch (err: any) {
      setWarning(err.response?.data?.message || 'Unable to save program.');
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        await api.delete(`/programs/${id}`);
        fetchPrograms();
      } catch (err) {
        console.error(err);
      }
    }
  }

  const filteredPrograms = programs.filter((item: any) => {
    const titleText = item.title || item.name || '';
    const matchSearch = !search || `${titleText} ${item.hostName} ${item.category}`.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || item.category === category;
    return matchSearch && matchCategory;
  });

  function resolveImage(url?: string) {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
    return url;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Program Management</h1>
          <p className="text-xs text-slate-400">Create, edit, duplicate check, and schedule radio shows</p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Program</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface border border-border p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, RJ host, tag..."
            className="w-full bg-slate-900 border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-900 border border-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="Morning Show">Morning Show</option>
            <option value="Youth & Tech">Youth & Tech</option>
            <option value="Music">Music</option>
            <option value="Culture">Culture</option>
          </select>
        </div>
      </div>

      {/* Programs List Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Program Title</th>
                <th className="p-4">Host RJ</th>
                <th className="p-4">Category</th>
                <th className="p-4">Schedule</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-slate-300">
              {filteredPrograms.map((prog) => (
                <tr key={prog.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    <div className="flex items-center space-x-3">
                      {prog.thumbnail ? (
                        <img
                          src={resolveImage(prog.thumbnail)}
                          alt={prog.title || prog.name}
                          className="w-9 h-9 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-indigo-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white">{prog.title || prog.name}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-xs">{prog.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{prog.hostName}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-medium text-[11px]">
                      {prog.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{prog.schedule}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      {prog.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(prog)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prog.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Program Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">{editId ? 'Edit Program' : 'Add New Program'}</h3>

            {warning && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{warning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <ImageUpload
                label="Program Thumbnail Banner"
                value={form.thumbnail}
                onChange={(url) => setForm({ ...form, thumbnail: url })}
                placeholder="Click to upload program show poster"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Program Title</label>
                <input
                  type="text"
                  value={form.title || form.name}
                  onChange={(e) => setForm({ ...form, title: e.target.value, name: e.target.value })}
                  required
                  placeholder="e.g. Sunrise Melodies"
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
                  placeholder="Overview of show format and music genre"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Host RJ</label>
                  <input
                    type="text"
                    value={form.hostName}
                    onChange={(e) => setForm({ ...form, hostName: e.target.value })}
                    required
                    placeholder="e.g. RJ Marcus T"
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                    placeholder="e.g. Morning Show"
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 60 min"
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Schedule</label>
                  <input
                    type="text"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    placeholder="e.g. Mon - Fri @ 8:00 AM"
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  {editId ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

