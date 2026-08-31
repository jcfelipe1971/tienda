import React from "react";
import { Eye, Settings, Search, ShoppingBag, Store } from "lucide-react";
import { StoreSettings, StoreType } from "../types";
import { formatCategoryName } from "../utils";

interface StoreHeaderProps {
  settings: StoreSettings;
  currentTab: "store" | "admin";
  onTabChange: (tab: "store" | "admin") => void;
  activeStoreType: StoreType;
  activeCategory: string;
  onStoreTypeSelect: (type: StoreType) => void;
  onCategorySelect: (type: StoreType, category: string) => void;
  storeCategories: string[];
  marketCategories: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  settings,
  currentTab,
  onTabChange,
  activeStoreType,
  activeCategory,
  onStoreTypeSelect,
  onCategorySelect,
  storeCategories,
  marketCategories,
  searchQuery,
  onSearchChange,
}) => {
  const sections: { type: StoreType; label: string; icon: any; categories: string[] }[] = [
    { type: "tienda", label: "Tienda", icon: <ShoppingBag className="w-3.5 h-3.5" />, categories: storeCategories },
    { type: "mercado", label: settings.marketName || "Mercado", icon: <Store className="w-3.5 h-3.5" />, categories: marketCategories },
  ];
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-neutral-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white border border-neutral-800 shadow-md shadow-neutral-950/20 overflow-hidden group">
              <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent opacity-50" />
              <span className="font-serif text-base font-extrabold tracking-tighter text-amber-100/90 select-none group-hover:scale-105 transition-transform">A</span>
              <span className="text-[9px] text-amber-400/80 font-serif mx-0.5 select-none">&</span>
              <span className="font-serif text-base font-extrabold tracking-tighter text-amber-100/90 select-none group-hover:scale-105 transition-transform">J</span>
              <div className="absolute bottom-0.5 text-[7px] text-emerald-400 font-bold tracking-widest uppercase font-mono scale-90 opacity-90 select-none">
                Estilo
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black font-sans text-neutral-950 tracking-tight leading-none flex flex-wrap items-center gap-1.5">
                <span>Arnielys & Juank</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                  NUEVO ESTILO
                </span>
              </h1>
              <p className="text-xs font-mono text-neutral-500 mt-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Catálogo directo de whasapp a sus manos</span>
              </p>
            </div>
          </div>

          {/* Search bar & Admin switcher */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentTab === "store" && (
              <div className="relative flex-1 sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                />
              </div>
            )}

            <button
              onClick={() => onTabChange(currentTab === "store" ? "admin" : "store")}
              id="admin-toggle-btn"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentTab === "admin"
                  ? "bg-neutral-900 text-white shadow-md shadow-neutral-900/10 hover:bg-neutral-800"
                  : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              {currentTab === "store" ? (
                <>
                  <Settings className="w-4 h-4" />
                  <span>Panel del Dueño</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Ver Tienda</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sections + Categories (Only visible on Store view): Tienda row, Mercado row below */}
        {currentTab === "store" && (
          <div className="flex flex-col gap-2 pb-3 border-t border-neutral-50 pt-3">
            {sections.map((section) => {
              const isActiveSection = activeStoreType === section.type;
              return (
                <div key={section.type} className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => onStoreTypeSelect(section.type)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer ${
                      isActiveSection && activeCategory === "todos"
                        ? "bg-neutral-900 text-white shadow-xs font-bold"
                        : isActiveSection
                        ? "bg-neutral-800 text-white font-bold"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-medium"
                    }`}
                  >
                    {section.icon}
                    <span>{section.label}</span>
                  </button>

                  <span className="text-neutral-200 select-none">|</span>

                  {section.categories.map((cat) => {
                    const isActiveCat = isActiveSection && activeCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        onClick={() => onCategorySelect(section.type, cat)}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                          isActiveCat
                            ? "bg-neutral-900 text-white shadow-xs font-bold"
                            : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                        }`}
                      >
                        {formatCategoryName(cat)}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
