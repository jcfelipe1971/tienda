import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "dist")));
app.use("/imagenes", express.static(path.join(__dirname, "public/imagenes")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sql_9yemu7",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ============================================
// ENDPOINT: Obtener TIPOS con sus CATEGORÍAS
// ============================================
app.get("/api/tipos", async (req, res) => {
  try {
    const [tipos] = await pool.query("SELECT id, nombre, descripcion FROM tipos ORDER BY id");
    const [categorias] = await pool.query("SELECT id, nombre, tipo_id FROM categorias ORDER BY id");

    const resultado = (tipos as any[]).map(t => ({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion || "",
      categorias: (categorias as any[])
        .filter(c => c.tipo_id === t.id)
        .map(c => ({ id: c.id, nombre: c.nombre }))
    }));

    res.json(resultado);
  } catch (err) {
    console.error("Error tipos:", err);
    res.status(500).json({ error: "Error al obtener tipos" });
  }
});

// ============================================
// ENDPOINT: Crear TIPO
// ============================================
app.post("/api/tipos", async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const [result] = await pool.query(
      "INSERT INTO tipos (nombre, descripcion) VALUES (?, ?)",
      [nombre, descripcion || ""]
    );
    res.json({ ok: true, id: (result as any).insertId });
  } catch (err) {
    res.status(500).json({ error: "Error al crear tipo" });
  }
});

// ============================================
// ENDPOINT: Eliminar TIPO
// ============================================
app.delete("/api/tipos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM tipos WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar tipo" });
  }
});

// ============================================
// ENDPOINT: Crear CATEGORÍA
// ============================================
app.post("/api/categorias", async (req, res) => {
  try {
    const { nombre, tipo_id } = req.body;
    const [result] = await pool.query(
      "INSERT INTO categorias (nombre, tipo_id) VALUES (?, ?)",
      [nombre, tipo_id]
    );
    res.json({ ok: true, id: (result as any).insertId });
  } catch (err) {
    res.status(500).json({ error: "Error al crear categoría" });
  }
});

// ============================================
// ENDPOINT: Eliminar CATEGORÍA
// ============================================
app.delete("/api/categorias/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM categorias WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
});

// ============================================
// ENDPOINT: Registrar visita
// ============================================
app.post("/api/visitas", async (req, res) => {
  try {
    const { ip, userAgent } = req.body;
    await pool.query(
      "INSERT INTO visitas (fecha, ip, user_agent) VALUES (NOW(), ?, ?)",
      [ip || "", userAgent || ""]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// ENDPOINT: Obtener visitas
// ============================================
app.get("/api/visitas", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM visitas ORDER BY fecha DESC");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisits = (rows as any[]).filter(r => new Date(r.fecha) >= today).length;
    res.json({ totalVisits: rows.length, visitsToday: todayVisits, visitsLog: rows });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// ENDPOINT: Obtener productos
// ============================================
app.get("/api/productos", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, t.nombre as tipo_nombre, c.nombre as categoria_nombre
       FROM articulos a
       LEFT JOIN tipos t ON a.tipo_id = t.id
       LEFT JOIN categorias c ON a.categoria_id = c.id
       ORDER BY a.id DESC`
    );
    const products = (rows as any[]).map(r => ({
      id: `prod-${r.id}`,
      code: `COD-${String(r.id).padStart(3, "0")}`,
      name: r.nombre,
      description: r.descripcion || "",
      category: r.categoria_nombre || "",
      storeType: r.tipo_nombre ? r.tipo_nombre.toLowerCase() : "tienda",
      price: Number(r.precio),
      images: r.imagen ? r.imagen.split(",").map((s: string) => s.trim()) : [],
      sizes: r.tallas ? r.tallas.split(",").map((s: string) => s.trim()) : [],
      colors: r.colores ? r.colores.split(",").map((s: string) => s.trim()) : [],
      stock: r.stock,
      featured: Boolean(r.destacado),
      tipo_id: r.tipo_id,
      categoria_id: r.categoria_id,
    }));
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// ENDPOINT: Guardar producto
// ============================================
app.post("/api/productos", async (req, res) => {
  try {
    const p = req.body;
    if (p.id && p.id.startsWith("prod-")) {
      const id = parseInt(p.id.replace("prod-", ""));
      await pool.query(
        `UPDATE articulos SET nombre=?, descripcion=?, imagen=?, precio=?, tipo_id=?, categoria_id=?, tallas=?, colores=?, stock=?, destacado=? WHERE id=?`,
        [p.name, p.description, (p.images || []).join(","), p.price, p.tipo_id, p.categoria_id, (p.sizes || []).join(","), (p.colors || []).join(","), p.stock, p.featured ? 1 : 0, id]
      );
    } else {
      await pool.query(
        `INSERT INTO articulos (nombre, descripcion, imagen, precio, tipo_id, categoria_id, tallas, colores, stock, destacado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.name, p.description, (p.images || []).join(","), p.price, p.tipo_id, p.categoria_id, (p.sizes || []).join(","), (p.colors || []).join(","), p.stock, p.featured ? 1 : 0]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// ENDPOINT: Eliminar producto
// ============================================
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id.replace("prod-", ""));
    await pool.query("DELETE FROM articulos WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// ENDPOINT: Obtener settings
// ============================================
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM settings");
    const settings: Record<string, any> = {};
    (rows as any[]).forEach(r => {
      if (r.valor === "0" || r.valor === "1") settings[r.clave] = r.valor === "1";
      else settings[r.clave] = r.valor;
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// ENDPOINT: Guardar settings
// ============================================
app.post("/api/settings", async (req, res) => {
  try {
    const s = req.body;
    for (const [clave, valor] of Object.entries(s)) {
      let val = valor;
      if (typeof valor === "boolean") val = valor ? "1" : "0";
      await pool.query(
        "INSERT INTO settings (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)",
        [clave, String(val)]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// ENDPOINT: Obtener chats
// ============================================
app.get("/api/chats", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM chats ORDER BY updatedAt DESC");
    res.json((rows as any[]).map(r => ({ ...r, messages: JSON.parse(r.messages || "[]") })));
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// ENDPOINT: Guardar chat
// ============================================
app.post("/api/chats", async (req, res) => {
  try {
    const c = req.body;
    await pool.query(
      "INSERT INTO chats (id, customerName, createdAt, updatedAt, messages, unread) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE messages = VALUES(messages), updatedAt = VALUES(updatedAt), unread = VALUES(unread)",
      [c.id, c.customerName, c.createdAt, c.updatedAt, JSON.stringify(c.messages), c.unread ? 1 : 0]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================================
// SPA fallback
// ============================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ============================================
// INICIO DEL SERVIDOR (Estructura original restaurada)
// ============================================
async function startServer() {
  try {
    // Verificar conexión a la base de datos antes de levantar el servidor
    await pool.query("SELECT 1");
    console.log("✅ Conexión a la base de datos establecida correctamente.");
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to database or start server:", err);
    process.exit(1);
  }
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});