'use client';

import { useTranslation } from 'react-i18next';

interface EntranceConfirmProps {
  direction: string;
  side: string;
  confirmed: boolean;
  onConfirm: (confirmed: boolean) => void;
}

export default function EntranceConfirm({ direction, side, confirmed, onConfirm }: EntranceConfirmProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-3.5 sm:px-4 mb-4 bg-white rounded-lg border border-stone-200">
      <div className="min-w-0">
        <p className="text-sm text-stone-700">
          {t('entrance_confirm')}
        </p>
        <p className="text-xs text-stone-400 mt-0.5">
          Detected: <span className="font-medium text-stone-600">{direction}</span> ({side} side)
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onConfirm(true)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium min-h-[36px] ${
            confirmed
              ? 'bg-green-600 text-white'
              : 'bg-stone-100 text-stone-500'
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onConfirm(false)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium min-h-[36px] ${
            !confirmed
              ? 'bg-red-600 text-white'
              : 'bg-stone-100 text-stone-500'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}
