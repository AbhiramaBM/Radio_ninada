'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Download, QrCode, Trash2, Users, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

export default function EventManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: 'Radio Ninada Main Studio Auditorium',
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    banner: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    registrationRequired: true,
  });

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await api.get('/events');
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/events', form);
      setModalOpen(false);
      fetchEvents();
    } catch (err) {}
  }

  async function handleDelete(id: string) {
    if (confirm('Delete event?')) {
      await api.delete(`/events/${id}`);
      fetchEvents();
    }
  }

  function downloadCSV(eventId: string, slug: string) {
    window.open(`http://localhost:5000/api/events/${eventId}/export-csv`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Event & Ticket Management</h1>
          <p className="text-xs text-slate-400">Manage community concerts, participant registrations, and export CSV lists</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((evt) => (
            <div key={evt.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="flex space-x-4">
                <img
                  src={evt.banner || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80'}
                  alt={evt.title}
                  className="w-24 h-24 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] font-bold text-indigo-400 font-mono">
                    {new Date(evt.eventDate).toLocaleDateString()} @ {new Date(evt.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <h3 className="font-bold text-white text-sm truncate mt-0.5">{evt.title}</h3>
                  <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                <div className="flex items-center space-x-1 text-slate-300">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold">{evt.participantsCount || evt._count?.participants || 0} Registered</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadCSV(evt.id, evt.slug)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => handleDelete(evt.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Schedule New Event</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
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
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Venue</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
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
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
