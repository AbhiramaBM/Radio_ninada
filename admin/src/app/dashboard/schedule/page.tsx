'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [warning, setWarning] = useState('');

  const [form, setForm] = useState({
    programId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:00',
    isRecurring: true,
    isSpecial: false,
    holidayName: '',
  });

  async function loadData() {
    setLoading(true);
    try {
      const [schedRes, progRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/programs'),
      ]);
      if (schedRes.data.success) setSchedules(schedRes.data.data);
      if (progRes.data.success) {
        setPrograms(progRes.data.data);
        if (progRes.data.data.length > 0) {
          setForm((f) => ({ ...f, programId: progRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWarning('');
    try {
      const res = await api.post('/schedule', form);
      if (res.data.success) {
        setModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setWarning(err.response.data.message);
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Remove this program time slot?')) {
      await api.delete(`/schedule/${id}`);
      loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Weekly Broadcast Schedule Planner</h1>
          <p className="text-xs text-slate-400">Manage time slots, recurring weekly programs, and conflict detection</p>
        </div>

        <button
          onClick={() => { setWarning(''); setModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Time Slot</span>
        </button>
      </div>

      {/* Weekly Schedule Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysOfWeek.map((dayName, dayIndex) => {
          const daySlots = schedules.filter((s) => s.dayOfWeek === dayIndex);
          return (
            <div key={dayName} className="bg-surface border border-border rounded-xl p-3 flex flex-col min-h-[300px]">
              <div className="border-b border-border pb-2 mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-white">{dayName}</span>
                <span className="text-[10px] text-slate-500 font-mono">{daySlots.length} Slots</span>
              </div>

              <div className="space-y-2 flex-1">
                {daySlots.map((slot) => (
                  <div key={slot.id} className="p-2.5 rounded-lg bg-slate-900 border border-border space-y-1 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{slot.program?.name || 'Program'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{slot.program?.hostName}</p>
                  </div>
                ))}
                {daySlots.length === 0 && (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-600 italic">
                    No shows scheduled
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Schedule Time Slot</h3>

            {warning && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{warning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Program</label>
                <select
                  value={form.programId}
                  onChange={(e) => setForm({ ...form, programId: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.hostName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Day of Week</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {daysOfWeek.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  Save Time Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
