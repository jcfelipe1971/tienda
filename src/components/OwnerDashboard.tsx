import { useState } from "react";
import {
  Package,
  MessageSquare,
  Settings,
  Trash2,
  Edit3,
  Plus,
  X,
  Check,
} from "lucide-react";
import {
  DatabaseSchema,
  Product,
  StoreSettings,
  ChatSession,
  Tipo,
  Categoria,
} from "../types";

interface OwnerDashboardProps {
  settings: StoreSettings;
  products: Product[];
  chats: ChatSession[];
  visits?: DatabaseSchema["visits"];
  tipos: Tipo[];
  categorias: Categoria[];
  onUpdateSettings: (settings: StoreSettings) => void;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onSendOwnerMessage: (chatId: string, text: string) => void;
  onRefreshData: () => void;
}

type Tab = "stats" | "inventory" | "chats" | "config";

export function OwnerDashboard({
  settings,
  products,
  chats,
  visits,
  tipos,
  categorias,
  onUpdateSettings,
  onSaveProduct,
  onDeleteProduct,
  onSendOwnerMessage,
  onRefreshData,
}: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("config");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, string>>({});

  // Estados para gestión de tipos
  const [newTipoNombre, setNewTipoNombre] = useState("");
  const [newTipoDescripcion, setNewTipoDescripcion] = useState("");
  const [editingTipoId, setEditingTipoId] = useState<number | null>(null);
  const [editTipoNombre, setEditTipoNombre] = useState("");
  const [editTipoDescripcion, setEditTipoDescripcion] = useState("");

  // Estados para gestión de categorías
  const [newCatNombre, setNewCatNombre] = useState("");
  const [newCatTipoId, setNewCatTipoId] = useState<number>(1);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatNombre, setEditCatNombre] = useState("");
  const [editCatTipoId, setEditCatTipoId] = useState<number>(1);

  // Estados para configuración
  const [configForm, setConfigForm] = useState({
    storeName: settings.storeName,
    whatsappNumber: settings.whatsappNumber,
    whatsappTemplate: settings.whatsappTemplate,
    aiAssistantEnabled: settings.aiAssistantEnabled,
    aiAssistantTone: settings.aiAssistantTone,
    ownerPassword: settings.ownerPassword || "",
  });

  const handleSaveSettings = async () => {
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configForm),
      });
      onUpdateSettings(configForm as StoreSettings);
      alert("Configuración guardada");
    } catch (err) {
      alert("Error al guardar configuración");
    }
  };

  // ================= GESTIÓN DE TIPOS =================
  const handleAddTipo = async () => {
    if (!newTipoNombre.trim()) {
      alert("El nombre del tipo es obligatorio");
      return;
    }
    try {
      const res = await fetch("/api/tipos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newTipoNombre.trim(),
          descripcion: newTipoDescripcion.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTipoNombre("");
        setNewTipoDescripcion("");
        onRefreshData();
      } else {
        alert(data.error || "Error al agregar tipo");
      }
    } catch (err) {
      alert("Error al conectar con el servidor");
    }
  };

  const handleEditTipo = (tipo: Tipo) => {
    setEditingTipoId(tipo.id);
    setEditTipoNombre(tipo.nombre);
    setEditTipoDescripcion(tipo.descripcion || "");
  };

  const handleSaveEditTipo = async (tipoId: number) => {
    if (!editTipoNombre.trim()) {
      alert("El nombre del tipo es obligatorio");
      return;
    }
    try {
      const res = await fetch(`/api/tipos/${tipoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editTipoNombre.trim(),
          descripcion: editTipoDescripcion.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingTipoId(null);
        onRefreshData();
      } else {
        alert(data.error || "Error al actualizar tipo");
      }
    } catch (err) {
      alert("Error al conectar con el servidor");
    }
  };

  const handleDeleteTipo = async (tipoId: number) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este tipo? Se eliminarán también las categorías asociadas.",
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/tipos/${tipoId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
      } else {
        alert(data.error || "Error al eliminar tipo");
      }
    } catch (err) {
      alert("Error al conectar con el servidor");
    }
  };

  // ================= GESTIÓN DE CATEGORÍAS =================
  const handleAddCategoria = async () => {
    if (!newCatNombre.trim()) {
      alert("El nombre de la categoría es obligatorio");
      return;
    }
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newCatNombre.trim(),
          tipo_id: newCatTipoId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatNombre("");
        onRefreshData();
      } else {
        alert(data.error || "Error al agregar categoría");
      }
    } catch (err) {
      alert("Error al conectar con el servidor");
    }
  };

  const handleEditCategoria = (cat: Categoria) => {
    setEditingCatId(cat.id);
    setEditCatNombre(cat.nombre);
    setEditCatTipoId(cat.tipo_id || 1);
  };

  const handleSaveEditCategoria = async (catId: number) => {
    if (!editCatNombre.trim()) {
      alert("El nombre de la categoría es obligatorio");
      return;
    }
    try {
      const res = await fetch(`/api/categorias/${catId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editCatNombre.trim(),
          tipo_id: editCatTipoId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingCatId(null);
        onRefreshData();
      } else {
        alert(data.error || "Error al actualizar categoría");
      }
    } catch (err) {
      alert("Error al conectar con el servidor");
    }
  };

  const handleDeleteCategoria = async (catId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) {
      return;
    }
    try {
      const res = await fetch(`/api/categorias/${catId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
      } else {
        alert(data.error || "Error al eliminar categoría");
      }
    } catch (err) {
      alert("Error al conectar con el servidor");
    }
  };

  const getProductosCount = (categoriaId: number) => {
    return products.filter((p) => p.categoria_id === categoriaId).length;
  };

  const getCategoriasByTipo = (tipoId: number) => {
    return categorias.filter((c) => c.tipo_id === tipoId);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">A&J</span>
            </div>
            <div>
              <h1 className="font-bold text-neutral-900">
                {settings.storeName}
              </h1>
              <p className="text-xs text-neutral-500">
                Panel de Administración
              </p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-all"
          >
            Ver Tienda
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-2 sticky top-24">
              <button
                onClick={() => setActiveTab("stats")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === "stats"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Estadísticas</span>
              </button>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === "inventory"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">
                  Inventario ({products.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab("chats")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === "chats"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Chats</span>
              </button>
              <button
                onClick={() => setActiveTab("config")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === "config"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Configuración</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Estadísticas */}
            {activeTab === "stats" && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">
                  Estadísticas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-50 rounded-xl p-6">
                    <p className="text-sm text-neutral-600 mb-1">
                      Visitas Totales
                    </p>
                    <p className="text-3xl font-bold text-neutral-900">
                      {visits?.totalVisits || 0}
                    </p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-6">
                    <p className="text-sm text-neutral-600 mb-1">Visitas Hoy</p>
                    <p className="text-3xl font-bold text-neutral-900">
                      {visits?.visitsToday || 0}
                    </p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-6">
                    <p className="text-sm text-neutral-600 mb-1">Productos</p>
                    <p className="text-3xl font-bold text-neutral-900">
                      {products.length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Inventario */}
            {activeTab === "inventory" && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-neutral-900">
                    Inventario
                  </h2>
                  <button
                    onClick={() =>
                      setEditingProduct({
                        id: "",
                        name: "",
                        description: "",
                        tipo_id: 1,
                        categoria_id: 1,
                        price: 0,
                        images: [],
                        sizes: [],
                        colors: [],
                        stock: 0,
                        featured: false,
                      })
                    }
                    className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
                  >
                    + Nuevo Producto
                  </button>
                </div>

                {editingProduct && (
                  <div className="mb-6 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
                    <h3 className="font-bold text-neutral-900 mb-4">
                      {editingProduct.id ? "Editar Producto" : "Nuevo Producto"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          NOMBRE *
                        </label>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          CÓDIGO
                        </label>
                        <input
                          type="text"
                          value={editingProduct.code || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              code: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          TIPO *
                        </label>
                        <select
                          value={editingProduct.tipo_id}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              tipo_id: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        >
                          {tipos.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                              {tipo.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          CATEGORÍA *
                        </label>
                        <select
                          value={editingProduct.categoria_id}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              categoria_id: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        >
                          {categorias
                            .filter((c) => c.tipo_id === editingProduct.tipo_id)
                            .map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          PRECIO *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.price}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              price: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          STOCK *
                        </label>
                        <input
                          type="number"
                          value={editingProduct.stock}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              stock: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          IMÁGENES (separadas por comas)
                        </label>
                        <textarea
                          value={editingProduct.images.join(", ")}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              images: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          TALLAS (separadas por comas)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.sizes.join(", ")}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              sizes: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          COLORES (separados por comas)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.colors.join(", ")}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              colors: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          DESCRIPCIÓN
                        </label>
                        <textarea
                          value={editingProduct.description}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                          rows={3}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingProduct.featured}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                featured: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium text-neutral-700">
                            Producto destacado
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          onSaveProduct(editingProduct);
                          setEditingProduct(null);
                        }}
                        className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 bg-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                    >
                      <div className="flex items-center gap-4">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h4 className="font-medium text-neutral-900">
                            {product.name}
                          </h4>
                          <p className="text-xs text-neutral-500">
                            {product.code} • ${product.price} • Stock:{" "}
                            {product.stock}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("¿Eliminar este producto?")) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chats */}
            {activeTab === "chats" && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">
                  Chats
                </h2>
                <div className="space-y-4">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className="p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-neutral-900">
                          {chat.customerName}
                        </h4>
                        <span className="text-xs text-neutral-500">
                          {new Date(chat.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                        {chat.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-2 rounded-lg text-sm ${
                              msg.sender === "customer"
                                ? "bg-white border border-neutral-200"
                                : "bg-neutral-900 text-white"
                            }`}
                          >
                            {msg.text}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatMessages[chat.id] || ""}
                          onChange={(e) =>
                            setChatMessages({
                              ...chatMessages,
                              [chat.id]: e.target.value,
                            })
                          }
                          placeholder="Escribe un mensaje..."
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => {
                            if (chatMessages[chat.id]?.trim()) {
                              onSendOwnerMessage(
                                chat.id,
                                chatMessages[chat.id],
                              );
                              setChatMessages({
                                ...chatMessages,
                                [chat.id]: "",
                              });
                            }
                          }}
                          className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuración */}
            {activeTab === "config" && (
              <div className="space-y-6">
                {/* Gestión de Tipos */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">
                    Gestión de Tipos
                  </h2>
                  <p className="text-sm text-neutral-600 mb-6">
                    Agrega, edita y elimina tipos de productos (Tienda, Mercado,
                    Arte, etc.)
                  </p>

                  {/* Formulario para agregar nuevo tipo */}
                  <div className="bg-neutral-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      AGREGAR NUEVO TIPO
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          NOMBRE DEL TIPO *
                        </label>
                        <input
                          type="text"
                          value={newTipoNombre}
                          onChange={(e) => setNewTipoNombre(e.target.value)}
                          placeholder="Ej. Tienda, Mercado, Arte..."
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          DESCRIPCIÓN
                        </label>
                        <input
                          type="text"
                          value={newTipoDescripcion}
                          onChange={(e) =>
                            setNewTipoDescripcion(e.target.value)
                          }
                          placeholder="Descripción opcional..."
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAddTipo}
                      className="mt-3 px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-all"
                    >
                      + Agregar Tipo
                    </button>
                  </div>

                  {/* Lista de tipos existentes */}
                  <div className="space-y-3">
                    {tipos.map((tipo) => (
                      <div
                        key={tipo.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                      >
                        {editingTipoId === tipo.id ? (
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editTipoNombre}
                              onChange={(e) =>
                                setEditTipoNombre(e.target.value)
                              }
                              className="px-3 py-2 border border-neutral-300 rounded-lg"
                              placeholder="Nombre del tipo"
                            />
                            <input
                              type="text"
                              value={editTipoDescripcion}
                              onChange={(e) =>
                                setEditTipoDescripcion(e.target.value)
                              }
                              className="px-3 py-2 border border-neutral-300 rounded-lg"
                              placeholder="Descripción"
                            />
                          </div>
                        ) : (
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900">
                              {tipo.nombre}
                            </h4>
                            {tipo.descripcion && (
                              <p className="text-xs text-neutral-600 mt-1">
                                {tipo.descripcion}
                              </p>
                            )}
                            <p className="text-xs text-neutral-500 mt-1">
                              {getCategoriasByTipo(tipo.id).length} categorías
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 ml-4">
                          {editingTipoId === tipo.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEditTipo(tipo.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Guardar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingTipoId(null)}
                                className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditTipo(tipo)}
                                className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTipo(tipo.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gestión de Categorías */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">
                    Gestión de Categorías
                  </h2>
                  <p className="text-sm text-neutral-600 mb-6">
                    Agrega, edita y elimina categorías para cada tipo
                  </p>

                  {/* Formulario para agregar nueva categoría */}
                  <div className="bg-neutral-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      AGREGAR NUEVA CATEGORÍA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          TIPO *
                        </label>
                        <select
                          value={newCatTipoId}
                          onChange={(e) =>
                            setNewCatTipoId(Number(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                          {tipos.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                              {tipo.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          NOMBRE DE LA CATEGORÍA *
                        </label>
                        <input
                          type="text"
                          value={newCatNombre}
                          onChange={(e) => setNewCatNombre(e.target.value)}
                          placeholder="Ej. Accesorios, Panadería, Bebidas..."
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAddCategoria}
                      className="mt-3 px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-all"
                    >
                      + Agregar Categoría
                    </button>
                  </div>

                  {/* Lista de categorías por tipo */}
                  <div className="space-y-6">
                    {tipos.map((tipo) => {
                      const cats = getCategoriasByTipo(tipo.id);
                      return (
                        <div
                          key={tipo.id}
                          className="border border-neutral-200 rounded-xl p-4"
                        >
                          <h4 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {tipo.nombre}
                            <span className="text-xs font-normal text-neutral-500">
                              ({cats.length} categorías)
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {cats.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                              >
                                {editingCatId === cat.id ? (
                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      value={editCatNombre}
                                      onChange={(e) =>
                                        setEditCatNombre(e.target.value)
                                      }
                                      className="px-3 py-2 border border-neutral-300 rounded-lg"
                                      placeholder="Nombre de la categoría"
                                    />
                                    <select
                                      value={editCatTipoId}
                                      onChange={(e) =>
                                        setEditCatTipoId(Number(e.target.value))
                                      }
                                      className="px-3 py-2 border border-neutral-300 rounded-lg"
                                    >
                                      {tipos.map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.nombre}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="flex-1">
                                    <h5 className="font-medium text-neutral-900">
                                      {cat.nombre}
                                    </h5>
                                    <p className="text-xs text-neutral-500">
                                      {getProductosCount(cat.id)} productos
                                    </p>
                                  </div>
                                )}
                                <div className="flex gap-2 ml-4">
                                  {editingCatId === cat.id ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleSaveEditCategoria(cat.id)
                                        }
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                        title="Guardar"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setEditingCatId(null)}
                                        className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg"
                                        title="Cancelar"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditCategoria(cat)}
                                        className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg"
                                        title="Editar"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteCategoria(cat.id)
                                        }
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            {cats.length === 0 && (
                              <p className="text-sm text-neutral-500 italic">
                                No hay categorías para este tipo
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Configuración General */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h2 className="text-xl font-bold text-neutral-900 mb-6">
                    Configuración General
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        NOMBRE DE LA TIENDA
                      </label>
                      <input
                        type="text"
                        value={configForm.storeName}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            storeName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        NÚMERO DE WHATSAPP
                      </label>
                      <input
                        type="text"
                        value={configForm.whatsappNumber}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            whatsappNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        PLANTILLA DE MENSAJE
                      </label>
                      <textarea
                        value={configForm.whatsappTemplate}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            whatsappTemplate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        CONTRASEÑA DEL PANEL
                      </label>
                      <input
                        type="text"
                        value={configForm.ownerPassword}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            ownerPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                      />
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      className="px-6 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
                    >
                      Guardar Configuración
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
