import React, { useState, useEffect } from "react";
import { StoreHeader } from "./components/StoreHeader";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ChatWidget } from "./components/ChatWidget";
import { OwnerDashboard } from "./components/OwnerDashboard";
import {
  Product,
  StoreSettings,
  ChatSession,
  DatabaseSchema,
  StoreType,
  Categoria,
  Tipo,
} from "./types";
import { getCategoriesWithProducts, getProductCode, getNombreCategoria, getApiUrl } from "./utils";
import { ShoppingBag, Sparkles, ArrowRight, Lock, X } from "lucide-react";

export default function App() {
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<"store" | "admin">("store");
  const [activeStoreType, setActiveStoreType] = useState<StoreType>("tienda");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleStoreTypeSelect = (type: StoreType) => {
    setActiveStoreType(type);
    setActiveCategory("todos");
  };

  const handleCategorySelect = (type: StoreType, category: string) => {
    setActiveStoreType(type);
    setActiveCategory(category);
  };

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleTabChange = (tab: "store" | "admin") => {
    if (tab === "admin" && !isAuthenticated) {
      setShowPasswordModal(true);
    } else {
      setCurrentTab(tab);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setAuthError(null);
    try {
      const response = await fetch(getApiUrl("/api/verify-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentTab("admin");
        setShowPasswordModal(false);
        setPasswordInput("");
      } else {
        const data = await response.json().catch(() => ({}));
        setAuthError(data.error || "Contraseña incorrecta. Inténtelo de nuevo.");
      }
    } catch (err) {
      setAuthError("No se pudo conectar con el servidor.");
    } finally {
      setVerifying(false);
    }
  };

  const fetchDb = async () => {
    try {
      const response = await fetch(getApiUrl("/api/db"));
      if (!response.ok) {
        let errorMsg = `Error del servidor (${response.status} ${response.statusText})`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        throw new Error(`Respuesta no válida del servidor: ${rawText.slice(0, 300)}`);
      }
      setDb(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching db:", err);
      setError(err.message || "No se pudo cargar la información de la tienda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDb();
    const trackVisit = async () => {
      try {
        const sessionKey = "visit_tracked_" + new Date().toISOString().slice(0, 10);
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "true");
          const res = await fetch(getApiUrl("/api/visits"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timestamp: new Date().toISOString() }),
          });
          if (res.ok) {
            const data = await res.json().catch(() => null);
            if (data && data.visits) {
              setDb((prev) => (prev ? { ...prev, visits: data.visits } : prev));
            }
          }
        }
      } catch (err) {
        console.warn("Could not record visit:", err);
      }
    };
    trackVisit();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold text-neutral-800 font-mono uppercase tracking-widest animate-pulse">Iniciando Tienda Online...</h2>
      </div>
    );
  }

  if (error || !db) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 mb-4 font-bold max-w-md">{error || "Error al inicializar."}</div>
        <button onClick={() => { setLoading(true); fetchDb(); }} className="px-5 py-2.5 bg-neutral-950 text-white text-xs font-bold rounded-xl hover:bg-neutral-900 transition-all cursor-pointer shadow-md">Reintentar Conexión</button>
      </div>
    );
  }

  const { settings, products, chats, tipos = [], categorias = [] } = db;

  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    try {
      const res = await fetch(getApiUrl("/api/settings"), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSettings) });
      if (res.ok) await fetchDb();
    } catch (err) { console.error("Error updating settings:", err); }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      const res = await fetch(getApiUrl("/api/products"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(product) });
      if (res.ok) await fetchDb();
    } catch (err) { console.error("Error saving product:", err); }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/products/${productId}`), { method: "DELETE" });
      if (res.ok) await fetchDb();
    } catch (err) { console.error("Error deleting product:", err); }
  };

  const handleSendOwnerMessage = async (chatId: string, text: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/chats/${chatId}/messages`), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: "owner", text }) });
      if (res.ok) await fetchDb();
    } catch (err) { console.error("Error sending owner message:", err); }
  };

  const handleCustomerSendMessage = async (customerName: string, text: string): Promise<ChatSession> => {
    const sessionRes = await fetch(getApiUrl("/api/chats"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName }) });
    const session: ChatSession = await sessionRes.json();
    const messageRes = await fetch(getApiUrl(`/api/chats/${session.id}/messages`), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: "customer", text }) });
    const updatedSession: ChatSession = await messageRes.json();
    fetchDb();
    return updatedSession;
  };

  const handleInstantBuy = (product: Product) => {
    const defaultSize = product.sizes[0] || "Única";
    const defaultColor = product.colors[0] || "Único";
    const productCode = getProductCode(product);
    let template = settings.whatsappTemplate || "¡Hola! Me interesa comprar el producto *{name}* [Cód: *{code}*] (Precio: *{price}*, Talla: *{size}*, Color: *{color}*). ¿Está disponible?";
    let formattedMessage = template.replace("{name}", product.name).replace("{code}", productCode).replace("{price}", `$${product.price.toFixed(2)}`).replace("{size}", defaultSize).replace("{color}", defaultColor);
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(formattedMessage)}`, "_blank");
  };

  const storeCategories = getCategoriesWithProducts(products || [], categorias, tipos, "Tienda");
  const marketCategories = getCategoriesWithProducts(products || [], categorias, tipos, "Mercado");

  const activeTipo = tipos.find(t => t.nombre.toLowerCase() === activeStoreType);
  const activeTipoId = activeTipo ? activeTipo.id : 1;

  const filteredProducts = (products || []).filter((product) => {
    const matchesSection = product.tipo_id === activeTipoId;
    let matchesCategory = true;
    if (activeCategory !== "todos") {
      const productCatName = getNombreCategoria(categorias, product.categoria_id);
      matchesCategory = productCatName.toLowerCase() === activeCategory.toLowerCase();
    }
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.colors.some((col) => col.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.sizes.some((size) => size.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSection && matchesCategory && matchesSearch;
  });

  const featuredProducts = (products || []).filter((p) => p.featured && p.stock > 0 && p.tipo_id === activeTipoId);

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col text-neutral-800">
      <StoreHeader
        settings={settings}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        activeStoreType={activeStoreType}
        activeCategory={activeCategory}
        onStoreTypeSelect={handleStoreTypeSelect}
        onCategorySelect={handleCategorySelect}
        storeCategories={storeCategories}
        marketCategories={marketCategories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {currentTab === "store" ? (
        <div className="flex-1">
          {activeCategory === "todos" && searchQuery === "" && (
            <section className={`text-white relative overflow-hidden py-16 md:py-24 border-b ${activeStoreType === "mercado" ? "bg-amber-950 border-amber-950" : "bg-neutral-900 border-neutral-950"}`}>
              <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] opacity-90 ${activeStoreType === "mercado" ? "from-amber-900 via-amber-950 to-neutral-950" : "from-neutral-800 via-neutral-900 to-neutral-950"}`} />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-widest rounded-full border ${activeStoreType === "mercado" ? "bg-amber-900/60 text-amber-200 border-amber-700/80" : "bg-neutral-800 text-neutral-300 border-neutral-700/80"}`}>
                    <Sparkles className={`w-3.5 h-3.5 ${activeStoreType === "mercado" ? "text-amber-300 fill-amber-300" : "text-yellow-400 fill-yellow-400"}`} />
                    <span>{activeStoreType === "mercado" ? "Frescura y Buen Precio" : "Colección de Temporada 2026"}</span>
                  </div>

                  {/* AQUÍ ESTABA EL ERROR — ahora usa JSX real en vez de string con HTML */}
                  {activeStoreType === "mercado" ? (
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans tracking-tight leading-none text-white">
                      Todo lo que{" "}
                      <span className="text-amber-300 underline decoration-amber-600 underline-offset-8">
                        Necesitas
                      </span>{" "}
                      en tu Casa
                    </h2>
                  ) : (
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans tracking-tight leading-none text-white">
                      Viste con{" "}
                      <span className="text-neutral-300 underline decoration-neutral-500 underline-offset-8">
                        Estilo
                      </span>{" "}
                      y Confort
                    </h2>
                  )}

                  <p className={`text-sm sm:text-base leading-relaxed max-w-md ${activeStoreType === "mercado" ? "text-amber-100/70" : "text-neutral-400"}`}>
                    {activeStoreType === "mercado"
                      ? "Productos de limpieza, aseo personal y mucho más, directo a tu puerta. Elige tus productos y pide por WhatsApp en segundos."
                      : "Descubre nuestra colección de ropa de alta gama y calzado ergonómico. Elige tus favoritos, personaliza tus tallas y pide directo por WhatsApp en segundos."}
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-3.5 bg-white text-neutral-950 text-xs font-bold rounded-xl hover:bg-neutral-100 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-white/5">
                      <span>{activeStoreType === "mercado" ? "Explorar Mercado" : "Explorar Catálogo"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {featuredProducts.length > 0 && (
                  <div className="hidden md:flex items-center justify-center">
                    <div className="relative w-80 h-80 bg-neutral-800/50 rounded-3xl border border-neutral-700/50 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl" />
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase rounded-full border border-emerald-500/20">Recomendado</span>
                        <span className="font-mono text-xs text-neutral-400">${featuredProducts[0].price}</span>
                      </div>
                      <div className="my-4 flex justify-center">
                        <img src={featuredProducts[0].images[0]} alt={featuredProducts[0].name} referrerPolicy="no-referrer" className="max-h-40 w-auto object-contain drop-shadow-2xl hover:rotate-3 transition-transform duration-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white line-clamp-1">{featuredProducts[0].name}</h4>
                        <button onClick={() => handleInstantBuy(featuredProducts[0])} className="mt-2 w-full py-2 bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                          <ShoppingBag className="w-4 h-4" />
                          <span>Ordenar Ahora</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-sans tracking-tight">
                  {searchQuery ? `Resultados para "${searchQuery}"` : activeStoreType === "mercado" ? "Productos del Mercado" : "Catálogo Exclusivo"}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">{filteredProducts.length} artículos disponibles</p>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-neutral-300 mb-3" />
                <h4 className="font-bold text-neutral-800">No encontramos coincidencias</h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} settings={settings} onViewDetails={setSelectedProduct} onInstantBuy={handleInstantBuy} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <OwnerDashboard
          settings={settings}
          products={products || []}
          chats={chats || []}
          visits={db?.visits}
          tipos={tipos}
          categorias={categorias}
          onUpdateSettings={handleUpdateSettings}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onSendOwnerMessage={handleSendOwnerMessage}
          onRefreshData={fetchDb}
        />
      )}

      {selectedProduct && <ProductDetailModal product={selectedProduct} settings={settings} onClose={() => setSelectedProduct(null)} />}
      <ChatWidget settings={settings} />

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl border border-neutral-100 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <button onClick={() => { setShowPasswordModal(false); setPasswordInput(""); setAuthError(null); }} className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-neutral-900 text-white rounded-2xl"><Lock className="w-6 h-6" /></div>
              <div>
                <h4 className="text-lg font-black text-neutral-950 font-sans tracking-tight">Acceso Restringido</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">Ingrese la contraseña de administración.</p>
              </div>
            </div>
            <form onSubmit={handleVerifyPassword} className="mt-6 space-y-4">
              <div>
                <input type="password" required autoFocus placeholder="Contraseña" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all text-center" />
                {authError && <p className="text-xs text-red-500 font-medium text-center mt-2">{authError}</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordInput(""); setAuthError(null); }} className="flex-1 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-semibold transition-all cursor-pointer">Cancelar</button>
                <button type="submit" disabled={verifying} className="flex-1 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                  {verifying ? "Verificando..." : "Ingresar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-neutral-100 py-8 text-center text-neutral-500 text-xs font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p>© 2026 {settings.storeName || "Tienda"}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}