'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Radio,
  Eye,
  Mic,
  Music,
  CalendarDays,
  Newspaper,
  UserCheck,
  HardDrive,
  Play,
  Square,
  TrendingUp,
  Download,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DashboardHome() {
  const [stats, setStats] = useState<any>(null);
  const [liveState, setLiveState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [statsResult, liveResult] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/live'),
      ]);

      if (statsResult.status === 'fulfilled' && statsResult.value.data.success) {
        setStats(statsResult.value.data.data);
      }

      if (liveResult.status === 'fulfilled' && liveResult.value.data.success) {
        setLiveState(liveResult.value.data.data);
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

  async function toggleLiveBroadcast() {
    try {
      const res = await api.post('/live/toggle');
      if (res.data.success) {
        setLiveState(res.data.data);
        loadData();
      }
    } catch (err) {
      alert('Failed to toggle live state');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const counters = stats?.counters || {};

  const kpis = [
    { label: 'Total Users', value: counters.totalUsers || 0, icon: Users, color: 'from-blue-500 to-indigo-600' },
    { label: 'Live Listeners', value: liveState?.liveListeners || 42, icon: Radio, color: 'from-emerald-500 to-teal-600' },
    { label: "Today's Visitors", value: counters.todaysVisitors || 1480, icon: Eye, color: 'from-purple-500 to-pink-600' },
    { label: 'Podcasts', value: counters.totalPodcasts || 0, icon: Mic, color: 'from-amber-500 to-orange-600' },
    { label: 'Programs', value: counters.totalPrograms || 0, icon: Music, color: 'from-cyan-500 to-blue-600' },
    { label: 'Upcoming Events', value: counters.totalEvents || 0, icon: CalendarDays, color: 'from-rose-500 to-red-600' },
    { label: 'Published News', value: counters.totalNews || 0, icon: Newspaper, color: 'from-violet-500 to-purple-600' },
    { label: 'Active RJs', value: counters.totalRJs || 0, icon: UserCheck, color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-400">Welcome to Radio Ninada Master Control Room</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono">Storage Used: {counters.storageUsedMB || 482.5} MB / 10 GB</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-all shadow-sm"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-2xl font-extrabold text-white mt-1">{kpi.value.toLocaleString()}</h3>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Controller Widget & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Controller Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Broadcast Control</span>
              <span
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                  liveState?.isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {liveState?.isLive ? 'BROADCASTING LIVE' : 'STREAM OFFLINE'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-border mb-4 space-y-2">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-500">Current Program</p>
                <p className="text-sm font-bold text-white truncate">{liveState?.currentProgram || 'Morning Beats'}</p>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Host RJ: <strong className="text-indigo-400">{liveState?.currentRJ || 'RJ Ananya'}</strong></span>
                <span className="text-slate-400">Bitrate: <strong className="text-slate-200">{liveState?.bitrate || 320} kbps</strong></span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-500">Playing Now</p>
                <p className="text-xs text-slate-300 truncate">{liveState?.currentSong || 'Bengaluru Beat - Acoustic Sunrise'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={toggleLiveBroadcast}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
              liveState?.isLive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {liveState?.isLive ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>STOP LIVE BROADCAST</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>GO ON AIR LIVE NOW</span>
              </>
            )}
          </button>
        </div>

        {/* Popular Podcasts Card */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Popular Podcasts</h3>
            <span className="text-xs text-indigo-400 font-medium">Top Downloads</span>
          </div>

          <div className="space-y-3">
            {(stats?.popularPodcasts || []).map((podcast: any) => (
              <div key={podcast.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-border">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img
                    src={podcast.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80'}
                    alt={podcast.title}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{podcast.title}</p>
                    <span className="text-[10px] text-slate-400">{podcast.category}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-indigo-400">
                  <Download className="w-3.5 h-3.5" />
                  <span>{podcast.downloads}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log / Recent Activities */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Recent System Activity</h3>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {(stats?.recentActivities || []).map((act: any) => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-900/50 border border-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">{act.action}</span>
                  <span className="text-[10px] text-slate-500">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-300 text-xs truncate">Target: {act.targetResource}</p>
                <p className="text-[10px] text-slate-500 truncate">By: {act.userEmail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
