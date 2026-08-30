import React from "react";
import { Eye, Settings, Search } from "lucide-react";
import { StoreSettings, StoreType, Tipo } from "../types";
import { formatCategoryName, getIconForSection } from "../utils";

interface StoreHeaderProps {
  settings: StoreSettings;
  tipos: Tipo[]; // ← Viene de la BD
  currentTab: "store" | "admin";
  onTabChange: (tab: "store" | "admin") => void;
  activeStoreType: StoreType;
  activeCategory: string;
  onStoreTypeSelect: (type: StoreType) => void;
  onCategorySelect: (type: StoreType, category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  settings,
  tipos,
  currentTab,
  onTabChange,
  activeStoreType,
  activeCategory,
  onStoreTypeSelect,
  onCategorySelect,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-neutral-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
          {/* Logo */}
          <div>
            <h1 className="text-xl font-black text-neutral-950">{settings.storeName || "Tienda"}</h1>
            <p className="text-xs text-neutral-500">Catálogo dinámico desde MySQL</p>
          </div>

          {/* Buscador + Admin */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentTab === "store" && (
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm"
                />
              </div>
            )}
            <button
              onClick={() => onTabChange(currentTab === "store" ? "admin" : "store")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                currentTab === "admin"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-50 text-neutral-700 border border-neutral-200"
              }`}
            >
              {currentTab === "store" ? <><Settings className="w-4 h-4" />Panel</> : <><Eye className="w-4 h-4" />Ver Tienda</>}
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* SECCIONES DINÁMICAS DESDE LA BD */}
        {/* ============================================ */}
        {currentTab === "store" && (
          <div className="flex flex-col gap-2 pb-3 border-t border-neutral-50 pt-3">
            {tipos.map((tipo) => {
              const isActiveSection = activeStoreType.toLowerCase() === tipo.nombre.toLowerCase();
              const IconComponent = getIconForSection(tipo.nombre);

              return (
                <div key={tipo.id} className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {/* Botón del TIPO (Tienda, Mercado, Arte, etc.) */}
                  <button
                    onClick={() => onStoreTypeSelect(tipo.nombre.toLowerCase())}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                      isActiveSection && activeCategory === "todos"
                        ? "bg-neutral-900 text-white font-bold"
                        : isActiveSection
                        ? "bg-neutral-800 text-white font-bold"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tipo.nombre}</span>
                  </button>

                  <span className="text-neutral-200">|</span>

                  {/* Botones de las CATEGORÍAS de ese tipo */}
                  {tipo.categorias.map((cat) => {
                    const isActiveCat =
                      isActiveSection && activeCategory.toLowerCase() === cat.nombre.toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onCategorySelect(tipo.nombre.toLowerCase(), cat.nombre.toLowerCase())}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          isActiveCat
                            ? "bg-neutral-900 text-white font-bold"
                            : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                        }`}
                      >
                        {formatCategoryName(cat.nombre)}
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