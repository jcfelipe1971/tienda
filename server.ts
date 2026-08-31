import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { DatabaseSchema, Product, StoreSettings, ChatSession, ChatMessage, Tipo, Categoria } from "./src/types";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

const DB_PATH = path.resolve(process.cwd(), "db.json");

const INITIAL_DB: DatabaseSchema = {
  settings: {
    storeName: "Arnielys & Juank • NUEVO ESTILO",
    whatsappNumber: "5352943409",
    whatsappTemplate: "¡Hola! Me interesa comprar el producto *{name}* [Cód: *{code}*] (Precio: *{price}*, Talla: *{size}*, Color: *{color}*). ¿Está disponible?",
    aiAssistantEnabled: false,
    aiAssistantTone: "Amistoso, servicial y profesional",
    ownerPassword: "1234"
  },
  tipos: [
    { id: 1, nombre: "Tienda", descripcion: "Productos exclusivos de la tienda principal" },
    { id: 2, nombre: "Mercado", descripcion: "Productos disponibles en el mercado o catálogo extendido" }
  ],
  categorias: [
    { id: 1, nombre: "Ropa", tipo_id: null },
    { id: 2, nombre: "Zapatos", tipo_id: null },
    { id: 3, nombre: "Dulcería", tipo_id: 2 }
  ],
  products: [],
  chats: [],
  visits: { totalVisits: 0, visitsToday: 0, visitsLog: [] }
};

function getNombreTipo(db: DatabaseSchema, tipo_id: number): string {
  const tipo = db.tipos?.find((t: Tipo) => t.id === tipo_id);
  return tipo ? tipo.nombre : 'Desconocido';
}

function getNombreCategoria(db: DatabaseSchema, categoria_id: number): string {
  const cat = db.categorias?.find((c: Categoria) => c.id === categoria_id);
  return cat ? cat.nombre : 'Desconocida';
}

async function readDb(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.tipos) parsed.tipos = INITIAL_DB.tipos;
    if (!parsed.categorias) parsed.categorias = INITIAL_DB.categorias;
    parsed.settings.whatsappNumber = "5352943409";
    parsed.settings.aiAssistantEnabled = false;
    if (!parsed.settings.storeName || parsed.settings.storeName === "Vogue & Walk" || parsed.settings.storeName.includes("Aura Studio")) {
      parsed.settings.storeName = "Arnielys & Juank • NUEVO ESTILO";
    }
    if (!parsed.settings.ownerPassword) parsed.settings.ownerPassword = "1234";
    if (!parsed.visits) parsed.visits = { totalVisits: 0, visitsToday: 0, visitsLog: [] };
    if (Array.isArray(parsed.products)) {
      parsed.products = parsed.products.map((p: any, idx: number) => {
        let imgs: string[] = [];
        if (Array.isArray(p.images)) {
          imgs = p.images.flatMap((item: any) => (typeof item === "string" ? item.split(",") : [])).map((s: string) => s.trim()).filter(Boolean);
        } else if (typeof p.images === "string") {
          imgs = p.images.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        if (imgs.length === 0) imgs = ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
        const num = p.id ? String(p.id).replace(/\D/g, "") : (idx + 1).toString();
        const code = p.code && String(p.code).trim() ? String(p.code).trim() : (num ? `COD-${num.padStart(3, "0")}` : `COD-${(idx + 1).toString().padStart(3, "0")}`);
        const tipoId = p.tipo_id || (p.storeType === "mercado" ? 2 : 1);
        const catId = p.categoria_id || 1;
        return { ...p, code, images: imgs, tipo_id: tipoId, categoria_id: catId };
      });
    }
    return parsed;
  } catch (err) {
    await writeDb(INITIAL_DB);
    return INITIAL_DB;
  }
}

async function writeDb(db: DatabaseSchema): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(cors());
  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/api/db", async (_req, res) => {
    try { const db = await readDb(); res.json(db); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/visits", async (_req, res) => {
    try {
      const db = await readDb();
      const todayStr = new Date().toISOString().slice(0, 10);
      const visitsLog = db.visits?.visitsLog || [];
      const visitsToday = visitsLog.filter((v: any) => v.timestamp?.startsWith(todayStr)).length;
      res.json({ totalVisits: db.visits?.totalVisits || 0, visitsToday, visitsLog: visitsLog.slice(-50) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/visits", async (req, res) => {
    try {
      const db = await readDb();
      if (!db.visits) db.visits = { totalVisits: 0, visitsToday: 0, visitsLog: [] };
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const userAgent = (req.headers["user-agent"] as string) || "";
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
      db.visits.totalVisits = (db.visits.totalVisits || 0) + 1;
      if (!db.visits.visitsLog) db.visits.visitsLog = [];
      db.visits.visitsLog.push({ id: "v-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4), timestamp: now.toISOString(), ip, userAgent });
      if (db.visits.visitsLog.length > 500) db.visits.visitsLog = db.visits.visitsLog.slice(-500);
      db.visits.visitsToday = db.visits.visitsLog.filter((v: any) => v.timestamp?.startsWith(todayStr)).length;
      await writeDb(db);
      res.json({ success: true, visits: { totalVisits: db.visits.totalVisits, visitsToday: db.visits.visitsToday, visitsLog: db.visits.visitsLog.slice(-50) } });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/verify-password", async (req, res) => {
    try {
      const { password } = req.body || {};
      const db = await readDb();
      if (password === (db.settings.ownerPassword || "1234")) return res.json({ success: true });
      return res.status(401).json({ success: false, error: "Contraseña incorrecta" });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const body = req.body as StoreSettings;
      const db = await readDb();
      db.settings = { ...db.settings, ...body };
      await writeDb(db);
      res.json({ success: true, settings: db.settings });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ============ NUEVOS ENDPOINTS: GESTIÓN DE TIPOS Y CATEGORÍAS ============

  app.get("/api/tipos", async (_req, res) => {
    try { const db = await readDb(); res.json(db.tipos || []); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/categorias", async (_req, res) => {
    try { const db = await readDb(); res.json(db.categorias || []); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/categorias", async (req, res) => {
    try {
      const { nombre, tipo_id } = req.body || {};
      if (!nombre || !nombre.trim()) return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
      const db = await readDb();
      const newId = db.categorias.length > 0 ? Math.max(...db.categorias.map((c: Categoria) => c.id)) + 1 : 1;
      const nuevaCategoria: Categoria = {
        id: newId,
        nombre: nombre.trim(),
        tipo_id: tipo_id ? Number(tipo_id) : null
      };
      db.categorias.push(nuevaCategoria);
      await writeDb(db);
      res.json({ success: true, categoria: nuevaCategoria, categorias: db.categorias });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/categorias/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const db = await readDb();
      // Verificar si hay productos usando esta categoría
      const productosUsandola = db.products.filter((p: Product) => p.categoria_id === id);
      if (productosUsandola.length > 0) {
        return res.status(400).json({ error: `No se puede eliminar: hay ${productosUsandola.length} producto(s) usando esta categoría.` });
      }
      db.categorias = db.categorias.filter((c: Categoria) => c.id !== id);
      await writeDb(db);
      res.json({ success: true, categorias: db.categorias });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/tipos", async (req, res) => {
    try {
      const { nombre, descripcion } = req.body || {};
      if (!nombre || !nombre.trim()) return res.status(400).json({ error: "El nombre del tipo es obligatorio" });
      const db = await readDb();
      const newId = db.tipos.length > 0 ? Math.max(...db.tipos.map((t: Tipo) => t.id)) + 1 : 1;
      const nuevoTipo: Tipo = { id: newId, nombre: nombre.trim(), descripcion: descripcion?.trim() || "" };
      db.tipos.push(nuevoTipo);
      await writeDb(db);
      res.json({ success: true, tipo: nuevoTipo, tipos: db.tipos });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/tipos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const db = await readDb();
      const productosUsandolo = db.products.filter((p: Product) => p.tipo_id === id);
      if (productosUsandolo.length > 0) {
        return res.status(400).json({ error: `No se puede eliminar: hay ${productosUsandolo.length} producto(s) de este tipo.` });
      }
      // También eliminar categorías asociadas
      db.categorias = db.categorias.filter((c: Categoria) => c.tipo_id !== id);
      db.tipos = db.tipos.filter((t: Tipo) => t.id !== id);
      await writeDb(db);
      res.json({ success: true, tipos: db.tipos, categorias: db.categorias });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ============ FIN NUEVOS ENDPOINTS ============

  app.post("/api/products", async (req, res) => {
    try {
      const body = req.body as any;
      const db = await readDb();
      let imgs: string[] = [];
      if (Array.isArray(body.images)) {
        imgs = body.images.flatMap((item: any) => (typeof item === "string" ? item.split(",") : [])).map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof body.images === "string") {
        imgs = body.images.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
      if (imgs.length === 0) imgs = ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
      body.images = imgs;
      if (!body.tipo_id) body.tipo_id = 1;
      if (!body.categoria_id) body.categoria_id = 1;
      if (body.id) {
        const index = db.products.findIndex((p: Product) => p.id === body.id);
        if (index !== -1) db.products[index] = body;
        else db.products.push(body);
      } else {
        body.id = "prod-" + Date.now();
        db.products.push(body);
      }
      await writeDb(db);
      res.json({ success: true, product: body });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const db = await readDb();
      db.products = db.products.filter((p: Product) => p.id !== id);
      await writeDb(db);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/chats", async (_req, res) => {
    try { const db = await readDb(); res.json(db.chats); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/chats", async (req, res) => {
    try {
      const { customerName } = req.body || {};
      const db = await readDb();
      let chat = db.chats.find((ch: ChatSession) => ch.customerName.toLowerCase() === (customerName || "").toLowerCase());
      if (!chat) {
        chat = {
          id: "chat-" + Date.now(),
          customerName: customerName || "Cliente",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [{ id: "msg-welcome", sender: "owner", text: `¡Hola ${customerName || "Cliente"}! Bienvenido a nuestra tienda. ¿En qué podemos ayudarte hoy?`, timestamp: new Date().toISOString() }],
          unread: false
        };
        db.chats.push(chat);
        await writeDb(db);
      }
      res.json(chat);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { sender, text } = req.body || {};
      const db = await readDb();
      const chatIndex = db.chats.findIndex((ch: ChatSession) => ch.id === chatId);
      if (chatIndex === -1) return res.status(404).json({ error: "Chat no encontrado" });
      const chat = db.chats[chatIndex];
      const newMessage: ChatMessage = { id: "msg-" + Date.now(), sender: sender || "customer", text: text || "", timestamp: new Date().toISOString() };
      chat.messages.push(newMessage);
      chat.updatedAt = new Date().toISOString();
      if (sender === "customer") chat.unread = true;
      else chat.unread = false;
      await writeDb(db);
      const ai = getGeminiClient();
      if (sender === "customer" && db.settings.aiAssistantEnabled && ai) {
        try {
          const productsListString = db.products.map((p: Product) => `- [ID: ${p.id}, Cód: ${p.code || "N/A"}] ${p.name} (${getNombreTipo(db, p.tipo_id)} / ${getNombreCategoria(db, p.categoria_id)}): $${p.price}. Descripción: ${p.description}. Colores: ${p.colors.join(", ")}. Tallas: ${p.sizes.join(", ")}. Stock: ${p.stock} unidades.`).join("\n");
          const chatHistoryString = chat.messages.slice(-8).map((m: ChatMessage) => `${m.sender === "customer" ? "Cliente" : m.sender === "ai" ? "Asistente AI" : "Dueño"}: ${m.text}`).join("\n");
          const systemPrompt = `Actúas como un asistente inteligente de ventas de la tienda "${db.settings.storeName}". Sé amable, servicial y breve (máximo 2 párrafos). Tono: ${db.settings.aiAssistantTone || "Amistoso y profesional"}. Inventario:\n${productsListString}\nWhatsApp: ${db.settings.whatsappNumber}\nHistorial:\n${chatHistoryString}\nResponde al último mensaje del cliente:`;
          const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: systemPrompt, config: { temperature: 0.7 } });
          const aiReplyText = response.text || "Gracias por tu mensaje. El dueño revisará esto pronto.";
          chat.messages.push({ id: "msg-ai-" + Date.now(), sender: "ai", text: aiReplyText.trim(), timestamp: new Date().toISOString() });
          chat.updatedAt = new Date().toISOString();
          await writeDb(db);
        } catch (err) { console.error("Error invoking Gemini:", err); }
      }
      res.json(chat);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer().catch((err) => console.error("Failed to start server:", err));