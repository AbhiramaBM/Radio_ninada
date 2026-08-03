'use client';

import React, { useEffect, useState } from 'react';
import { ImagePlus, Handshake, Plus, Trash2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

export default function BannersAndSponsorsManager() {
  const [banners, setBanners] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [banRes, sponRes] = await Promise.all([
        api.get('/banners'),
        api.get('/sponsors'),
      ]);
      if (banRes.data.success) setBanners(banRes.data.data);
      if (sponRes.data.success) setSponsors(sponRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDeleteBanner(id: string) {
    await api.delete(`/banners/${id}`);
    loadData();
  }

  async function handleDeleteSponsor(id: string) {
    await api.delete(`/sponsors/${id}`);
    loadData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Banners & Sponsor Ad Campaigns</h1>
        <p className="text-xs text-slate-400">Manage promo banners, homepage ads, brand sponsors, and click counts</p>
      </div>

      {/* Homepage Banners Section */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ImagePlus className="w-4 h-4 text-indigo-400" />
            <span>Active Site Banners</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="relative rounded-xl overflow-hidden border border-border bg-slate-900 group">
              <img src={b.imageUrl} alt={b.title} className="w-full h-36 object-cover" />
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">{b.type}</span>
                  <p className="text-xs font-bold text-white truncate">{b.title}</p>
                </div>
                <button
                  onClick={() => handleDeleteBanner(b.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Sponsors Section */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Handshake className="w-4 h-4 text-indigo-400" />
            <span>Brand Sponsors & Title Partners</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sponsors.map((s) => (
            <div key={s.id} className="p-4 rounded-xl bg-slate-900 border border-border space-y-3">
              <div className="flex items-center space-x-3">
                <img src={s.logoUrl} alt={s.name} className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <h4 className="font-bold text-white text-xs">{s.name}</h4>
                  <span className="text-[10px] text-slate-400">{s.campaign}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-border/60">
                <span>Clicks: <strong className="text-indigo-400">{s.clicks}</strong></span>
                <span>Views: <strong className="text-slate-200">{s.views}</strong></span>
                <button onClick={() => handleDeleteSponsor(s.id)} className="text-slate-500 hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
