// components/layout/bottom-navigation.tsx
"use client";

import { Home, User, Calendar, Pill, Package, FileText } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const tabs = [
    { id: "resumen", label: "Inicio", icon: Home },
    { id: "perfil", label: "Perfil", icon: User },
    { id: "citas", label: "Citas", icon: Calendar },
    { id: "recetas", label: "Recetas", icon: Pill },
    { id: "despacho", label: "Despacho", icon: Package },
    { id: "resultados", label: "Resultados", icon: FileText },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-6 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}
              />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
