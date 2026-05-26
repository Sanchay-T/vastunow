'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Shield, X, Compass } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import CompassSelector from '@/components/ui/CompassSelector';
import { track } from '@/lib/analytics/posthog';

export default function UploadCTA() {
  const { t } = useTranslation();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [direction, setDirection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompass, setShowCompass] = useState(false);

  // Open compass modal when file is selected
  useEffect(() => {
    if (file && !direction) {
      setShowCompass(true);
    }
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCompass) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showCompass]);

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

    const startedAt = Date.now();
    track('analyze_started', {
      source: 'landing',
      facing_direction: direction,
      file_size_kb: Math.round(file.size / 1024),
      file_type: file.type,
    });

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
        track('analyze_failed', {
          source: 'landing',
          status: res.status,
          error: data.error,
          duration_ms: Date.now() - startedAt,
        });
        setError(data.error || t('error_generic'));
        return;
      }

      track('analyze_completed', {
        source: 'landing',
        facing_direction: data.facing_direction,
        confidence: data.confidence,
        room_count: data.parsed_floorplan?.rooms?.length,
        duration_ms: Date.now() - startedAt,
      });

      sessionStorage.setItem('vastuData', JSON.stringify(data));
      router.push('/review');
    } catch (err) {
      track('analyze_failed', {
        source: 'landing',
        error: err instanceof Error ? err.message : 'unknown',
        duration_ms: Date.now() - startedAt,
      });
      setError(t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompassConfirm = () => {
    setShowCompass(false);
  };

  const isReady = file && direction;

  return (
    <>
      <div className="w-full">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl shadow-black/10"
          style={{
            background: 'linear-gradient(160deg, #6E1126 0%, #4a0c1a 40%, #1a0a20 70%, #283171 100%)',
          }}
        >
          {/* Card header */}
          <div className="relative px-5 sm:px-6 pt-6 pb-4">
            {/* Gold shimmer line */}
            <div
              className="absolute top-0 left-[10%] right-[10%] h-[1px]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(234,156,51,0.5), rgba(234,156,51,0.8), rgba(234,156,51,0.5), transparent)' }}
            />
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--gold)]/50" />
              <p className="text-[10px] text-[var(--gold)] tracking-[0.3em] uppercase font-semibold">
                Get Started
              </p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--gold)]/50" />
            </div>
            <h3
              className="text-white text-lg sm:text-xl font-bold text-center"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Free Vaastu Analysis
            </h3>
          </div>

          {/* Card body — white inset */}
          <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 rounded-xl bg-white p-4 sm:p-5">
            <FileUpload
              onFileSelect={setFile}
              selectedFile={file}
              onClear={() => { setFile(null); setDirection(''); }}
            />

            {/* Direction status — shows after compass selection */}
            {file && direction && (
              <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground)]">
                      Main door faces <span className="text-[var(--primary)]">{t(`directions.${direction}`)}</span>
                    </p>
                    <p className="text-[10px] text-[var(--foreground)]/50">Tap to change direction</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompass(true)}
                  className="text-[11px] font-semibold text-[var(--primary)] hover:text-[var(--primary-light)] px-2.5 py-1.5 rounded-md hover:bg-[var(--primary)]/5 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}

            {/* Prompt to set direction */}
            {file && !direction && (
              <button
                onClick={() => setShowCompass(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-[var(--primary)]/20 text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/3 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span className="text-sm font-medium">Set North Direction</span>
              </button>
            )}

            {error && (
              <p className="mt-4 text-sm text-[var(--coral)] bg-red-50/80 py-2.5 px-3 rounded-lg text-center border border-red-100">{error}</p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!isReady || loading}
              className={`w-full mt-5 flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-semibold text-base transition-all min-h-[52px] ${
                isReady && !loading
                  ? 'text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-[var(--border)] text-stone-400 cursor-not-allowed'
              }`}
              style={isReady && !loading ? {
                background: 'linear-gradient(135deg, #6E1126 0%, #4a0c1a 50%, #283171 100%)',
              } : undefined}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
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

          {/* Card footer — trust line */}
          <div className="px-5 sm:px-6 pb-4 pt-1 flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[var(--gold)]" />
            <p className="text-[11px] text-white/45">
              Your floor plan is analysed securely and never stored
            </p>
          </div>
        </div>
      </div>

      {/* Compass Modal */}
      {showCompass && file && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCompassConfirm}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #6E1126 0%, #4a0c1a 40%, #1a0a20 70%, #283171 100%)',
            }}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 px-5 pt-5 pb-3 flex items-center justify-between" style={{
              background: 'linear-gradient(160deg, #6E1126 0%, #4a0c1a 40%, #1a0a20 70%, #283171 100%)',
            }}>
              <div>
                <p className="text-[10px] text-[var(--gold)] tracking-[0.25em] uppercase font-semibold mb-0.5">
                  Step 2
                </p>
                <h3
                  className="text-white text-lg font-bold"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Set North Direction
                </h3>
              </div>
              <button
                onClick={handleCompassConfirm}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Compass content */}
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="rounded-xl bg-white overflow-hidden">
                <CompassSelector value={direction} onChange={setDirection} imageFile={file} />
              </div>
            </div>

            {/* Confirm button */}
            <div className="px-4 pb-5">
              <button
                onClick={handleCompassConfirm}
                disabled={!direction}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  direction
                    ? 'bg-[var(--gold)] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {direction ? `Confirm — Facing ${direction}` : 'Select a direction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
