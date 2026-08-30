var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_fs = require("fs");
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new import_genai.GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}
var DB_PATH = import_path.default.resolve(process.cwd(), "db.json");
var INITIAL_DB = {
  settings: {
    storeName: "Arnielys & Juank \u2022 NUEVO ESTILO",
    whatsappNumber: "5352943409",
    whatsappTemplate: "\xA1Hola! Me interesa comprar el producto *{name}* [C\xF3d: *{code}*] (Precio: *{price}*, Talla: *{size}*, Color: *{color}*). \xBFEst\xE1 disponible?",
    aiAssistantEnabled: false,
    aiAssistantTone: "Amistoso, servicial y profesional",
    ownerPassword: "1234"
  },
  tipos: [
    { id: 1, nombre: "Tienda", descripcion: "Productos exclusivos de la tienda principal" },
    { id: 2, nombre: "Mercado", descripcion: "Productos disponibles en el mercado o cat\xE1logo extendido" }
  ],
  categorias: [
    { id: 1, nombre: "Ropa", tipo_id: null },
    { id: 2, nombre: "Zapatos", tipo_id: null },
    { id: 3, nombre: "Dulcer\xEDa", tipo_id: 2 }
  ],
  products: [],
  chats: [],
  visits: { totalVisits: 0, visitsToday: 0, visitsLog: [] }
};
function getNombreTipo(db, tipo_id) {
  const tipo = db.tipos?.find((t) => t.id === tipo_id);
  return tipo ? tipo.nombre : "Desconocido";
}
function getNombreCategoria(db, categoria_id) {
  const cat = db.categorias?.find((c) => c.id === categoria_id);
  return cat ? cat.nombre : "Desconocida";
}
async function readDb() {
  try {
    const data = await import_fs.promises.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.tipos) parsed.tipos = INITIAL_DB.tipos;
    if (!parsed.categorias) parsed.categorias = INITIAL_DB.categorias;
    parsed.settings.whatsappNumber = "5352943409";
    parsed.settings.aiAssistantEnabled = false;
    if (!parsed.settings.storeName || parsed.settings.storeName === "Vogue & Walk" || parsed.settings.storeName.includes("Aura Studio")) {
      parsed.settings.storeName = "Arnielys & Juank \u2022 NUEVO ESTILO";
    }
    if (!parsed.settings.ownerPassword) parsed.settings.ownerPassword = "1234";
    if (!parsed.visits) parsed.visits = { totalVisits: 0, visitsToday: 0, visitsLog: [] };
    if (Array.isArray(parsed.products)) {
      parsed.products = parsed.products.map((p, idx) => {
        let imgs = [];
        if (Array.isArray(p.images)) {
          imgs = p.images.flatMap((item) => typeof item === "string" ? item.split(",") : []).map((s) => s.trim()).filter(Boolean);
        } else if (typeof p.images === "string") {
          imgs = p.images.split(",").map((s) => s.trim()).filter(Boolean);
        }
        if (imgs.length === 0) imgs = ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
        const num = p.id ? String(p.id).replace(/\D/g, "") : (idx + 1).toString();
        const code = p.code && String(p.code).trim() ? String(p.code).trim() : num ? `COD-${num.padStart(3, "0")}` : `COD-${(idx + 1).toString().padStart(3, "0")}`;
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
async function writeDb(db) {
  await import_fs.promises.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((0, import_cors.default)());
  app.use(import_express.default.json({ limit: "25mb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/db", async (_req, res) => {
    try {
      const db = await readDb();
      res.json(db);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/visits", async (_req, res) => {
    try {
      const db = await readDb();
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const visitsLog = db.visits?.visitsLog || [];
      const visitsToday = visitsLog.filter((v) => v.timestamp?.startsWith(todayStr)).length;
      res.json({ totalVisits: db.visits?.totalVisits || 0, visitsToday, visitsLog: visitsLog.slice(-50) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/visits", async (req, res) => {
    try {
      const db = await readDb();
      if (!db.visits) db.visits = { totalVisits: 0, visitsToday: 0, visitsLog: [] };
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const userAgent = req.headers["user-agent"] || "";
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      db.visits.totalVisits = (db.visits.totalVisits || 0) + 1;
      if (!db.visits.visitsLog) db.visits.visitsLog = [];
      db.visits.visitsLog.push({ id: "v-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4), timestamp: now.toISOString(), ip, userAgent });
      if (db.visits.visitsLog.length > 500) db.visits.visitsLog = db.visits.visitsLog.slice(-500);
      db.visits.visitsToday = db.visits.visitsLog.filter((v) => v.timestamp?.startsWith(todayStr)).length;
      await writeDb(db);
      res.json({ success: true, visits: { totalVisits: db.visits.totalVisits, visitsToday: db.visits.visitsToday, visitsLog: db.visits.visitsLog.slice(-50) } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/verify-password", async (req, res) => {
    try {
      const { password } = req.body || {};
      const db = await readDb();
      if (password === (db.settings.ownerPassword || "1234")) return res.json({ success: true });
      return res.status(401).json({ success: false, error: "Contrase\xF1a incorrecta" });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });
  app.put("/api/settings", async (req, res) => {
    try {
      const body = req.body;
      const db = await readDb();
      db.settings = { ...db.settings, ...body };
      await writeDb(db);
      res.json({ success: true, settings: db.settings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/tipos", async (_req, res) => {
    try {
      const db = await readDb();
      res.json(db.tipos || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/categorias", async (_req, res) => {
    try {
      const db = await readDb();
      res.json(db.categorias || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/categorias", async (req, res) => {
    try {
      const { nombre, tipo_id } = req.body || {};
      if (!nombre || !nombre.trim()) return res.status(400).json({ error: "El nombre de la categor\xEDa es obligatorio" });
      const db = await readDb();
      const newId = db.categorias.length > 0 ? Math.max(...db.categorias.map((c) => c.id)) + 1 : 1;
      const nuevaCategoria = {
        id: newId,
        nombre: nombre.trim(),
        tipo_id: tipo_id ? Number(tipo_id) : null
      };
      db.categorias.push(nuevaCategoria);
      await writeDb(db);
      res.json({ success: true, categoria: nuevaCategoria, categorias: db.categorias });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/categorias/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const db = await readDb();
      const productosUsandola = db.products.filter((p) => p.categoria_id === id);
      if (productosUsandola.length > 0) {
        return res.status(400).json({ error: `No se puede eliminar: hay ${productosUsandola.length} producto(s) usando esta categor\xEDa.` });
      }
      db.categorias = db.categorias.filter((c) => c.id !== id);
      await writeDb(db);
      res.json({ success: true, categorias: db.categorias });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/tipos", async (req, res) => {
    try {
      const { nombre, descripcion } = req.body || {};
      if (!nombre || !nombre.trim()) return res.status(400).json({ error: "El nombre del tipo es obligatorio" });
      const db = await readDb();
      const newId = db.tipos.length > 0 ? Math.max(...db.tipos.map((t) => t.id)) + 1 : 1;
      const nuevoTipo = { id: newId, nombre: nombre.trim(), descripcion: descripcion?.trim() || "" };
      db.tipos.push(nuevoTipo);
      await writeDb(db);
      res.json({ success: true, tipo: nuevoTipo, tipos: db.tipos });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/tipos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const db = await readDb();
      const productosUsandolo = db.products.filter((p) => p.tipo_id === id);
      if (productosUsandolo.length > 0) {
        return res.status(400).json({ error: `No se puede eliminar: hay ${productosUsandolo.length} producto(s) de este tipo.` });
      }
      db.categorias = db.categorias.filter((c) => c.tipo_id !== id);
      db.tipos = db.tipos.filter((t) => t.id !== id);
      await writeDb(db);
      res.json({ success: true, tipos: db.tipos, categorias: db.categorias });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/products", async (req, res) => {
    try {
      const body = req.body;
      const db = await readDb();
      let imgs = [];
      if (Array.isArray(body.images)) {
        imgs = body.images.flatMap((item) => typeof item === "string" ? item.split(",") : []).map((s) => s.trim()).filter(Boolean);
      } else if (typeof body.images === "string") {
        imgs = body.images.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (imgs.length === 0) imgs = ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
      body.images = imgs;
      if (!body.tipo_id) body.tipo_id = 1;
      if (!body.categoria_id) body.categoria_id = 1;
      if (body.id) {
        const index = db.products.findIndex((p) => p.id === body.id);
        if (index !== -1) db.products[index] = body;
        else db.products.push(body);
      } else {
        body.id = "prod-" + Date.now();
        db.products.push(body);
      }
      await writeDb(db);
      res.json({ success: true, product: body });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const db = await readDb();
      db.products = db.products.filter((p) => p.id !== id);
      await writeDb(db);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/chats", async (_req, res) => {
    try {
      const db = await readDb();
      res.json(db.chats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/chats", async (req, res) => {
    try {
      const { customerName } = req.body || {};
      const db = await readDb();
      let chat = db.chats.find((ch) => ch.customerName.toLowerCase() === (customerName || "").toLowerCase());
      if (!chat) {
        chat = {
          id: "chat-" + Date.now(),
          customerName: customerName || "Cliente",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          messages: [{ id: "msg-welcome", sender: "owner", text: `\xA1Hola ${customerName || "Cliente"}! Bienvenido a nuestra tienda. \xBFEn qu\xE9 podemos ayudarte hoy?`, timestamp: (/* @__PURE__ */ new Date()).toISOString() }],
          unread: false
        };
        db.chats.push(chat);
        await writeDb(db);
      }
      res.json(chat);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { sender, text } = req.body || {};
      const db = await readDb();
      const chatIndex = db.chats.findIndex((ch) => ch.id === chatId);
      if (chatIndex === -1) return res.status(404).json({ error: "Chat no encontrado" });
      const chat = db.chats[chatIndex];
      const newMessage = { id: "msg-" + Date.now(), sender: sender || "customer", text: text || "", timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      chat.messages.push(newMessage);
      chat.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (sender === "customer") chat.unread = true;
      else chat.unread = false;
      await writeDb(db);
      const ai = getGeminiClient();
      if (sender === "customer" && db.settings.aiAssistantEnabled && ai) {
        try {
          const productsListString = db.products.map((p) => `- [ID: ${p.id}, C\xF3d: ${p.code || "N/A"}] ${p.name} (${getNombreTipo(db, p.tipo_id)} / ${getNombreCategoria(db, p.categoria_id)}): $${p.price}. Descripci\xF3n: ${p.description}. Colores: ${p.colors.join(", ")}. Tallas: ${p.sizes.join(", ")}. Stock: ${p.stock} unidades.`).join("\n");
          const chatHistoryString = chat.messages.slice(-8).map((m) => `${m.sender === "customer" ? "Cliente" : m.sender === "ai" ? "Asistente AI" : "Due\xF1o"}: ${m.text}`).join("\n");
          const systemPrompt = `Act\xFAas como un asistente inteligente de ventas de la tienda "${db.settings.storeName}". S\xE9 amable, servicial y breve (m\xE1ximo 2 p\xE1rrafos). Tono: ${db.settings.aiAssistantTone || "Amistoso y profesional"}. Inventario:
${productsListString}
WhatsApp: ${db.settings.whatsappNumber}
Historial:
${chatHistoryString}
Responde al \xFAltimo mensaje del cliente:`;
          const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: systemPrompt, config: { temperature: 0.7 } });
          const aiReplyText = response.text || "Gracias por tu mensaje. El due\xF1o revisar\xE1 esto pronto.";
          chat.messages.push({ id: "msg-ai-" + Date.now(), sender: "ai", text: aiReplyText.trim(), timestamp: (/* @__PURE__ */ new Date()).toISOString() });
          chat.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          await writeDb(db);
        } catch (err) {
          console.error("Error invoking Gemini:", err);
        }
      }
      res.json(chat);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => res.sendFile(import_path.default.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}
startServer().catch((err) => console.error("Failed to start server:", err));
//# sourceMappingURL=server.cjs.map
