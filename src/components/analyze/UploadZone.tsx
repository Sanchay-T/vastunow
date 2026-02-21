'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import FileUpload from '@/components/ui/FileUpload';
import Button from '@/components/ui/Button';
import CompassSelector from '@/components/ui/CompassSelector';

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

    try {
      const formData = new FormData();
      formData.append('floorplan', file);
      formData.append('facing', direction);

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();

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
