import { Product, Tipo } from "./types";
import { ShoppingBag, Store, Palette, Home, Monitor, Music, Gem, UtensilsCrossed, Package } from "lucide-react";

// Mapeo dinámico de iconos según el nombre del tipo (de la BD)
const iconMap: Record<string, any> = {
  tienda: ShoppingBag,
  mercado: Store,
  arte: Palette,
  hogar: Home,
  tecnologia: Monitor,
  musica: Music,
  joyeria: Gem,
  gastronomia: UtensilsCrossed,
  default: Package,
};

export function getIconForSection(tipoNombre: string) {
  const key = tipoNombre.toLowerCase().trim();
  return iconMap[key] || iconMap.default;
}

// Formatea el nombre de la categoría para mostrarlo bonito
export function formatCategoryName(category: string): string {
  if (!category) return "General";
  const clean = category.trim();
  return clean
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Genera código de producto
export function getProductCode(product: { id?: string; code?: string }): string {
  if (product.code && product.code.trim()) return product.code.trim();
  if (!product.id) return "COD-001";
  const digits = product.id.replace(/\D/g, "");
  if (digits) return `COD-${digits.padStart(3, "0")}`;
  return `COD-${product.id.slice(-4).toUpperCase()}`;
}