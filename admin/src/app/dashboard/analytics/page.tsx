'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, Radio, Globe, Smartphone, Laptop } from 'lucide-react';
import { api } from '@/lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  function downloadCSVReport() {
    window.open('http://localhost:5000/api/analytics/export?format=csv', '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const weeklyData = stats?.weeklyTraffic || [];
  const deviceData = stats?.deviceBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Station Analytics & Executive Reports</h1>
          <p className="text-xs text-slate-400">Track listener growth, peak hours, device distribution, and export CSV reports</p>
        </div>

        <button
          onClick={downloadCSVReport}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics Report (CSV)</span>
        </button>
      </div>

      {/* Traffic Area Chart */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white tracking-wide">Weekly Traffic & Listener Trends</h3>
          <span className="text-xs text-indigo-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs last week</span>
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f293d', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="visitors" stroke="#ec4899" fillOpacity={1} fill="url(#colorVisitors)" />
              <Area type="monotone" dataKey="listeners" stroke="#6366f1" fillOpacity={1} fill="url(#colorListeners)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device & Geographical Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Device Access Breakdown</h3>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                  {deviceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f293d', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 text-xs mt-2">
            {deviceData.map((d: any, i: number) => (
              <div key={d.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-slate-300 font-semibold">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Peak Engagement Hours</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-border flex justify-between">
                <span className="text-slate-400">Morning Peak:</span>
                <strong className="text-indigo-400">8:00 AM - 10:00 AM (1,480 listeners)</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-border flex justify-between">
                <span className="text-slate-400">Evening Peak:</span>
                <strong className="text-pink-400">5:30 PM - 7:30 PM (1,950 listeners)</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-border flex justify-between">
                <span className="text-slate-400">Top Listener Region:</span>
                <strong className="text-emerald-400">Bengaluru Urban, Karnataka (78%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
