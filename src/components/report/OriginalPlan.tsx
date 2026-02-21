'use client';

interface OriginalPlanProps {
  imageUrl: string;
}

export default function OriginalPlan({ imageUrl }: OriginalPlanProps) {
  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-3 sm:p-4">
      <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">Uploaded Floor Plan</h4>
      <img
        src={imageUrl}
        alt="Original floor plan"
        className="w-full rounded-lg object-contain max-h-[60vh]"
      />
    </div>
  );
}
