'use client';

import { Check } from 'lucide-react';

interface ProgressStepperProps {
  currentStep: 1 | 2 | 3;
}

const steps = ['Upload', 'Review', 'Report'];

export default function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto px-2">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isPending = stepNum > currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center min-w-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors flex-shrink-0 ${
                  isCompleted
                    ? 'bg-[#6E1126] text-white'
                    : isActive
                    ? 'bg-[#6E1126] text-white ring-4 ring-[#6E1126]/20'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : stepNum}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-1 sm:mt-1.5 font-medium truncate max-w-[60px] text-center ${
                  isPending ? 'text-gray-400' : 'text-[#283171]'
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-1.5 sm:mx-2 mb-5">
                <div
                  className={`h-full rounded-full transition-colors ${
                    stepNum < currentStep ? 'bg-[#6E1126]' : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
