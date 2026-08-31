import React, { useState } from "react";
import {
  BarChart3, Package, MessageSquare, Settings, Plus, Trash2, Edit3,
  Save, ArrowLeft, Send, CheckCircle2, TrendingUp, RefreshCw, AlertCircle,
  Eye, EyeOff, Tag, FolderPlus, Globe, Clock, Activity, Sparkles, ShoppingBag, Store
} from "lucide-react";
import { Product, StoreSettings, ChatSession, VisitsData, Tipo, Categoria } from "../types";
import { getNombreCategoria, getNombreTipo, getProductCode, formatCategoryName, getApiUrl } from "../utils";

interface OwnerDashboardProps {
  settings: StoreSettings;
  products: Product[];
  chats: ChatSession[];
  visits?: VisitsData;
  tipos: Tipo[];
  categorias: Categoria[];
  onUpdateSettings: (newSettings: StoreSettings) => Promise<void>;
  onSaveProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSendOwnerMessage: (chatId: string, text: string) => Promise<void>;
  onRefreshData: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  settings, products, chats, visits, tipos, categorias,
  onUpdateSettings, onSaveProduct, onDeleteProduct, onSendOwnerMessage, onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<"stats" | "inventory" | "chats" | "settings">("stats");
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => { setSettingsForm({ ...settings }); }, [settings]);

  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [imageInputString, setImageInputString] = useState<string>("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Estado para gestión de categorías
  const [newCatName, setNewCatName] = useState("");
  const [newCatTipoId, setNewCatTipoId] = useState<number>(tipos[0]?.id || 1);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getCategoriesForTipo = (tipoId: number) => {
    return categorias.filter(c => c.tipo_id === tipoId || c.tipo_id === null);
  };

  const handleAddProductClick = () => {
    const defaultTipo = tipos.find(t => t.nombre.toLowerCase() === "tienda") || tipos[0];
    const defaultTipoId = defaultTipo ? defaultTipo.id : 1;
    const availableCats = getCategoriesForTipo(defaultTipoId);
    const defaultCatId = availableCats.length > 0 ? availableCats[0].id : 1;
    const randomCode = `COD-${Math.floor(100 + Math.random() * 900)}`;
    const defaultImages = ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
    setEditingProduct({
      code: randomCode, name: "", description: "",
      tipo_id: defaultTipoId, categoria_id: defaultCatId,
      price: 29.99, images: defaultImages, sizes: ["S", "M", "L"], colors: ["Negro", "Blanco"], stock: 10, featured: false
    });
    setImageInputString(defaultImages.join(", "));
    setIsEditingProduct(true);
  };

  const handleEditProductClick = (product: Product) => {
    const pTipoId = product.tipo_id || (product.storeType === "mercado" ? 2 : 1);
    const pCatId = product.categoria_id || 1;
    setEditingProduct({ ...product, tipo_id: pTipoId, categoria_id: pCatId });
    const productImages = Array.isArray(product.images) && product.images.length > 0 ? product.images : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
    setImageInputString(productImages.join(", "));
    setIsEditingProduct(true);
  };

  const handleProductTipoChange = (newTipoId: number) => {
    const availableCats = getCategoriesForTipo(newTipoId);
    const newCatId = availableCats.length > 0 ? availableCats[0].id : 1;
    setEditingProduct(prev => ({ ...prev, tipo_id: newTipoId, categoria_id: newCatId }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price || editingProduct.stock === undefined || !editingProduct.tipo_id || !editingProduct.categoria_id) {
      alert("Por favor completa los campos principales.");
      return;
    }
    const parsedImages = imageInputString.split(",").map(s => s.trim()).filter(Boolean);
    const finalImages = parsedImages.length > 0 ? parsedImages : (editingProduct.images?.length ? editingProduct.images : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"]);
    const productToSave: Product = { ...(editingProduct as Product), images: finalImages };
    setIsSavingProduct(true);
    try { await onSaveProduct(productToSave); setIsEditingProduct(false); setEditingProduct(null); }
    catch (err) { alert("Error al guardar el producto."); }
    finally { setIsSavingProduct(false); }
  };

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [ownerReplyText, setOwnerReplyText] = useState("");
  const activeChat = chats.find(c => c.id === selectedChatId);

  const handleSendOwnerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !ownerReplyText.trim()) return;
    const text = ownerReplyText.trim();
    setOwnerReplyText("");
    try { await onSendOwnerMessage(selectedChatId, text); } catch (err) { alert("Error al enviar el mensaje."); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try { await onUpdateSettings(settingsForm); alert("Configuraciones guardadas correctamente."); }
    catch (err) { alert("Error al guardar configuraciones."); }
    finally { setIsSavingSettings(false); }
  };

  // Manejador para agregar nueva categoría
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSavingCategory(true);
    setCategoryMessage(null);
    try {
      const res = await fetch(getApiUrl("/api/categorias"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newCatName.trim(), tipo_id: newCatTipoId })
      });
      const data = await res.json();
      if (res.ok) {
        setNewCatName("");
        setCategoryMessage({ type: "success", text: `Categoría "${data.categoria.nombre}" agregada correctamente.` });
        onRefreshData();
      } else {
        setCategoryMessage({ type: "error", text: data.error || "Error al agregar categoría." });
      }
    } catch (err) {
      setCategoryMessage({ type: "error", text: "No se pudo conectar con el servidor." });
    } finally {
      setIsSavingCategory(false);
      setTimeout(() => setCategoryMessage(null), 4000);
    }
  };

  // Manejador para eliminar categoría
  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${catName}"?`)) return;
    try {
      const res = await fetch(getApiUrl(`/api/categorias/${catId}`), { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setCategoryMessage({ type: "success", text: `Categoría "${catName}" eliminada.` });
        onRefreshData();
      } else {
        setCategoryMessage({ type: "error", text: data.error || "No se pudo eliminar la categoría." });
      }
    } catch (err) {
      setCategoryMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setTimeout(() => setCategoryMessage(null), 4000);
    }
  };

  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const totalChats = chats.length;
  const unreadChats = chats.filter(c => c.unread).length;
  const realVisitsCount = visits?.totalVisits ?? 0;
  const realVisitsToday = visits?.visitsToday ?? 0;
  const visitsLog = visits?.visitsLog || [];
  const whatsappRedirects = totalChats + Math.round(realVisitsCount * 0.15);
  const conversionRate = realVisitsCount > 0 ? ((totalChats / realVisitsCount) * 100).toFixed(1) : "0.0";

  // Categorías agrupadas por tipo para la UI
  const categoriasPorTipo = tipos.map(tipo => ({
    tipo,
    categorias: categorias.filter(c => c.tipo_id === tipo.id || c.tipo_id === null)
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-100 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-950 font-sans tracking-tight flex items-center gap-2">
            <span>Panel de Control del Dueño</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">● En Vivo</span>
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Administra tu inventario, responde chats y monitorea visitas.</p>
        </div>
        <button onClick={onRefreshData} className="p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold" title="Sincronizar datos">
          <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Actualizar Datos</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-1.5 bg-neutral-50 p-2 rounded-2xl border border-neutral-200/50 overflow-x-auto lg:overflow-visible scrollbar-none">
            <button onClick={() => { setActiveTab("stats"); setIsEditingProduct(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === "stats" ? "bg-neutral-950 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"}`}>
              <BarChart3 className="w-4 h-4" /><span>Estadísticas</span>
            </button>
            <button onClick={() => { setActiveTab("inventory"); setIsEditingProduct(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === "inventory" ? "bg-neutral-950 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"}`}>
              <Package className="w-4 h-4" /><span>Inventario ({totalProducts})</span>
            </button>
            <button onClick={() => { setActiveTab("chats"); setIsEditingProduct(false); }} className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === "chats" ? "bg-neutral-950 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"}`}>
              <div className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /><span>Chats</span></div>
              {unreadChats > 0 && <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] rounded-full font-extrabold animate-pulse">{unreadChats}</span>}
            </button>
            <button onClick={() => { setActiveTab("settings"); setIsEditingProduct(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === "settings" ? "bg-neutral-950 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"}`}>
              <Settings className="w-4 h-4" /><span>Configuración</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">

          {/* ============ TAB: STATS ============ */}
          {activeTab === "stats" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-neutral-200/80 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono flex items-center gap-1.5"><Globe className="w-4 h-4 text-emerald-600" /><span>Visitas Reales</span></span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span>En Vivo</span></span>
                  </div>
                  <div className="mt-3"><h3 className="text-3xl font-black text-neutral-950 font-mono">{realVisitsCount}</h3></div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-600 font-medium mt-4 pt-2 border-t border-neutral-100">
                    <span className="flex items-center gap-1 text-emerald-700 font-bold"><Clock className="w-3.5 h-3.5" /><span>{realVisitsToday} hoy</span></span>
                    <span className="text-neutral-400 text-[10px]">Guardado en BD</span>
                  </div>
                </div>
                <div className="p-5 bg-white border border-neutral-100 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow">
                  <div><span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">Consultas (Chats)</span><h3 className="text-3xl font-black text-neutral-950 font-mono mt-2">{totalChats}</h3></div>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium mt-4 pt-2 border-t border-neutral-100"><MessageSquare className="w-3.5 h-3.5 text-neutral-400" /><span>{unreadChats} pendientes</span></div>
                </div>
                <div className="p-5 bg-white border border-neutral-100 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow">
                  <div><span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">Intenciones Compra</span><h3 className="text-3xl font-black text-neutral-950 font-mono mt-2">{whatsappRedirects}</h3></div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-4 pt-2 border-t border-neutral-100"><TrendingUp className="w-3.5 h-3.5" /><span>Tasa Conversión: {conversionRate}%</span></div>
                </div>
                <div className="p-5 bg-white border border-neutral-100 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-shadow">
                  <div><span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">Salud de Inventario</span><h3 className="text-3xl font-black text-neutral-950 font-mono mt-2">{totalProducts - outOfStockCount} / {totalProducts}</h3></div>
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-bold mt-4 pt-2 border-t border-neutral-100"><AlertCircle className="w-3.5 h-3.5" /><span>{outOfStockCount} agotados • {lowStockCount} bajo stock</span></div>
                </div>
              </div>
              <div className="bg-white border border-neutral-100 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-neutral-950 text-base flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /><span>Registro de Visitas Reales Recientes</span></h4>
                    <p className="text-xs text-neutral-500">Historial detallado de accesos registrados.</p>
                  </div>
                  <span className="text-xs font-semibold text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">Total Acumulado: <strong>{realVisitsCount}</strong> visitas</span>
                </div>
                {visitsLog.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200 text-xs">Las visitas reales comenzarán a registrarse automáticamente.</div>
                ) : (
                  <div className="overflow-x-auto max-h-64 scrollbar-thin">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-neutral-500 font-mono uppercase text-[10px] sticky top-0">
                        <tr><th className="py-2.5 px-3">Fecha y Hora</th><th className="py-2.5 px-3">Dirección IP</th><th className="py-2.5 px-3">Navegador / Dispositivo</th></tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                        {visitsLog.slice(0, 15).map((log, idx) => (
                          <tr key={log.id || idx} className="hover:bg-neutral-50/80 transition-colors">
                            <td className="py-2 px-3 font-mono text-neutral-900 whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString("es-ES", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Reciente"}</td>
                            <td className="py-2 px-3 font-mono text-neutral-500">{log.ip || "Directo / Web"}</td>
                            <td className="py-2 px-3 text-neutral-500 truncate max-w-xs" title={log.userAgent}>{log.userAgent ? (log.userAgent.includes("Mobile") ? "📱 Móvil" : "💻 Computadora / Escritorio") : "Web Browser"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============ TAB: INVENTORY ============ */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              {!isEditingProduct ? (
                <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-neutral-100 flex items-center justify-between flex-wrap gap-4">
                    <div><h4 className="font-bold text-neutral-950 text-base">Administración de Productos</h4><p className="text-xs text-neutral-500">Crea, edita y elimina productos</p></div>
                    <button onClick={handleAddProductClick} className="px-4 py-2 bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md"><Plus className="w-4 h-4" /><span>Agregar Producto</span></button>
                  </div>
                  {products.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">No hay productos registrados.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase font-mono border-b border-neutral-100">
                            <th className="p-4">Producto</th><th className="p-4">Sección</th><th className="p-4">Categoría</th>
                            <th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-800">
                          {products.map((product) => (
                            <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img src={product.images[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"} alt={product.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover bg-neutral-100 border border-neutral-200" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"; }} />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold block text-neutral-950">{product.name}</span>
                                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 rounded border border-neutral-200">{getProductCode(product)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full font-mono uppercase tracking-wide border ${getNombreTipo(tipos, product.tipo_id).toLowerCase() === "mercado" ? "bg-amber-50 text-amber-900 border-amber-200" : "bg-neutral-100 text-neutral-800 border-neutral-200"}`}>
                                  {getNombreTipo(tipos, product.tipo_id)}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full font-mono uppercase tracking-wide border bg-indigo-50 text-indigo-800 border-indigo-200">
                                  {getNombreCategoria(categorias, product.categoria_id)}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-bold text-neutral-950">${product.price.toFixed(2)}</td>
                              <td className="p-4">
                                {product.stock === 0 ? <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Agotado</span> : product.stock <= 5 ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Bajo ({product.stock})</span> : <span className="text-xs text-neutral-600 font-mono">{product.stock} u.</span>}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={() => handleEditProductClick(product)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer" title="Editar"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => { if (confirm(`¿Eliminar "${product.name}"?`)) onDeleteProduct(product.id); }} className="p-1.5 hover:bg-rose-50 rounded-lg text-neutral-400 hover:text-rose-600 transition-all cursor-pointer" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-neutral-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3 border-b border-neutral-100 pb-4 mb-6">
                    <button onClick={() => { setIsEditingProduct(false); setEditingProduct(null); }} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-950 transition-all cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
                    <div><h4 className="font-bold text-neutral-950 text-base">{editingProduct?.id ? `Editar: ${editingProduct.name}` : "Agregar Nuevo Producto"}</h4><p className="text-xs text-neutral-500">Configura los detalles del artículo</p></div>
                  </div>
                  <form onSubmit={handleSaveProduct} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Nombre del Producto *</label>
                        <input type="text" required value={editingProduct?.name || ""} onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Código de Venta</label>
                        <input type="text" value={editingProduct?.code || ""} onChange={(e) => setEditingProduct(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Sección del Producto *</label>
                        <select required value={editingProduct?.tipo_id || 1} onChange={(e) => handleProductTipoChange(Number(e.target.value))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all bg-white font-medium cursor-pointer">
                          {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Categoría del Producto *</label>
                        <select required value={editingProduct?.categoria_id || 1} onChange={(e) => setEditingProduct(prev => ({ ...prev, categoria_id: Number(e.target.value) }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all bg-white font-medium cursor-pointer">
                          {getCategoriesForTipo(editingProduct?.tipo_id || 1).map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Precio de Venta ($) *</label>
                        <input type="number" step="0.01" required value={editingProduct?.price || 0} onChange={(e) => setEditingProduct(prev => ({ ...prev, price: parseFloat(e.target.value) }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Unidades en Stock *</label>
                        <input type="number" required value={editingProduct?.stock || 0} onChange={(e) => setEditingProduct(prev => ({ ...prev, stock: parseInt(e.target.value) }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">URLs de Imágenes (separadas por comas) *</label>
                        <textarea rows={2} required value={imageInputString} onChange={(e) => { const val = e.target.value; setImageInputString(val); setEditingProduct(prev => ({ ...prev, images: val.split(",").map(s => s.trim()).filter(Boolean) })); }} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Tallas (separadas por comas)</label>
                        <input type="text" value={editingProduct?.sizes?.join(", ") || ""} onChange={(e) => setEditingProduct(prev => ({ ...prev, sizes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Colores (separados por comas)</label>
                        <input type="text" value={editingProduct?.colors?.join(", ") || ""} onChange={(e) => setEditingProduct(prev => ({ ...prev, colors: e.target.value.split(",").map(c => c.trim()).filter(Boolean) }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Descripción Detallada</label>
                        <textarea rows={4} value={editingProduct?.description || ""} onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="featured-checkbox" checked={editingProduct?.featured || false} onChange={(e) => setEditingProduct(prev => ({ ...prev, featured: e.target.checked }))} className="w-4 h-4 text-neutral-950 border-neutral-300 rounded focus:ring-neutral-950" />
                        <label htmlFor="featured-checkbox" className="text-xs font-bold text-neutral-700 uppercase tracking-wider cursor-pointer">Destacar este producto en la portada</label>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-6">
                      <button type="button" onClick={() => { setIsEditingProduct(false); setEditingProduct(null); }} className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-150 text-neutral-700 text-xs font-bold rounded-xl transition-all cursor-pointer">Cancelar</button>
                      <button type="submit" disabled={isSavingProduct} className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-neutral-900/10"><Save className="w-4 h-4" /><span>{isSavingProduct ? "Guardando..." : "Guardar Producto"}</span></button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ============ TAB: CHATS ============ */}
          {activeTab === "chats" && (
            <div className="bg-white border border-neutral-100 rounded-2xl h-[550px] flex overflow-hidden">
              <div className="w-1/3 border-r border-neutral-100 flex flex-col h-full bg-neutral-50/50">
                <div className="p-4 border-b border-neutral-100 bg-white">
                  <h4 className="font-bold text-neutral-950 text-sm">Conversaciones</h4>
                  <p className="text-[10px] text-neutral-400">Chats iniciados por clientes</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-100/60">
                  {chats.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400 mt-12">Ningún cliente ha iniciado chats aún.</div>
                  ) : (
                    chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((session) => {
                      const lastMsg = session.messages[session.messages.length - 1];
                      const isSelected = selectedChatId === session.id;
                      return (
                        <button key={session.id} onClick={() => setSelectedChatId(session.id)} className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${isSelected ? "bg-neutral-100" : "hover:bg-neutral-50 bg-white"}`}>
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">{session.customerName.charAt(0).toUpperCase()}</div>
                            {session.unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-xs text-neutral-950 truncate">{session.customerName}</span>
                              <span className="text-[9px] text-neutral-400 font-mono">{new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-neutral-500 truncate leading-snug">{lastMsg ? lastMsg.text : "Inició chat"}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col h-full bg-white">
                {activeChat ? (
                  <div className="flex-col flex h-full justify-between">
                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">{activeChat.customerName.charAt(0).toUpperCase()}</div>
                        <div><h5 className="font-bold text-xs text-neutral-950">{activeChat.customerName}</h5><p className="text-[10px] text-neutral-400">Cliente activo</p></div>
                      </div>
                      {activeChat.unread && <span className="px-2 py-0.5 text-[9px] bg-rose-100 text-rose-800 font-bold rounded-full">Nuevo Mensaje</span>}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50">
                      {activeChat.messages.map((msg) => {
                        const isOwner = msg.sender === "owner";
                        const isAi = msg.sender === "ai";
                        return (
                          <div key={msg.id} className={`flex flex-col ${isOwner ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-1.5 mb-1 text-[9px] text-neutral-400">
                              <span className="font-bold text-neutral-500">{isOwner ? "Tú (Dueño)" : isAi ? "Asistente AI" : activeChat.customerName}</span>
                              <span>•</span>
                              <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${isOwner ? "bg-neutral-900 text-white rounded-tr-none shadow-xs" : isAi ? "bg-purple-50 text-purple-950 border border-purple-200/50 rounded-tl-none shadow-xs" : "bg-white text-neutral-800 border border-neutral-200/50 rounded-tl-none shadow-xs"}`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <form onSubmit={handleSendOwnerMessage} className="p-4 border-t border-neutral-100 flex gap-2 bg-white">
                      <input type="text" required placeholder={`Escribe un mensaje para ${activeChat.customerName}...`} value={ownerReplyText} onChange={(e) => setOwnerReplyText(e.target.value)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      <button type="submit" className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"><Send className="w-4 h-4" /><span>Responder</span></button>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-neutral-400">
                    <MessageSquare className="w-10 h-10 text-neutral-300 mb-3" />
                    <p className="text-sm">Selecciona una conversación de la izquierda para comenzar a responder.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============ TAB: SETTINGS (con gestión de categorías) ============ */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              
              {/* SECCIÓN 1: GESTIÓN DE CATEGORÍAS */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-6">
                <div className="border-b border-neutral-100 pb-4 mb-6">
                  <h4 className="font-bold text-neutral-950 text-base flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-emerald-600" />
                    <span>Gestión de Categorías</span>
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">Agrega, visualiza y elimina categorías para Tienda y Mercado.</p>
                </div>

                {/* Formulario para agregar nueva categoría */}
                <form onSubmit={handleAddCategory} className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4 mb-6">
                  <div>
                    <span className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Agregar Nueva Categoría</span>
                    </span>
                    <p className="text-xs text-neutral-500">Selecciona el tipo y escribe el nombre de la nueva categoría.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Tipo *</label>
                      <select
                        required
                        value={newCatTipoId}
                        onChange={(e) => setNewCatTipoId(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 cursor-pointer"
                      >
                        {tipos.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.nombre === "Tienda" ? "🛍️ " : "🏪 "}{t.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Nombre de la Categoría *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Ej. Accesorios, Panadería, Bebidas..."
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                        />
                        <button
                          type="submit"
                          disabled={isSavingCategory}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isSavingCategory ? "Agregando..." : "Agregar"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {categoryMessage && (
                    <div className={`px-3 py-2 rounded-xl text-xs font-medium ${categoryMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                      {categoryMessage.text}
                    </div>
                  )}
                </form>

                {/* Listado de categorías por tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoriasPorTipo.map(({ tipo, categorias: cats }) => (
                    <div key={tipo.id} className={`p-4 rounded-2xl border ${tipo.nombre.toLowerCase() === "mercado" ? "bg-amber-50/60 border-amber-200" : "bg-neutral-50 border-neutral-200"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {tipo.nombre.toLowerCase() === "mercado" ? (
                            <Store className="w-4 h-4 text-amber-700" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-neutral-700" />
                          )}
                          <span className={`text-xs font-bold uppercase tracking-wider ${tipo.nombre.toLowerCase() === "mercado" ? "text-amber-950" : "text-neutral-900"}`}>
                            {tipo.nombre}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${tipo.nombre.toLowerCase() === "mercado" ? "bg-amber-200 text-amber-900" : "bg-neutral-200 text-neutral-700"}`}>
                            {cats.length} {cats.length === 1 ? "categoría" : "categorías"}
                          </span>
                        </div>
                      </div>

                      {cats.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic py-2">No hay categorías para este tipo aún.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {cats.map((cat) => {
                            const productosCount = products.filter(p => p.categoria_id === cat.id).length;
                            return (
                              <div
                                key={cat.id}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs ${
                                  tipo.nombre.toLowerCase() === "mercado"
                                    ? "bg-white border border-amber-200 text-amber-950"
                                    : "bg-white border border-neutral-200 text-neutral-800"
                                }`}
                              >
                                <Tag className="w-3 h-3 text-neutral-400" />
                                <span>{formatCategoryName(cat.nombre)}</span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${productosCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                                  {productosCount} {productosCount === 1 ? "prod" : "prods"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                                  className="hover:text-rose-600 transition-colors cursor-pointer ml-1 text-neutral-400"
                                  title={`Eliminar categoría "${cat.nombre}"`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 2: CONFIGURACIÓN GENERAL DE LA TIENDA */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-6">
                <div className="border-b border-neutral-100 pb-4 mb-6">
                  <h4 className="font-bold text-neutral-950 text-base">Configuración General</h4>
                  <p className="text-xs text-neutral-500">Ajusta el nombre, WhatsApp e Inteligencia Artificial.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Nombre de la Tienda</label>
                    <input type="text" required value={settingsForm.storeName} onChange={(e) => setSettingsForm(prev => ({ ...prev, storeName: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Contraseña del Panel</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required value={settingsForm.ownerPassword || ""} onChange={(e) => setSettingsForm(prev => ({ ...prev, ownerPassword: e.target.value }))} className="w-full px-4 py-2.5 pr-12 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer" title={showPassword ? "Ocultar" : "Mostrar"}>
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Número de WhatsApp del Dueño *</label>
                    <input type="text" required value={settingsForm.whatsappNumber} onChange={(e) => setSettingsForm(prev => ({ ...prev, whatsappNumber: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all font-mono" placeholder="Ej. 5352943409" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Plantilla de Mensaje para Pedido de WhatsApp</label>
                    <textarea rows={3} required value={settingsForm.whatsappTemplate} onChange={(e) => setSettingsForm(prev => ({ ...prev, whatsappTemplate: e.target.value }))} className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all font-mono text-xs" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded border">Comodines:</span>
                      <span className="text-[10px] text-neutral-500 font-bold bg-neutral-100 px-1.5 py-0.5 rounded font-mono">{`{name}`}</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">{`{code}`}</span>
                      <span className="text-[10px] text-neutral-500 font-bold bg-neutral-100 px-1.5 py-0.5 rounded font-mono">{`{price}`}</span>
                      <span className="text-[10px] text-neutral-500 font-bold bg-neutral-100 px-1.5 py-0.5 rounded font-mono">{`{size}`}</span>
                      <span className="text-[10px] text-neutral-500 font-bold bg-neutral-100 px-1.5 py-0.5 rounded font-mono">{`{color}`}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-purple-700 fill-purple-100" />
                        <div>
                          <span className="block text-xs font-bold text-purple-950 uppercase tracking-wider">Asistente de Inteligencia Artificial (Gemini)</span>
                          <span className="text-[11px] text-purple-600 font-medium">Permite responder de manera inteligente cuando estás fuera</span>
                        </div>
                      </div>
                      <input type="checkbox" id="ai-assistant-toggle" checked={settingsForm.aiAssistantEnabled} onChange={(e) => setSettingsForm(prev => ({ ...prev, aiAssistantEnabled: e.target.checked }))} className="w-4 h-4 text-purple-700 border-neutral-300 rounded focus:ring-purple-500" />
                    </div>
                    {settingsForm.aiAssistantEnabled && (
                      <div className="space-y-3 pt-3 border-t border-purple-100/50">
                        <div>
                          <label className="block text-[10px] font-extrabold text-purple-900 uppercase tracking-wider mb-2">Tono de voz de la IA</label>
                          <select value={settingsForm.aiAssistantTone} onChange={(e) => setSettingsForm(prev => ({ ...prev, aiAssistantTone: e.target.value }))} className="w-full px-4 py-2 border border-purple-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white text-neutral-800">
                            <option value="Amistoso, servicial y profesional">Amistoso, servicial y profesional (Recomendado)</option>
                            <option value="Muy formal y corporativo">Muy formal y corporativo</option>
                            <option value="Divertido, juvenil y entusiasta">Divertido, juvenil y entusiasta</option>
                            <option value="Minimalista y directo">Minimalista y directo</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-neutral-100 pt-6 flex justify-end">
                    <button type="submit" disabled={isSavingSettings} className="px-6 py-3 bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md">
                      <Save className="w-4 h-4" /><span>{isSavingSettings ? "Guardando..." : "Guardar Configuraciones"}</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
};