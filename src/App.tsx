import React, { useState, useEffect } from "react";
import { StoreHeader } from "./components/StoreHeader";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ChatWidget } from "./components/ChatWidget";
import { Product, StoreSettings, ChatSession, VisitsData, StoreType, Tipo } from "./types";

const API_BASE = ""; // Mismo origen

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "Tienda",
    whatsappNumber: "",
    whatsappTemplate: "",
    aiAssistantEnabled: false,
    aiAssistantTone: "Amistoso",
  });
  const [tipos, setTipos] = useState<Tipo[]>([]); // ← TIPOS DESDE LA BD
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [visits, setVisits] = useState<VisitsData>({ totalVisits: 0, visitsToday: 0, visitsLog: [] });

  const [currentTab, setCurrentTab] = useState<"store" | "admin">("store");
  const [activeStoreType, setActiveStoreType] = useState<StoreType>("");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ============================================
  // CARGAR DATOS DESDE LA BD AL INICIO
  // ============================================
  const loadTipos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tipos`);
      const data = await res.json();
      setTipos(data);
      // Si es la primera vez, seleccionar el primer tipo
      if (data.length > 0 && !activeStoreType) {
        setActiveStoreType(data[0].nombre.toLowerCase());
      }
    } catch (err) {
      console.error("Error cargando tipos:", err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/productos`);
      setProducts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      setSettings(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadChats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chats`);
      setChats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadVisits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/visitas`);
      setVisits(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTipos();
    loadProducts();
    loadSettings();
    loadChats();
    loadVisits();
    // Registrar visita
    fetch(`${API_BASE}/api/visitas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAgent: navigator.userAgent }),
    }).catch(() => {});
  }, []);

  // ============================================
  // LÓGICA DE FILTRADO DINÁMICA
  // ============================================
  const handleStoreTypeSelect = (type: StoreType) => {
    setActiveStoreType(type);
    setActiveCategory("todos");
  };

  const handleCategorySelect = (type: StoreType, category: string) => {
    setActiveStoreType(type);
    setActiveCategory(category);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSection = product.storeType.toLowerCase() === activeStoreType.toLowerCase();
    const matchesCategory =
      activeCategory === "todos" ||
      product.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesCategory && matchesSearch;
  });

  // ============================================
  // HANDLERS PARA EL DASHBOARD
  // ============================================
  const handleSaveProduct = async (product: Product) => {
    await fetch(`${API_BASE}/api/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    await loadProducts();
    await loadTipos(); // Recargar por si cambió algo
  };

  const handleDeleteProduct = async (id: string) => {
    await fetch(`${API_BASE}/api/productos/${id}`, { method: "DELETE" });
    await loadProducts();
  };

  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    await fetch(`${API_BASE}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
    setSettings(newSettings);
  };

  const handleRefreshData = async () => {
    await Promise.all([loadProducts(), loadTipos(), loadSettings(), loadChats(), loadVisits()]);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <StoreHeader
        settings={settings}
        tipos={tipos} // ← Pasamos los tipos desde la BD
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeStoreType={activeStoreType}
        activeCategory={activeCategory}
        onStoreTypeSelect={handleStoreTypeSelect}
        onCategorySelect={handleCategorySelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {currentTab === "store" ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-neutral-400">
              No hay productos en esta categoría.
            </div>
          )}
        </main>
      ) : (
        <OwnerDashboard
          settings={settings}
          productos={products}
          tipos={tipos} // ← Pasamos los tipos al dashboard
          chats={chats}
          visits={visits}
          onUpdateSettings={handleUpdateSettings}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onRefreshData={handleRefreshData}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          settings={settings}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <ChatWidget settings={settings} products={products} />
    </div>
  );
}