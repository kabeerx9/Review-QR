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
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-700">{label}</p>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeValue;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              aria-label={`${label} rating ${star}`}
              className="h-11 w-11 rounded-lg text-2xl transition disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
            >
              <span className={filled ? "text-amber-500" : "text-zinc-300"}>★</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
