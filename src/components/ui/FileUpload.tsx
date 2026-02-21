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
      <div className="w-full border-2 border-[var(--primary)] border-dashed rounded-xl p-4 sm:p-6 bg-orange-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon()}
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)] text-sm sm:text-base truncate">{selectedFile.name}</p>
              <p className="text-xs sm:text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-2.5 hover:bg-gray-100 rounded-full transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`w-full border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-[var(--primary)] bg-orange-50/50 scale-[1.01]'
            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-orange-50/30'
        }`}
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
            <p className="text-sm font-medium text-stone-600">Optimizing image...</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--primary)] mx-auto mb-3" />
            <p className="text-sm sm:text-base font-medium text-[var(--foreground)] mb-1">
              {t('drag_drop')}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-3">{t('or')}</p>
            <span className="text-[var(--primary)] font-medium hover:underline text-sm sm:text-base">
              {t('browse_files')}
            </span>
            <p className="text-xs text-gray-400 mt-3">
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
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
