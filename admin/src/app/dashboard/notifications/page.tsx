'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, Send, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'ALL',
    sendImmediately: true,
  });

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/notifications', {
        title: form.title,
        message: form.message,
        type: 'PUSH',
        targetAudience: form.audience,
        status: form.sendImmediately ? 'SENT' : 'SCHEDULED',
      });
      setForm({ title: '', message: '', audience: 'ALL', sendImmediately: true });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this notification?')) {
      try {
        await api.delete(`/notifications/${id}`);
        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Push Notification Management</h1>
        <p className="text-xs text-slate-400">Broadcast immediate announcements or schedule push notifications for listeners</p>
      </div>

      {/* Composer Card */}
      <form onSubmit={handleSend} className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <BellRing className="w-4 h-4 text-indigo-400" />
          <span>Broadcast Notification Composer</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notification Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. 🔴 Live Special Acoustic Concert Starting Now!"
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notification Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={2}
              placeholder="Tune in to Radio Ninada for an exclusive interview with regional indie music stars."
              className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4 text-xs">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendImmediately}
                  onChange={(e) => setForm({ ...form, sendImmediately: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Send Immediately</span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Push</span>
            </button>
          </div>
        </div>
      </form>

      {/* History List */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Broadcast History & Queue</h3>

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No notifications broadcasted yet.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-slate-900/60 border border-border flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{n.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {n.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

