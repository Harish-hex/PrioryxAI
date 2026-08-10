'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle2, Loader2, CalendarCheck } from 'lucide-react';

export function TimetableUploader({ isPro, visionRemaining }: { isPro: boolean, visionRemaining: number | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg(null);
    setResult(null);

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File too large. Max 10 MB.");
      setStatus('error');
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);
      
      const res = await fetch("/api/schedule/timetable", { method: "POST", body: form });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Timetable Upload Non-JSON response:", text);
        setErrorMsg(`Upload failed: ${res.status} ${res.statusText}. Please try a smaller file.`);
        setStatus('error');
        return;
      }

      if (!res.ok) {
        setErrorMsg(data?.error || "Couldn't read class schedule. Try: a clearer photo, exporting as text PDF, or a Word document.");
        setStatus('error');
        return;
      }

      setResult(`Found ${data.entryCount} class slots`);
      setStatus('success');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Emit event to refresh feed/preview
      window.dispatchEvent(new CustomEvent('timetable_extracted', { detail: data.entries }));

    } catch (err) {
      setErrorMsg("Network error uploading document.");
      setStatus('error');
    }
  };

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
          disabled={!file || status === 'uploading'}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
        >
          {status === 'uploading' ? (
            <><Loader2 size={15} className="animate-spin" /> Extracting your timetable...</>
          ) : (
            <><CalendarCheck size={15} /> Extract Timetable</>
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
        </ul>
      </details>
    </div>
  );
}
