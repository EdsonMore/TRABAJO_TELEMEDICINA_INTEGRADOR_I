// components/high-contrast-toggle.tsx
"use client";

import { Contrast, Eye } from "lucide-react";

interface HighContrastToggleProps {
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
}

export function HighContrastToggle({
  highContrast,
  setHighContrast,
}: HighContrastToggleProps) {
  return (
    <button
      onClick={() => setHighContrast(!highContrast)}
      className={`fixed bottom-8 right-8 z-50 p-5 rounded-2xl shadow-2xl border-4 transition-all ${
        highContrast
          ? "bg-yellow-400 text-gray-900 border-yellow-500 hover:bg-yellow-300"
          : "bg-blue-700 text-white border-blue-800 hover:bg-blue-800"
      }`}
      title="Modo alto contraste para mejor visibilidad"
      aria-label="Activar modo alto contraste"
    >
      <div className="flex items-center gap-3">
        <Eye className="w-7 h-7" />
        <span className="text-lg font-bold hidden sm:block">
          {highContrast ? "Contraste Alto" : "Contraste Normal"}
        </span>
      </div>
    </button>
  );
}
