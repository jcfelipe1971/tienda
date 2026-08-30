// Props actualizadas
interface OwnerDashboardProps {
  settings: StoreSettings;
  productos: Product[];
  tipos: Tipo[]; // ← NUEVO: viene de la BD
  chats: ChatSession[];
  visits?: VisitsData;
  onUpdateSettings: (s: StoreSettings) => Promise<void>;
  onSaveProduct: (p: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onRefreshData: () => void;
}

// Dentro del componente, estados para crear tipos/categorías:
const [nuevoTipoNombre, setNuevoTipoNombre] = useState("");
const [nuevoTipoDescripcion, setNuevoTipoDescripcion] = useState("");
const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
const [categoriaParaTipoId, setCategoriaParaTipoId] = useState<number>(tipos[0]?.id || 0);

// Handlers para crear desde el panel
const handleCrearTipo = async () => {
  if (!nuevoTipoNombre.trim()) return;
  await fetch("/api/tipos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: nuevoTipoNombre, descripcion: nuevoTipoDescripcion }),
  });
  setNuevoTipoNombre("");
  setNuevoTipoDescripcion("");
  onRefreshData();
};

const handleCrearCategoria = async () => {
  if (!nuevaCategoriaNombre.trim() || !categoriaParaTipoId) return;
  await fetch("/api/categorias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: nuevaCategoriaNombre, tipo_id: categoriaParaTipoId }),
  });
  setNuevaCategoriaNombre("");
  onRefreshData();
};

const handleEliminarTipo = async (id: number) => {
  if (!confirm("¿Eliminar este tipo y todas sus categorías?")) return;
  await fetch(`/api/tipos/${id}`, { method: "DELETE" });
  onRefreshData();
};

const handleEliminarCategoria = async (id: number) => {
  if (!confirm("¿Eliminar esta categoría?")) return;
  await fetch(`/api/categorias/${id}`, { method: "DELETE" });
  onRefreshData();
};