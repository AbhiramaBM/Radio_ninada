'use client';

import React, { useEffect, useState } from 'react';
import { Handshake, Plus, Trash2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import ImageUpload from '@/components/common/ImageUpload';

export default function SponsorsManager() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);

  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    logoUrl: '',
    website: '',
    campaign: 'Title Partner',
  });

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get('/sponsors');
      if (res.data.success) setSponsors(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateSponsor(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/sponsors', sponsorForm);
      setSponsorModalOpen(false);
      setSponsorForm({ name: '', logoUrl: '', website: '', campaign: 'Title Partner' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteSponsor(id: string) {
    if (confirm('Delete sponsor partner?')) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Handshake className="w-6 h-6 text-indigo-400" />
            <span>Brand Sponsors &amp; Title Partners</span>
          </h1>
          <p className="text-xs text-slate-400">Manage station sponsors, promotional partners, ad impressions, and click analytics</p>
        </div>

        <button
          onClick={() => setSponsorModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand Sponsor</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : sponsors.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center text-slate-400 italic text-sm">
          No brand sponsors registered yet. Click &quot;Add Brand Sponsor&quot; to add station partners.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl bg-surface border border-border space-y-4 shadow-sm hover:border-slate-700 transition-all">
              <div className="flex items-center space-x-3">
                <img src={resolveUrl(s.logoUrl) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=100&q=80'} alt={s.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                <div className="overflow-hidden">
                  <h4 className="font-bold text-white text-sm truncate">{s.name}</h4>
                  <span className="text-xs text-indigo-400 font-medium truncate block">{s.campaign}</span>
                </div>
              </div>

              {s.website && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-400 hover:text-indigo-400 flex items-center space-x-1 truncate"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate">{s.website}</span>
                </a>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-border">
                <span>Clicks: <strong className="text-indigo-400 font-bold">{s.clicks || 0}</strong></span>
                <span>Views: <strong className="text-slate-200 font-bold">{s.views || 0}</strong></span>
                <button
                  onClick={() => handleDeleteSponsor(s.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete sponsor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sponsor Creation Modal */}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign / Partnership Type</label>
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
