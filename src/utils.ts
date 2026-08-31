import { Product, Categoria, Tipo } from "./types";

export function getApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.endsWith("run.app")) {
      const pathname = window.location.pathname;
      const baseDir = pathname.substring(0, pathname.lastIndexOf("/") + 1) || "/";
      const cleanBaseDir = baseDir.endsWith("/") ? baseDir : baseDir + "/";
      return `${cleanBaseDir}api.php${path}`;
    }
    if (window.location.port === "3001") {
      return `http://localhost:3000${path}`;
    }
  }
  return path;
}


export function getNombreCategoria(categorias: Categoria[] = [], categoria_id: number): string {
  const cat = categorias.find(c => c.id === categoria_id);
  return cat ? cat.nombre : "General";
}

export function getNombreTipo(tipos: Tipo[] = [], tipo_id: number): string {
  const tipo = tipos.find(t => t.id === tipo_id);
  return tipo ? tipo.nombre : "Tienda";
}

export function getProductCode(product: { id?: string; code?: string }): string {
  if (product.code && product.code.trim()) {
    return product.code.trim();
  }
  if (!product.id) return "COD-001";
  const digits = product.id.replace(/\D/g, "");
  if (digits) {
    return `COD-${digits.padStart(3, "0")}`;
  }
  return `COD-${product.id.slice(-4).toUpperCase()}`;
}

export function formatCategoryName(category: string): string {
  if (!category) return "General";
  const clean = category.trim();
  const lower = clean.toLowerCase();

  if (lower === "ropa") return "Ropa";
  if (lower === "zapatos" || lower === "calzado") return "Zapatos y Calzado";
  if (lower === "accesorios") return "Accesorios";
  if (lower === "carnicos" || lower === "cárnicos") return "Cárnicos";
  if (lower === "dulceria" || lower === "dulcería") return "Dulcería";
  if (lower === "viveres" || lower === "víveres") return "Víveres";
  if (lower === "lacteos" || lower === "lácteos") return "Lácteos";
  if (lower === "bebidas") return "Bebidas";
  if (lower === "verduras" || lower === "vegetales") return "Verduras";

  return clean.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}

/**
 * Devuelve ÚNICAMENTE las categorías (nombres) que tienen al menos un producto 
 * en el tipo dado (Tienda o Mercado).
 */
export function getCategoriesWithProducts(
  products: Product[] = [],
  categorias: Categoria[] = [],
  tipos: Tipo[] = [],
  tipoNombre: string // "Tienda" o "Mercado"
): string[] {
  const tipo = tipos.find(t => t.nombre.toLowerCase() === tipoNombre.toLowerCase());
  if (!tipo) return [];

  const categorySet = new Set<string>();

  products.forEach((p) => {
    if (p.tipo_id === tipo.id) {
      const catName = getNombreCategoria(categorias, p.categoria_id);
      if (catName && catName !== "General") {
        categorySet.add(catName);
      }
    }
  });

  return Array.from(categorySet).sort();
}

export function normalizeProductImages(images: string[] | string | undefined): string[] {
  if (!images) return ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
  if (Array.isArray(images)) {
    const list = images.flatMap((item) => (typeof item === "string" ? item.split(",") : [])).map((s) => s.trim()).filter(Boolean);
    return list.length > 0 ? list : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
  }
  if (typeof images === "string") {
    const list = images.split(",").map((s) => s.trim()).filter(Boolean);
    return list.length > 0 ? list : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
  }
  return ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
}