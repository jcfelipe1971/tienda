// Ya NO hay tipos hardcodeados. Todo viene de la BD.
export type StoreType = string; // "tienda", "mercado", "arte", etc.

export interface Tipo {
  id: number;
  nombre: string;
  descripcion: string;
  categorias: Categoria[];
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Product {
  id: string;
  code?: string;
  name: string;
  description: string;
  category: string;
  storeType: StoreType;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  tipo_id: number;       // ID del tipo en la BD
  categoria_id: number;  // ID de la categoría en la BD
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  whatsappTemplate: string;
  aiAssistantEnabled: boolean;
  aiAssistantTone: string;
  ownerPassword?: string;
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "owner" | "ai";
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  unread: boolean;
}

export interface VisitsData {
  totalVisits: number;
  visitsToday: number;
  visitsLog: any[];
}