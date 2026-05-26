'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import FileUpload from '@/components/ui/FileUpload';
import Button from '@/components/ui/Button';
import CompassSelector from '@/components/ui/CompassSelector';
import { track } from '@/lib/analytics/posthog';

export default function UploadZone() {
  const { t } = useTranslation();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [direction, setDirection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!file || !direction) return;
    setLoading(true);
    setError(null);

    const startedAt = Date.now();
    track('analyze_started', {
      source: 'analyze_page',
      facing_direction: direction,
      file_size_kb: Math.round(file.size / 1024),
      file_type: file.type,
    });

    try {
      const formData = new FormData();
      formData.append('floorplan', file);
      formData.append('facing', direction);

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        track('analyze_failed', {
          source: 'analyze_page',
          status: res.status,
          error: data.error,
          duration_ms: Date.now() - startedAt,
        });
        setError(data.error || t('error_generic'));
        return;
      }

      track('analyze_completed', {
        source: 'analyze_page',
        facing_direction: data.facing_direction,
        confidence: data.confidence,
        room_count: data.parsed_floorplan?.rooms?.length,
        duration_ms: Date.now() - startedAt,
      });

      sessionStorage.setItem('vastuData', JSON.stringify(data));
      router.push('/review');
    } catch (err) {
      track('analyze_failed', {
        source: 'analyze_page',
        error: err instanceof Error ? err.message : 'unknown',
        duration_ms: Date.now() - startedAt,
      });
      setError(t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-0">
      <FileUpload
        onFileSelect={setFile}
        selectedFile={file}
        onClear={() => setFile(null)}
      />

      {file && (
        <div className="mt-6">
          <CompassSelector value={direction} onChange={setDirection} imageFile={file} />
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <Button
        size="lg"
        className="w-full mt-6"
        onClick={handleAnalyze}
        disabled={!file || !direction}
        loading={loading}
      >
        {loading ? t('analyzing') : t('analyze_button')}
      </Button>
    </div>
  );
}
