export type StoreType = "tienda" | "mercado";

export interface Tipo {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  tipo_id?: number | null;
}

export interface Product {
  id: string;
  code?: string;
  name: string;
  description: string;
  tipo_id: number;        // Nuevo: ID del tipo (Tienda/Mercado)
  categoria_id: number;   // Nuevo: ID de la categoría
  // Mantenemos estos por compatibilidad temporal, pero el sistema usará los IDs
  category?: string;      
  storeType?: StoreType;  
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
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
  sender: 'customer' | 'owner' | 'ai';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  unread?: boolean;
}

export interface VisitsData {
  totalVisits: number;
  visitsToday: number;
  visitsLog?: any[];
}

export interface DatabaseSchema {
  settings: StoreSettings;
  tipos: Tipo[];
  categorias: Categoria[];
  products: Product[];
  chats: ChatSession[];
  visits?: VisitsData;
}