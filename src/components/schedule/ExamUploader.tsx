'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle2, Loader2, CalendarCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Client-side image compression using Canvas API (no extra npm package)
async function compressImage(file: File, maxWidthPx = 1600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidthPx / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        0.6
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export function ExamUploader({ isPro, visionRemaining }: { isPro: boolean, visionRemaining: number | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('compressing');
    setErrorMsg(null);
    setResult(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus('error');
      setErrorMsg('Not signed in.');
      return;
    }

    try {
      // Step 1: Compress image client-side (bypasses Vercel 4.5MB body limit)
      let uploadBlob: Blob;
      if (file.type.startsWith('image/')) {
        uploadBlob = await compressImage(file, 1600);
      } else {
        uploadBlob = file;
      }

      // Step 2: Upload to Supabase Storage
      setStatus('uploading');
      const storagePath = `${user.id}/exam-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('schedules')
        .upload(storagePath, uploadBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError || !uploadData) {
        setStatus('error');
        setErrorMsg('Storage upload failed: ' + (uploadError?.message ?? 'unknown'));
        return;
      }

      // Step 3: Call processing API with only the storage path
      setStatus('processing');
      const res = await fetch('/api/schedule/process-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: uploadData.path, userId: user.id }),
      });

      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Exam Upload Non-JSON response:', text);
        setErrorMsg(`Upload failed: ${res.status} ${res.statusText}`);
        setStatus('error');
        return;
      }

      if (!res.ok) {
        setErrorMsg(data?.error || "No dates found. Make sure the image shows exam dates clearly, or try a Word/PDF version of your exam schedule.");
        setStatus('error');
        return;
      }

      setResult(`Found ${data.entryCount} exams and deadlines`);
      setStatus('success');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Emit event to refresh feed/preview
      window.dispatchEvent(new CustomEvent('exam_extracted', { detail: data.entries }));

    } catch (err: any) {
      setErrorMsg(err.message ?? 'Network error uploading document.');
      setStatus('error');
    }
  };

  const isLoading = status === 'compressing' || status === 'uploading' || status === 'processing';

  const loadingLabel =
    status === 'compressing' ? 'Compressing image...' :
    status === 'uploading' ? 'Uploading to storage...' :
    'Extracting exam schedule...';

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-white">
        {file ? (
          <FileText size={18} className="shrink-0 text-slate-500" />
        ) : (
          <Upload size={18} className="shrink-0 text-slate-400" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {file ? file.name : "Choose JPG, PNG, WebP, HEIC, PDF, or DOC — up to 10 MB"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setStatus('idle');
            setResult(null);
            setErrorMsg(null);
          }}
        />
      </label>

      {status === 'error' && errorMsg && (
        <p className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMsg}
        </p>
      )}
      
      {status === 'success' && result && (
        <p className="flex items-center gap-2 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={15} />
          {result}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
        >
          {isLoading ? (
            <><Loader2 size={15} className="animate-spin" /> {loadingLabel}</>
          ) : (
            <><CalendarCheck size={15} /> Extract Exam Schedule</>
          )}
        </button>
        {isPro && visionRemaining !== null && (
          <span className="text-xs font-medium text-emerald-600">
            {visionRemaining} uploads remaining today
          </span>
        )}
      </div>

      <details className="text-sm text-slate-500 group [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer font-medium hover:text-slate-700 flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform">▼</span> What works best?
        </summary>
        <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
          <li>Photos: make sure text is in focus and well-lit</li>
          <li>PDFs: text-based PDFs work best; scanned PDFs are also supported</li>
          <li>Word docs: export directly from your college portal if possible</li>
          <li>Large images are auto-compressed before upload</li>
        </ul>
      </details>
    </div>
  );
}
