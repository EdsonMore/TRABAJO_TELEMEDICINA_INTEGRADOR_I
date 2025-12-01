// components/ui/virtual-keyboard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface VirtualKeyboardProps {
  onInput: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  inputLength?: number;
}

/**
 * Teclado virtual bancario con caracteres aleatorios
 * Cambia cada vez que se abre para máxima seguridad (como Yape)
 */
export function VirtualKeyboard({
  onInput,
  onBackspace,
  onClear,
  inputLength = 0,
}: VirtualKeyboardProps) {
  const [keys, setKeys] = useState<string[]>([]);

  // Generar teclado aleatorio al montar y cada vez que se abre
  useEffect(() => {
    generateRandomKeyboard();
  }, []);

  const generateRandomKeyboard = useCallback(() => {
    const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    // Shuffle: Fisher-Yates algorithm
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    setKeys(shuffled);
  }, []);

  // Reorganizar teclado en grid 3x4 + botones especiales
  const gridKeys = [];
  for (let i = 0; i < keys.length; i += 3) {
    gridKeys.push(keys.slice(i, i + 3));
  }

  return (
    <div className="space-y-3">
      {/* Aviso de seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 flex items-center gap-2">
        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
        <span>🔒 Teclado seguro - Los números cambian en cada acceso</span>
      </div>

      {/* Grid de números */}
      <div className="grid grid-cols-3 gap-2">
        {gridKeys.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} className="contents">
            {row.map((num) => (
              <button
                key={num}
                onClick={() => onInput(num)}
                className="bg-white border-2 border-gray-300 rounded-lg py-3 font-bold text-lg 
                           hover:bg-blue-50 active:bg-blue-100 transition-colors
                           hover:border-blue-400 cursor-pointer"
              >
                {num}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Botones de control */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
        {/* Botón Borrar */}
        <button
          onClick={onBackspace}
          disabled={inputLength === 0}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg py-2 font-medium
                     transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
        >
          <X className="w-4 h-4" /> Borrar
        </button>

        {/* Botón Limpiar todo */}
        <button
          onClick={onClear}
          disabled={inputLength === 0}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white rounded-lg py-2 font-medium
                     transition-colors cursor-pointer text-sm"
        >
          Limpiar
        </button>

        {/* Botón Regenerar (cambiar números) */}
        <button
          onClick={generateRandomKeyboard}
          className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg py-2 font-medium
                     transition-colors cursor-pointer text-sm"
        >
          🔄 Cambiar
        </button>
      </div>
    </div>
  );
}
