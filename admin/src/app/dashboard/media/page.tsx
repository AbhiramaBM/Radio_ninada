'use client';

import React, { useEffect, useState } from 'react';
import { HardDrive, Upload, Music, Image as ImageIcon, FileText, Download, Copy, Check, Server, RefreshCw, Plus } from 'lucide-react';
import { api } from '@/lib/api';

export default function MediaStorageDumpManager() {
  const [dumpData, setDumpData] = useState<{ totalFiles: number; totalSizeMb: string; files: any[] }>({
    totalFiles: 0,
    totalSizeMb: '0.00',
    files: [],
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  async function fetchDumpData() {
    setLoading(true);
    try {
      const res = await api.get('/upload/dump');
      if (res.data.success) {
        setDumpData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDumpData();
    if (typeof window !== 'undefined' && window.location.search.includes('action=create')) {
      setModalOpen(true);
    }
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setMessage(`File "${selectedFile.name}" successfully uploaded & dumped on server storage!`);
        setSelectedFile(null);
        fetchDumpData();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error uploading file to storage server.');
    } finally {
      setUploading(false);
    }
  }

  function copyToClipboard(url: string) {
    const fullUrl = url.startsWith('/uploads/') ? `http://localhost:5000${url}` : url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(fullUrl);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Media Storage & Server Dump Manager</h1>
          <p className="text-xs text-slate-400">Direct file dump vault for podcasts, recorded sessions, news imagery, and audio files</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer border border-indigo-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Upload File to Vault</span>
          </button>

          <button
            onClick={fetchDumpData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-border"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Server Storage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Storage Used</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{dumpData.totalSizeMb} MB</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Uploaded Files</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{dumpData.totalFiles} Items</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Upload Limit</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">100 MB / file</h3>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Direct Dump Upload Box */}
      <form onSubmit={handleUpload} className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Upload className="w-4 h-4 text-indigo-400" />
          <span>Upload Media File to Server Dump</span>
        </h3>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-xs text-slate-300 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
          />

          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shrink-0 flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {uploading ? (
              <span>Uploading to Storage...</span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Dump File to Server</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* File Vault List */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white">Server Storage File Vault</h3>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : dumpData.files.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No files uploaded to the server storage dump yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {dumpData.files.map((file) => {
              const isAudio = file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.aac') || file.name.endsWith('.m4a');
              const isImage = file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.webp') || file.name.endsWith('.gif');

              return (
                <div key={file.name} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-border flex items-center justify-center shrink-0">
                      {isAudio ? (
                        <Music className="w-5 h-5 text-indigo-400" />
                      ) : isImage ? (
                        <ImageIcon className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{file.name}</h4>
                      <span className="text-[11px] text-slate-400">
                        {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(file.url)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-border text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      {copiedUrl === `http://localhost:5000${file.url}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Server URL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`http://localhost:5000${file.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                      title="Open / Download File"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-lg font-bold text-white">Upload File to Server Storage</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { handleUpload(e); setModalOpen(false); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Select Image, Audio, or Video File</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-900 border border-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {selectedFile && (
                <div className="p-3 rounded-xl bg-slate-900 border border-border text-xs text-slate-300">
                  <p className="font-semibold text-indigo-400">Selected File:</p>
                  <p className="truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500">{formatBytes(selectedFile.size)}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
