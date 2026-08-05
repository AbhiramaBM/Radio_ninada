'use client';

import React, { useEffect, useState } from 'react';
import { ImagePlus, Handshake, Plus, Trash2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import ImageUpload from '@/components/common/ImageUpload';

export default function BannersAndSponsorsManager() {
  const [banners, setBanners] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);

  const [bannerForm, setBannerForm] = useState({
    title: '',
    imageUrl: '',
    targetUrl: '',
    type: 'HERO',
  });

  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    logoUrl: '',
    website: '',
    campaign: 'Title Sponsor',
  });

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

  async function handleCreateBanner(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/banners', bannerForm);
      setBannerModalOpen(false);
      setBannerForm({ title: '', imageUrl: '', targetUrl: '', type: 'HERO' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateSponsor(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/sponsors', sponsorForm);
      setSponsorModalOpen(false);
      setSponsorForm({ name: '', logoUrl: '', website: '', campaign: 'Title Sponsor' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteBanner(id: string) {
    if (confirm('Delete banner?')) {
      await api.delete(`/banners/${id}`);
      loadData();
    }
  }

  async function handleDeleteSponsor(id: string) {
    if (confirm('Delete sponsor?')) {
      await api.delete(`/sponsors/${id}`);
      loadData();
    }
  }

  function resolveUrl(url?: string) {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
    return url;
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

          <button
            onClick={() => setBannerModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Banner</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="relative rounded-xl overflow-hidden border border-border bg-slate-900 group">
                <img src={resolveUrl(b.imageUrl)} alt={b.title} className="w-full h-36 object-cover" />
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">{b.type}</span>
                    <p className="text-xs font-bold text-white truncate">{b.title}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteBanner(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand Sponsors Section */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Handshake className="w-4 h-4 text-indigo-400" />
            <span>Brand Sponsors & Title Partners</span>
          </h3>

          <button
            onClick={() => setSponsorModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sponsor</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sponsors.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-900 border border-border space-y-3">
                <div className="flex items-center space-x-3">
                  <img src={resolveUrl(s.logoUrl)} alt={s.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white text-xs truncate">{s.name}</h4>
                    <span className="text-[10px] text-slate-400 truncate block">{s.campaign}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-border/60">
                  <span>Clicks: <strong className="text-indigo-400">{s.clicks || 0}</strong></span>
                  <span>Views: <strong className="text-slate-200">{s.views || 0}</strong></span>
                  <button
                    onClick={() => handleDeleteSponsor(s.id)}
                    className="text-slate-500 hover:text-rose-400 cursor-pointer"
                    title="Delete sponsor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner Modal */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Create Site Banner</h3>
            <form onSubmit={handleCreateBanner} className="space-y-3">
              <ImageUpload
                label="Banner Image"
                value={bannerForm.imageUrl}
                onChange={(url) => setBannerForm({ ...bannerForm, imageUrl: url })}
                placeholder="Click to upload banner image"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  required
                  placeholder="e.g. Annual Campus Fest Promo"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target URL (Optional)</label>
                <input
                  type="url"
                  value={bannerForm.targetUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, targetUrl: e.target.value })}
                  placeholder="https://radioninada.com/events"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 cursor-pointer shadow-md"
                >
                  Create Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sponsor Modal */}
      {sponsorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Add Brand Sponsor</h3>
            <form onSubmit={handleCreateSponsor} className="space-y-3">
              <ImageUpload
                label="Sponsor Brand Logo"
                value={sponsorForm.logoUrl}
                onChange={(url) => setSponsorForm({ ...sponsorForm, logoUrl: url })}
                placeholder="Click to upload brand logo"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                  required
                  placeholder="e.g. Acme Audio Labs"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Type</label>
                <input
                  type="text"
                  value={sponsorForm.campaign}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, campaign: e.target.value })}
                  required
                  placeholder="e.g. Title Partner / Studio Sponsor"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL</label>
                <input
                  type="url"
                  value={sponsorForm.website}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, website: e.target.value })}
                  placeholder="https://acmeaudio.com"
                  className="w-full bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSponsorModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 cursor-pointer shadow-md"
                >
                  Save Sponsor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

