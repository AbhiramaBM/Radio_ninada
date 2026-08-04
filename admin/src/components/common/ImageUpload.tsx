'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Music, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type ImageUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  placeholder?: string;
  fileType?: 'image' | 'audio' | 'any';
};

export default function ImageUpload({
  value,
  onChange,
  accept = 'image/*',
  label = 'Upload Media File',
  placeholder = 'Click or drag & drop file to upload',
  fileType = 'image',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullUrl = value
    ? value.startsWith('/uploads/')
      ? `http://localhost:5000${value}`
      : value
    : '';

  async function handleFileSelect(file: File) {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data && res.data.success && res.data.data?.url) {
        onChange(res.data.data.url);
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload file to server.');
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  function handleRemove() {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-slate-300">{label}</label>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-xl border border-indigo-500/40 bg-slate-900/80 p-2 flex items-center justify-between group">
          {fileType === 'image' && fullUrl ? (
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src={fullUrl}
                alt="Uploaded media"
                className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Media Uploaded</span>
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[200px]" title={value}>
                  {value}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                {fileType === 'audio' ? <Music className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>File Ready</span>
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[200px]" title={value}>
                  {value}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <p className="text-xs text-indigo-300 font-semibold">Uploading to server storage...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1 space-y-1.5">
              <div className="w-9 h-9 rounded-full bg-indigo-600/15 text-indigo-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-200">{placeholder}</p>
              <p className="text-[10px] text-slate-400">
                {fileType === 'audio' ? 'MP3, WAV, AAC, M4A up to 50MB' : 'PNG, JPG, WEBP, GIF up to 10MB'}
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
}
