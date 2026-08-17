'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export interface PasswordScore {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  barColor: string;
}

export function getPasswordScore(password: string): PasswordScore {
  if (!password) {
    return { score: 0, label: '', color: '', barColor: 'bg-gray-200 dark:bg-gray-700' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normalise to 1-4
  const normalised = Math.min(4, Math.max(1, Math.ceil(score / 1.25))) as 1 | 2 | 3 | 4;

  const map: Record<1 | 2 | 3 | 4, Omit<PasswordScore, 'score'>> = {
    1: { label: 'Weak', color: 'text-red-500 dark:text-red-400', barColor: 'bg-red-500' },
    2: { label: 'Fair', color: 'text-orange-500 dark:text-orange-400', barColor: 'bg-orange-500' },
    3: { label: 'Good', color: 'text-yellow-500 dark:text-yellow-400', barColor: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'text-green-500 dark:text-green-400', barColor: 'bg-green-500' },
  };

  return { score: normalised, ...map[normalised] };
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const result = useMemo(() => getPasswordScore(password), [password]);

  if (!password) return null;

  return (
    <div className={cn('mt-2 space-y-1.5', className)}>
      {/* Segmented bar */}
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((seg) => (
          <div
            key={seg}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              seg <= result.score ? result.barColor : 'bg-gray-200 dark:bg-gray-700',
            )}
          />
        ))}
      </div>
      {/* Label */}
      <p className={cn('text-xs font-medium transition-colors duration-200', result.color)}>
        {result.label} password
      </p>
    </div>
  );
}
