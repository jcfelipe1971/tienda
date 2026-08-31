import express from "express";
import cors from "cors";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import {
  DatabaseSchema,
  Product,
  StoreSettings,
  ChatSession,
  ChatMessage,
} from "./src/types";

dotenv.config();

// Conexión a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "sql_9yemu7",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sql_9yemu7",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función central para obtener todo el esquema desde MySQL
async function getDb(): Promise<DatabaseSchema> {
  // 1. Configuración
  const [settingsRows]: any = await pool.query(
    "SELECT clave, valor FROM settings",
  );
  const settings: StoreSettings = {
    storeName: "Arnielys & Juank • Nueva Moda 2026",
    whatsappNumber: "5352943409",
    whatsappTemplate:
      "¡Hola! Me interesa comprar el producto *{name}* (Precio: *{price}*, Talla: *{size}*, Color: *{color}*). ¿Está disponible?",
    aiAssistantEnabled: false,
    aiAssistantTone: "Amistoso, servicial y profesional",
    ownerPassword: "Cage2004",
  };
  for (const row of settingsRows) {
    if (row.clave === "aiAssistantEnabled")
      settings.aiAssistantEnabled = row.valor === "1";
    else if (row.clave === "ownerPassword") settings.ownerPassword = row.valor;
    else settings[row.clave] = row.valor;
  }

  // 2. Tipos y Categorías (Directo de MySQL)
  const [tiposRows]: any = await pool.query(
    "SELECT id, nombre, descripcion FROM tipos ORDER BY id ASC",
  );
  const [categoriasRows]: any = await pool.query(
    "SELECT id, nombre, tipo_id FROM categorias ORDER BY id ASC",
  );

  // 3. Productos (Artículos)
  const [articulosRows]: any = await pool.query(
    "SELECT id, codigo, nombre, descripcion, imagen, precio, tipo_id, categoria_id, categoria, tallas, colores, stock, destacado FROM articulos ORDER BY id ASC",
  );
  const products: Product[] = articulosRows.map((row: any) => {
    const imgs = row.imagen
      ? row.imagen
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"];
    const sizes = row.tallas
      ? row.tallas
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    const colors = row.colores
      ? row.colores
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    return {
      id: String(row.id),
      code: row.codigo || `COD-${String(row.id).padStart(3, "0")}`,
      name: row.nombre,
      description: row.descripcion || "",
      tipo_id: row.tipo_id || 1,
      categoria_id: row.categoria_id || 1,
      category: row.categoria || "ropa",
      storeType:
        row.tipo_id === 2 ? "mercado" : row.tipo_id === 3 ? "arte" : "tienda",
      price: Number(row.precio),
      images: imgs,
      sizes: sizes,
      colors: colors,
      stock: Number(row.stock),
      featured: Boolean(row.destacado),
    };
  });

  // 4. Chats
  const [chatsRows]: any = await pool.query(
    "SELECT id, customerName, createdAt, updatedAt, messages, unread FROM chats ORDER BY updatedAt DESC",
  );
  const chats: ChatSession[] = chatsRows.map((row: any) => ({
    id: row.id,
    customerName: row.customerName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    messages:
      typeof row.messages === "string"
        ? JSON.parse(row.messages)
        : row.messages,
    unread: Boolean(row.unread),
  }));

  // 5. Visitas
  const [countResult]: any = await pool.query(
    "SELECT COUNT(*) as total FROM visitas",
  );
  const [todayResult]: any = await pool.query(
    "SELECT COUNT(*) as total FROM visitas WHERE DATE(fecha) = CURDATE()",
  );
  const [visitasRows]: any = await pool.query(
    "SELECT id, fecha, ip, user_agent FROM visitas ORDER BY fecha DESC LIMIT 50",
  );

  const visitsLog = visitasRows.map((row: any) => ({
    id: String(row.id),
    timestamp: row.fecha,
    ip: row.ip,
    userAgent: row.user_agent,
  }));

  return {
    settings,
    tipos: tiposRows,
    categorias: categoriasRows,
    products,
    chats,
    visits: {
      totalVisits: countResult[0].total,
      visitsToday: todayResult[0].total,
      visitsLog,
    },
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/api/db", async (_req, res) => {
    try {
      res.json(await getDb());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/visits", async (_req, res) => {
    try {
      const [countResult]: any = await pool.query(
        "SELECT COUNT(*) as total FROM visitas",
      );
      const [todayResult]: any = await pool.query(
        "SELECT COUNT(*) as total FROM visitas WHERE DATE(fecha) = CURDATE()",
      );
      const [visitasRows]: any = await pool.query(
        "SELECT id, fecha, ip, user_agent FROM visitas ORDER BY fecha DESC LIMIT 50",
      );
      res.json({
        totalVisits: countResult[0].total,
        visitsToday: todayResult[0].total,
        visitsLog: visitasRows.map((row: any) => ({
          id: String(row.id),
          timestamp: row.fecha,
          ip: row.ip,
          userAgent: row.user_agent,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/visits", async (req, res) => {
    try {
      const userAgent = (req.headers["user-agent"] as string) || "";
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      await pool.query(
        "INSERT INTO visitas (fecha, ip, user_agent) VALUES (NOW(), ?, ?)",
        [ip, userAgent],
      );

      const [countResult]: any = await pool.query(
        "SELECT COUNT(*) as total FROM visitas",
      );
      const [todayResult]: any = await pool.query(
        "SELECT COUNT(*) as total FROM visitas WHERE DATE(fecha) = CURDATE()",
      );
      res.json({
        success: true,
        visits: {
          totalVisits: countResult[0].total,
          visitsToday: todayResult[0].total,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/verify-password", async (req, res) => {
    try {
      const { password } = req.body || {};
      const [rows]: any = await pool.query(
        "SELECT valor FROM settings WHERE clave = 'ownerPassword'",
      );
      const dbPassword = rows.length > 0 ? rows[0].valor : "Cage2004";
      if (password === dbPassword) return res.json({ success: true });
      return res
        .status(401)
        .json({ success: false, error: "Contraseña incorrecta" });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const body = req.body as StoreSettings;
      const updates = [
        ["storeName", body.storeName],
        ["whatsappNumber", body.whatsappNumber],
        ["whatsappTemplate", body.whatsappTemplate],
        ["aiAssistantEnabled", body.aiAssistantEnabled ? "1" : "0"],
        ["aiAssistantTone", body.aiAssistantTone],
        ["ownerPassword", body.ownerPassword],
      ];
      for (const [clave, valor] of updates) {
        await pool.query(
          "INSERT INTO settings (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?",
          [clave, valor, valor],
        );
      }
      res.json({ success: true, settings: body });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= GESTIÓN DE TIPOS =================
  app.get("/api/tipos", async (_req, res) => {
    try {
      const [rows]: any = await pool.query(
        "SELECT id, nombre, descripcion FROM tipos ORDER BY id ASC",
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tipos", async (req, res) => {
    try {
      const { nombre, descripcion } = req.body || {};
      if (!nombre || !nombre.trim())
        return res
          .status(400)
          .json({ error: "El nombre del tipo es obligatorio" });
      const [result]: any = await pool.query(
        "INSERT INTO tipos (nombre, descripcion) VALUES (?, ?)",
        [nombre.trim(), descripcion?.trim() || ""],
      );
      const [rows]: any = await pool.query(
        "SELECT id, nombre, descripcion FROM tipos ORDER BY id ASC",
      );
      res.json({
        success: true,
        tipo: {
          id: result.insertId,
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || "",
        },
        tipos: rows,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/tipos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [productos]: any = await pool.query(
        "SELECT COUNT(*) as count FROM articulos WHERE tipo_id = ?",
        [id],
      );
      if (productos[0].count > 0)
        return res
          .status(400)
          .json({
            error: `No se puede eliminar: hay ${productos[0].count} producto(s) de este tipo.`,
          });

      await pool.query("DELETE FROM categorias WHERE tipo_id = ?", [id]);
      await pool.query("DELETE FROM tipos WHERE id = ?", [id]);

      const [rows]: any = await pool.query(
        "SELECT id, nombre, descripcion FROM tipos ORDER BY id ASC",
      );
      const [catRows]: any = await pool.query(
        "SELECT id, nombre, tipo_id FROM categorias ORDER BY id ASC",
      );
      res.json({ success: true, tipos: rows, categorias: catRows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= GESTIÓN DE CATEGORÍAS =================
  app.get("/api/categorias", async (_req, res) => {
    try {
      const [rows]: any = await pool.query(
        "SELECT id, nombre, tipo_id FROM categorias ORDER BY id ASC",
      );
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/categorias", async (req, res) => {
    try {
      const { nombre, tipo_id } = req.body || {};
      if (!nombre || !nombre.trim())
        return res
          .status(400)
          .json({ error: "El nombre de la categoría es obligatorio" });
      const [result]: any = await pool.query(
        "INSERT INTO categorias (nombre, tipo_id) VALUES (?, ?)",
        [nombre.trim(), tipo_id ? Number(tipo_id) : null],
      );
      const [rows]: any = await pool.query(
        "SELECT id, nombre, tipo_id FROM categorias ORDER BY id ASC",
      );
      res.json({
        success: true,
        categoria: {
          id: result.insertId,
          nombre: nombre.trim(),
          tipo_id: tipo_id ? Number(tipo_id) : null,
        },
        categorias: rows,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/categorias/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [productos]: any = await pool.query(
        "SELECT COUNT(*) as count FROM articulos WHERE categoria_id = ?",
        [id],
      );
      if (productos[0].count > 0)
        return res
          .status(400)
          .json({
            error: `No se puede eliminar: hay ${productos[0].count} producto(s) usando esta categoría.`,
          });

      await pool.query("DELETE FROM categorias WHERE id = ?", [id]);
      const [rows]: any = await pool.query(
        "SELECT id, nombre, tipo_id FROM categorias ORDER BY id ASC",
      );
      res.json({ success: true, categorias: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= GESTIÓN DE PRODUCTOS =================
  app.post("/api/products", async (req, res) => {
    try {
      const body = req.body as any;
      let imgs: string[] = [];
      if (Array.isArray(body.images)) {
        imgs = body.images
          .flatMap((item: any) =>
            typeof item === "string" ? item.split(",") : [],
          )
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else if (typeof body.images === "string") {
        imgs = body.images
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      if (imgs.length === 0)
        imgs = [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
        ];

      const tipo_id = body.tipo_id || 1;
      const categoria_id = body.categoria_id || 1;
      const code = body.code || `COD-${Date.now().toString().slice(-6)}`;
      const isUpdate =
        body.id &&
        !String(body.id).startsWith("prod-") &&
        !isNaN(Number(body.id));

      if (isUpdate) {
        await pool.query(
          `UPDATE articulos SET codigo = ?, nombre = ?, descripcion = ?, imagen = ?, precio = ?, tipo_id = ?, categoria_id = ?, tallas = ?, colores = ?, stock = ?, destacado = ? WHERE id = ?`,
          [
            code,
            body.name,
            body.description || "",
            imgs.join(","),
            body.price,
            tipo_id,
            categoria_id,
            body.sizes?.join(",") || "",
            body.colors?.join(",") || "",
            body.stock || 0,
            body.featured ? 1 : 0,
            Number(body.id),
          ],
        );
      } else {
        await pool.query(
          `INSERT INTO articulos (codigo, nombre, descripcion, imagen, precio, tipo_id, categoria_id, tallas, colores, stock, destacado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            code,
            body.name,
            body.description || "",
            imgs.join(","),
            body.price,
            tipo_id,
            categoria_id,
            body.sizes?.join(",") || "",
            body.colors?.join(",") || "",
            body.stock || 0,
            body.featured ? 1 : 0,
          ],
        );
      }
      res.json({ success: true, product: body });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!isNaN(Number(id)))
        await pool.query("DELETE FROM articulos WHERE id = ?", [Number(id)]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= GESTIÓN DE CHATS =================
  app.get("/api/chats", async (_req, res) => {
    try {
      const [rows]: any = await pool.query(
        "SELECT id, customerName, createdAt, updatedAt, messages, unread FROM chats ORDER BY updatedAt DESC",
      );
      res.json(
        rows.map((row: any) => ({
          ...row,
          messages:
            typeof row.messages === "string"
              ? JSON.parse(row.messages)
              : row.messages,
          unread: Boolean(row.unread),
        })),
      );
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chats", async (req, res) => {
    try {
      const { customerName } = req.body || {};
      const name = customerName || "Cliente";
      const [rows]: any = await pool.query(
        "SELECT id, customerName, createdAt, updatedAt, messages, unread FROM chats WHERE LOWER(customerName) = LOWER(?)",
        [name],
      );

      if (rows.length > 0) {
        return res.json({
          ...rows[0],
          messages:
            typeof rows[0].messages === "string"
              ? JSON.parse(rows[0].messages)
              : rows[0].messages,
          unread: Boolean(rows[0].unread),
        });
      }

      const chatId = "chat-" + Date.now();
      const now = new Date().toISOString();
      const messages = [
        {
          id: "msg-welcome",
          sender: "owner",
          text: `¡Hola ${name}! Bienvenido a nuestra tienda. ¿En qué podemos ayudarte hoy?`,
          timestamp: now,
        },
      ];

      await pool.query(
        "INSERT INTO chats (id, customerName, createdAt, updatedAt, messages, unread) VALUES (?, ?, ?, ?, ?, ?)",
        [chatId, name, now, now, JSON.stringify(messages), 0],
      );
      res.json({
        id: chatId,
        customerName: name,
        createdAt: now,
        updatedAt: now,
        messages,
        unread: false,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { sender, text } = req.body || {};

      const [rows]: any = await pool.query(
        "SELECT id, customerName, createdAt, updatedAt, messages, unread FROM chats WHERE id = ?",
        [chatId],
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "Chat no encontrado" });

      const chat = rows[0];
      const messages =
        typeof chat.messages === "string"
          ? JSON.parse(chat.messages)
          : chat.messages;
      const newMessage: ChatMessage = {
        id: "msg-" + Date.now(),
        sender: sender || "customer",
        text: text || "",
        timestamp: new Date().toISOString(),
      };
      messages.push(newMessage);

      const unread = sender === "customer" ? 1 : 0;
      const now = new Date().toISOString();

      await pool.query(
        "UPDATE chats SET messages = ?, updatedAt = ?, unread = ? WHERE id = ?",
        [JSON.stringify(messages), now, unread, chatId],
      );

      res.json({
        id: chatId,
        customerName: chat.customerName,
        createdAt: chat.createdAt,
        updatedAt: now,
        messages,
        unread,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Servir frontend
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) =>
      res.sendFile(path.join(distPath, "index.html")),
    );
  }

  app.listen(PORT, "0.0.0.0", () =>
    console.log(
      `Servidor corriendo en http://localhost:${PORT} (Conectado a MySQL - sql_9yemu7)`,
    ),
  );
}

startServer().catch((err) =>
  console.error("Error al iniciar el servidor:", err),
);
