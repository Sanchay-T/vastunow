'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import CompassSelector from '@/components/ui/CompassSelector';

export default function UploadCTA() {
  const { t } = useTranslation();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [direction, setDirection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    console.log('[UPLOAD_CTA] handleAnalyze called', {
      hasFile: !!file,
      fileName: file?.name,
      direction,
      direction_length: direction.length,
      direction_charCodes: [...direction].map(c => c.charCodeAt(0)),
    });

    if (!file || !direction) {
      console.log('[UPLOAD_CTA] BLOCKED — missing', { hasFile: !!file, direction });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('floorplan', file);
      formData.append('facing', direction);

      console.log('[UPLOAD_CTA] Sending to /api/analyze', {
        facing_in_formdata: formData.get('facing'),
        file_in_formdata: (formData.get('floorplan') as File)?.name,
      });

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();

      console.log('[UPLOAD_CTA] Response from /api/analyze', {
        ok: res.ok,
        facing_in_response: data.facing_direction,
        confidence: data.confidence,
        roomCount: data.parsed_floorplan?.rooms?.length,
        error: data.error,
      });

      if (!res.ok) {
        setError(data.error || t('error_generic'));
        return;
      }

      sessionStorage.setItem('vastuData', JSON.stringify(data));
      router.push('/review');
    } catch {
      setError(t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const isReady = file && direction;

  return (
    <div className="w-full max-w-md mx-auto">
      <FileUpload
        onFileSelect={setFile}
        selectedFile={file}
        onClear={() => { setFile(null); setDirection(''); }}
      />

      {file && (
        <div className="mt-6">
          <CompassSelector value={direction} onChange={setDirection} imageFile={file} />
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50/80 py-2.5 px-3 rounded-lg text-center">{error}</p>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!isReady || loading}
        className={`w-full mt-6 flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg font-medium text-base transition-all min-h-[52px] ${
          isReady && !loading
            ? 'bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white shadow-sm hover:shadow-md'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{t('analyzing')}</span>
          </>
        ) : (
          <>
            <span>{t('analyze_button')}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
