"use client";

import { useMemo, useState } from "react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

export default function StarRating({ value, onChange, label, disabled }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const activeValue = useMemo(() => (hovered > 0 ? hovered : value), [hovered, value]);

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-[var(--text-secondary)] min-w-[100px]">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeValue;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              aria-label={`${label} rating ${star}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: filled ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
                boxShadow: filled ? '0 0 16px rgba(245, 158, 11, 0.15)' : 'none',
                transform: filled ? 'scale(1.08)' : 'scale(1)',
              }}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
            >
              <span style={{ color: filled ? '#fbbf24' : 'rgba(107,114,128,0.4)', transition: 'color 0.15s ease' }}>★</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
