'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, Image, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESS_THRESHOLD = 3 * 1024 * 1024; // Compress images above 3MB (Vercel body limit is 4.5MB)

// Compress image client-side using canvas to stay under Vercel body limits
function compressImage(file: File, maxWidth = 2000, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    // PDFs can't be compressed this way
    if (file.type === 'application/pdf') { resolve(file); return; }

    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round(h * (maxWidth / w));
        w = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          console.log(`[FILE_UPLOAD] Compressed ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressed.size / 1024 / 1024).toFixed(1)}MB (${w}x${h})`);
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

export default function FileUpload({ onFileSelect, selectedFile, onClear }: FileUploadProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or PDF file.');
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError('File size must be under 10MB.');
      return false;
    }
    setError(null);
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    // Compress large images to avoid Vercel 4.5MB body limit
    if (file.type !== 'application/pdf' && file.size > COMPRESS_THRESHOLD) {
      setCompressing(true);
      try {
        const compressed = await compressImage(file);
        setCompressing(false);
        onFileSelect(compressed);
      } catch {
        setCompressing(false);
        onFileSelect(file); // Fallback to original
      }
    } else {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [onFileSelect]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    if (selectedFile.type === 'application/pdf') return <FileText className="w-8 h-8 text-[var(--primary)]" />;
    return <Image className="w-8 h-8 text-[var(--primary)]" />;
  };

  if (selectedFile) {
    return (
      <div className="w-full rounded-xl p-4 sm:p-5 bg-[var(--primary)]/5 border border-[var(--primary)]/15">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-[var(--border)]">
              {getFileIcon()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">{selectedFile.name}</p>
              <p className="text-xs text-[var(--foreground)]/50">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-2.5 hover:bg-white rounded-full transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-[var(--foreground)]/40" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`w-full rounded-xl text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'scale-[1.01]'
            : ''
        }`}
        style={{
          background: dragActive
            ? 'linear-gradient(135deg, rgba(110,17,38,0.06) 0%, rgba(234,156,51,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(110,17,38,0.03) 0%, rgba(234,156,51,0.03) 100%)',
          border: dragActive
            ? '2px solid var(--primary)'
            : '2px dashed var(--border)',
          padding: '2rem 1.5rem',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {compressing ? (
          <>
            <svg className="w-8 h-8 text-[var(--primary)] mx-auto mb-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-medium text-[var(--foreground)]/60">Optimizing image...</p>
          </>
        ) : (
          <>
            {/* Upload icon */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))' }}
            >
              <Upload className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)] mb-0.5">
              {t('drag_drop')}
            </p>
            <p className="text-xs text-[var(--foreground)]/40 mb-3">{t('or')}</p>
            <span className="inline-block text-[var(--primary)] bg-white hover:bg-[var(--background)] font-medium px-5 py-2 rounded-lg text-sm transition-colors border border-[var(--primary)]/20 shadow-sm">
              {t('browse_files')}
            </span>
            <p className="text-[10px] text-[var(--foreground)]/30 mt-3">
              {t('accepted_formats')} &middot; {t('max_file_size')}
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleChange}
      />
      {error && (
        <p className="mt-2 text-sm text-[var(--coral)]">{error}</p>
      )}
    </div>
  );
}
