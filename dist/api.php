<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// -------------------------------------------------------------
// CONFIGURACIÓN DE BASE DE DATOS MYSQL (Cuentas del hosting)
// -------------------------------------------------------------
$host = "localhost";
$usuario = "sql_9yemu7";
$clave = "A1@zV3BWmYZpt";
$bd = "sql_9yemu7";

$conexion = new mysqli($host, $usuario, $clave, $bd);

if ($conexion->connect_error) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error de conexión a la base de datos MySQL: " . $conexion->connect_error,
        "suggestion" => "Por favor verifica los datos de conexión en api.php"
    ]);
    exit;
}

$conexion->set_charset("utf8mb4");

// -------------------------------------------------------------
// CONFIGURACIÓN OPCIONAL PARA EL ASISTENTE DE INTELIGENCIA ARTIFICIAL (GEMINI)
// -------------------------------------------------------------
// Si deseas usar el Asistente AI en tu hosting, introduce tu API Key de Gemini aquí:
if (!defined('GEMINI_API_KEY')) {
    define('GEMINI_API_KEY', ''); 
}

// -------------------------------------------------------------
// CREACIÓN Y ACTUALIZACIÓN AUTOMÁTICA DE TABLAS (MIGRACIONES)
// -------------------------------------------------------------

// 1. Tabla de Chats
$conexion->query("CREATE TABLE IF NOT EXISTS chats (
    id VARCHAR(100) PRIMARY KEY,
    customerName VARCHAR(255) NOT NULL,
    createdAt VARCHAR(100) NOT NULL,
    updatedAt VARCHAR(100) NOT NULL,
    messages TEXT NOT NULL,
    unread TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// 1.5. Tabla de Visitas Reales a la Web
$conexion->query("CREATE TABLE IF NOT EXISTS visitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL,
    ip VARCHAR(45) DEFAULT '',
    user_agent TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// 2. Tabla de Ajustes (Settings)
$conexion->query("CREATE TABLE IF NOT EXISTS settings (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// Inicializar ajustes por defecto si está vacía o asegurar que exista ownerPassword
$res_settings = $conexion->query("SELECT * FROM settings");
if ($res_settings->num_rows === 0) {
    $default_settings = [
        "storeName" => "Arnielys & Juank • NUEVO ESTILO",
        "whatsappNumber" => "5352943409",
        "whatsappTemplate" => "¡Hola! Me interesa comprar el producto *{name}* (Precio: *{price}*, Talla: *{size}*, Color: *{color}*). ¿Está disponible?",
        "aiAssistantEnabled" => "0",
        "aiAssistantTone" => "Amistoso, servicial y profesional",
        "ownerPassword" => "1234"
    ];
    foreach ($default_settings as $k => $v) {
        $stmt = $conexion->prepare("INSERT INTO settings (clave, valor) VALUES (?, ?)");
        $stmt->bind_param("ss", $k, $v);
        $stmt->execute();
        $stmt->close();
    }
} else {
    // Asegurar que exista ownerPassword en settings
    $check_password = $conexion->query("SELECT * FROM settings WHERE clave = 'ownerPassword'");
    if ($check_password->num_rows === 0) {
        $stmt = $conexion->prepare("INSERT INTO settings (clave, valor) VALUES ('ownerPassword', '1234')");
        $stmt->execute();
        $stmt->close();
    }
}

// 3. Tabla de Artículos (Compatibilidad con el frontend de React)
$conexion->query("CREATE TABLE IF NOT EXISTS articulos (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(500),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// Asegurar que existan todos los campos que requiere el frontend de React
$columns_to_add = [
    'precio' => "DECIMAL(10,2) DEFAULT 0.00",
    'categoria' => "VARCHAR(50) DEFAULT 'ropa'",
    'tallas' => "VARCHAR(255) DEFAULT ''",
    'colores' => "VARCHAR(255) DEFAULT ''",
    'stock' => "INT DEFAULT 10",
    'destacado' => "TINYINT(1) DEFAULT 0",
    'codigo' => "VARCHAR(50) DEFAULT ''",
    'tipo_id' => "INT NOT NULL DEFAULT 1",
    'categoria_id' => "INT NOT NULL DEFAULT 1"
];

foreach ($columns_to_add as $col_name => $col_definition) {
    $check_col = $conexion->query("SHOW COLUMNS FROM articulos LIKE '$col_name'");
    if ($check_col->num_rows === 0) {
        $conexion->query("ALTER TABLE articulos ADD COLUMN $col_name $col_definition");
    }
}

// 3.1 Tabla de Tipos (Tienda / Mercado)
$conexion->query("CREATE TABLE IF NOT EXISTS tipos (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

$res_tipos = $conexion->query("SELECT * FROM tipos");
if ($res_tipos->num_rows === 0) {
    $conexion->query("INSERT INTO tipos (id, nombre, descripcion) VALUES
        (1, 'Tienda', 'Productos exclusivos de la tienda principal'),
        (2, 'Mercado', 'Productos disponibles en el mercado o catálogo extendido')");
}

// 3.2 Tabla de Categorías (ligadas a un tipo)
$conexion->query("CREATE TABLE IF NOT EXISTS categorias (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo_id INT DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

$res_categorias = $conexion->query("SELECT * FROM categorias");
if ($res_categorias->num_rows === 0) {
    $conexion->query("INSERT INTO categorias (nombre, tipo_id) VALUES
        ('ropa', 1),
        ('zapatos', 1),
        ('otros', 1),
        ('Dulcería', 2),
        ('Víveres', 2),
        ('Cárnicos', 2),
        ('Lácteos', 2),
        ('Bebidas', 2)");
}

// Inicializar artículos de prueba si está vacía
$res_articulos = $conexion->query("SELECT * FROM articulos");
if ($res_articulos->num_rows === 0) {
    $default_products = [
        [
            "nombre" => "Chaqueta de Cuero Vintage",
            "descripcion" => "Chaqueta clásica de cuero genuino envejecido con detalles de cremallera metálica y forro interior suave. Una prenda atemporal para cualquier ocasión que combina elegancia y resistencia.",
            "imagen" => "imagenes/articulo1.png",
            "precio" => 129.99,
            "categoria" => "ropa",
            "tallas" => "S,M,L,XL",
            "colores" => "Negro,Marrón",
            "stock" => 8,
            "destacado" => 1
        ],
        [
            "nombre" => "Tenis Urban Comfort",
            "descripcion" => "Zapatos deportivos ultra cómodos con suela de espuma viscoelástica de doble densidad. Ideales para caminatas largas y uso casual diario con máxima amortiguación y soporte.",
            "imagen" => "imagenes/articulo2.png",
            "precio" => 79.99,
            "categoria" => "zapatos",
            "tallas" => "38,39,40,41,42,43",
            "colores" => "Rojo,Negro,Blanco",
            "stock" => 14,
            "destacado" => 1
        ],
        [
            "nombre" => "Sudadera Oversize Minimalista",
            "descripcion" => "Sudadera con capucha confeccionada en algodón orgánico pesado. Corte holgado moderno con puños acanalados y bolsillo canguro frontal de alta durabilidad.",
            "imagen" => "imagenes/articulo3.png",
            "precio" => 49.99,
            "categoria" => "ropa",
            "tallas" => "M,L,XL",
            "colores" => "Gris,Beige,Verde Oliva",
            "stock" => 20,
            "destacado" => 0
        ],
        [
            "nombre" => "Botas de Cuero Clásicas",
            "descripcion" => "Botas robustas hechas a mano con cuero resistente al agua. Suela dentada antideslizante de larga duración, cordones encerados premium y costuras reforzadas.",
            "imagen" => "imagenes/articulo4.png",
            "precio" => 110.00,
            "categoria" => "zapatos",
            "tallas" => "39,40,41,42,43",
            "colores" => "Marrón Oscuro,Negro",
            "stock" => 6,
            "destacado" => 1
        ],
        [
            "nombre" => "Pantalones Cargo Urbanos",
            "descripcion" => "Pantalones con múltiples bolsillos de carga reforzados, fabricados en lona de algodón duradera y rodillas preformadas para máxima flexibilidad urbana.",
            "imagen" => "imagenes/articulo5.png",
            "precio" => 64.99,
            "categoria" => "ropa",
            "tallas" => "28,30,32,34,36",
            "colores" => "Verde Militar,Negro,Kaki",
            "stock" => 12,
            "destacado" => 0
        ]
    ];
    
    foreach ($default_products as $prod) {
        $stmt = $conexion->prepare("INSERT INTO articulos (nombre, descripcion, imagen, precio, categoria, tallas, colores, stock, destacado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssdssssi", 
            $prod['nombre'], 
            $prod['descripcion'], 
            $prod['imagen'], 
            $prod['precio'], 
            $prod['categoria'], 
            $prod['tallas'], 
            $prod['colores'], 
            $prod['stock'], 
            $prod['destacado']
        );
        $stmt->execute();
        $stmt->close();
    }
}

// -------------------------------------------------------------
// FUNCIONES AUXILIARES DE MAPEO Y LLAMADAS DE API
// -------------------------------------------------------------

// Mapea una fila de MySQL (de la tabla articulos) al formato que espera React
function mapRowToProduct($row) {
    $imagen = isset($row['imagen']) ? trim($row['imagen']) : '';
    $images = [];
    if (!empty($imagen)) {
        if (strpos($imagen, '[') === 0) {
            $decoded = json_decode($imagen, true);
            if (is_array($decoded)) {
                $images = array_values(array_filter(array_map('trim', $decoded)));
            } else {
                $images = [$imagen];
            }
        } else if (strpos($imagen, ',') !== false) {
            $images = array_values(array_filter(array_map('trim', explode(',', $imagen))));
        } else {
            $images = [$imagen];
        }
    }
    
    if (empty($images)) {
        $images = ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80"];
    }

    $id = isset($row['id']) ? 'prod-' . $row['id'] : 'prod-' . uniqid();
    $raw_id = isset($row['id']) ? (string)$row['id'] : '1';
    $codigo = !empty($row['codigo']) ? $row['codigo'] : ('COD-' . str_pad($raw_id, 3, '0', STR_PAD_LEFT));
    $nombre = isset($row['nombre']) ? $row['nombre'] : 'Producto';
    $descripcion = isset($row['descripcion']) ? $row['descripcion'] : '';
    $category = isset($row['categoria']) ? $row['categoria'] : 'ropa';
    $tipo_id = isset($row['tipo_id']) ? (int)$row['tipo_id'] : 1;
    $categoria_id = isset($row['categoria_id']) ? (int)$row['categoria_id'] : 1;
    $price = isset($row['precio']) ? (float)$row['precio'] : 0.00;
    $stock = isset($row['stock']) ? (int)$row['stock'] : 10;
    $featured = isset($row['destacado']) ? (bool)$row['destacado'] : false;

    // Tallas
    $sizes_val = isset($row['tallas']) ? $row['tallas'] : '';
    if (!empty($sizes_val)) {
        $sizes = array_map('trim', explode(',', $sizes_val));
    } else {
        $sizes = $category === 'zapatos' ? ["38", "39", "40", "41", "42"] : ["S", "M", "L", "XL"];
    }

    // Colores
    $colors_val = isset($row['colores']) ? $row['colores'] : '';
    if (!empty($colors_val)) {
        $colors = array_map('trim', explode(',', $colors_val));
    } else {
        $colors = ["Negro", "Blanco"];
    }

    return [
        "id" => $id,
        "code" => $codigo,
        "name" => $nombre,
        "description" => $descripcion,
        "category" => $category,
        "tipo_id" => $tipo_id,
        "categoria_id" => $categoria_id,
        "price" => $price,
        "images" => $images,
        "sizes" => $sizes,
        "colors" => $colors,
        "stock" => $stock,
        "featured" => $featured
    ];
}

// Función para interactuar con la API de Gemini (AI) usando cURL en PHP
function getGeminiReply($prompt, $apiKey) {
    if (empty($apiKey)) return null;
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;
    
    $data = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ],
        "generationConfig" => [
            "temperature" => 0.7
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $resData = json_decode($response, true);
        if (isset($resData['candidates'][0]['content']['parts'][0]['text'])) {
            return trim($resData['candidates'][0]['content']['parts'][0]['text']);
        }
    }
    return null;
}

// -------------------------------------------------------------
// ENRUTADOR DE SOLICITUDES API (CORS, PATHS, MÉTODOS)
// -------------------------------------------------------------
$uri = $_SERVER['REQUEST_URI'];
$script_name = $_SERVER['SCRIPT_NAME'];
$base_dir = dirname($script_name);
if ($base_dir !== '/' && strpos($uri, $base_dir) === 0) {
    $uri = substr($uri, strlen($base_dir));
}

$path = parse_url($uri, PHP_URL_PATH);

// Normalizar el path para remover '/api.php' o 'api.php' si están al principio (PathInfo routing)
if (strpos($path, '/api.php') === 0) {
    $path = substr($path, strlen('/api.php'));
} elseif (strpos($path, 'api.php') === 0) {
    $path = substr($path, strlen('api.php'));
}

// Soporte opcional para paso de ruta por query parameter (?route=/api/db)
if (isset($_GET['route'])) {
    $path = $_GET['route'];
    if (strpos($path, '/') !== 0) {
        $path = '/' . $path;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

// Obtener Ajustes de forma rápida
function getStoreSettings($conexion, $include_password = false) {
    $res = $conexion->query("SELECT * FROM settings");
    $settings = [];
    while ($row = $res->fetch_assoc()) {
        $clave = $row['clave'];
        $val = $row['valor'];
        if ($clave === 'ownerPassword' && !$include_password) {
            continue;
        }
        if ($clave === 'storeName' && (empty($val) || $val === 'Vogue & Walk' || strpos($val, 'Aura Studio') !== false)) {
            $val = 'Arnielys & Juank • NUEVO ESTILO';
            // Actualizar en la BD para que se guarde el cambio
            $stmt = $conexion->prepare("UPDATE settings SET valor = ? WHERE clave = 'storeName'");
            $stmt->bind_param("s", $val);
            $stmt->execute();
            $stmt->close();
        }
        if ($clave === 'aiAssistantEnabled') {
            $settings[$clave] = (bool)$val;
        } else if ($clave === 'categories') {
            $settings[$clave] = json_decode($val, true) ?: [];
        } else {
            $settings[$clave] = $val;
        }
    }
    if (!isset($settings['storeName'])) {
        $settings['storeName'] = 'Arnielys & Juank • NUEVO ESTILO';
    }
    return $settings;
}

// Obtener resumen de Visitas Reales
function getVisitsSummary($conexion) {
    $total_res = $conexion->query("SELECT COUNT(*) as total FROM visitas");
    $total = 0;
    if ($total_res && $row = $total_res->fetch_assoc()) {
        $total = (int)$row['total'];
    }
    
    $today_res = $conexion->query("SELECT COUNT(*) as total_today FROM visitas WHERE DATE(fecha) = CURDATE()");
    $today = 0;
    if ($today_res && $row = $today_res->fetch_assoc()) {
        $today = (int)$row['total_today'];
    }
    
    $logs_res = $conexion->query("SELECT id, fecha as timestamp, ip, user_agent as userAgent FROM visitas ORDER BY id DESC LIMIT 50");
    $logs = [];
    if ($logs_res) {
        while ($r = $logs_res->fetch_assoc()) {
            $logs[] = [
                "id" => "v-" . $r['id'],
                "timestamp" => $r['timestamp'],
                "ip" => $r['ip'],
                "userAgent" => $r['userAgent']
            ];
        }
    }
    
    return [
        "totalVisits" => $total,
        "visitsToday" => $today,
        "visitsLog" => $logs
    ];
}

// 1. GET /api/db - Obtener estado completo de la Base de Datos
if (($path === '/api/db' || $path === '/api/db/') && $method === 'GET') {
    $settings = getStoreSettings($conexion, true);
    
    // Obtener Productos (Artículos)
    $products_res = $conexion->query("SELECT * FROM articulos");
    $products = [];
    while ($row = $products_res->fetch_assoc()) {
        $products[] = mapRowToProduct($row);
    }
    
    // Obtener Tipos
    $tipos_res = $conexion->query("SELECT * FROM tipos ORDER BY id ASC");
    $tipos = [];
    while ($row = $tipos_res->fetch_assoc()) {
        $tipos[] = [
            "id" => (int)$row['id'],
            "nombre" => $row['nombre'],
            "descripcion" => isset($row['descripcion']) ? $row['descripcion'] : ''
        ];
    }
    
    // Obtener Categorías
    $categorias_res = $conexion->query("SELECT * FROM categorias ORDER BY id ASC");
    $categorias = [];
    while ($row = $categorias_res->fetch_assoc()) {
        $categorias[] = [
            "id" => (int)$row['id'],
            "nombre" => $row['nombre'],
            "tipo_id" => isset($row['tipo_id']) && $row['tipo_id'] !== null ? (int)$row['tipo_id'] : null
        ];
    }
    
    // Obtener Chats
    $chats_res = $conexion->query("SELECT * FROM chats ORDER BY updatedAt DESC");
    $chats = [];
    while ($row = $chats_res->fetch_assoc()) {
        $chats[] = [
            "id" => $row['id'],
            "customerName" => $row['customerName'],
            "createdAt" => $row['createdAt'],
            "updatedAt" => $row['updatedAt'],
            "messages" => json_decode($row['messages'], true) ?: [],
            "unread" => (bool)$row['unread']
        ];
    }
    
    echo json_encode([
        "settings" => $settings,
        "products" => $products,
        "tipos" => $tipos,
        "categorias" => $categorias,
        "chats" => $chats,
        "visits" => getVisitsSummary($conexion)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1.2. POST /api/visits & GET /api/visits - Registrar e inspeccionar visitas reales
if (($path === '/api/visits' || $path === '/api/visits/') && $method === 'POST') {
    $ip = isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '127.0.0.1');
    $ua = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
    $now = date('Y-m-d H:i:s');
    
    $stmt = $conexion->prepare("INSERT INTO visitas (fecha, ip, user_agent) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $now, $ip, $ua);
    $stmt->execute();
    $stmt->close();
    
    $visits = getVisitsSummary($conexion);
    echo json_encode(["status" => "ok", "visits" => $visits]);
    exit;
}

if (($path === '/api/visits' || $path === '/api/visits/') && $method === 'GET') {
    $visits = getVisitsSummary($conexion);
    echo json_encode($visits);
    exit;
}

// 1.5. POST /api/verify-password - Verificar contraseña del panel del dueño
if (($path === '/api/verify-password' || $path === '/api/verify-password/') && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $password = isset($input['password']) ? $input['password'] : '';
    
    $stmt = $conexion->prepare("SELECT valor FROM settings WHERE clave = 'ownerPassword'");
    $stmt->execute();
    $res = $stmt->get_result();
    $actualPassword = "1234";
    if ($row = $res->fetch_assoc()) {
        $actualPassword = $row['valor'];
    }
    $stmt->close();
    
    if ($password === $actualPassword) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Contraseña incorrecta"]);
    }
    exit;
}

// 2. PUT /api/settings - Guardar configuraciones generales
if (($path === '/api/settings' || $path === '/api/settings/') && $method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input) {
        foreach ($input as $clave => $valor) {
            if (is_bool($valor)) {
                $valor = $valor ? '1' : '0';
            } else if (is_array($valor)) {
                $valor = json_encode($valor, JSON_UNESCAPED_UNICODE);
            }
            $stmt = $conexion->prepare("INSERT INTO settings (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?");
            $stmt->bind_param("sss", $clave, $valor, $valor);
            $stmt->execute();
            $stmt->close();
        }
        echo json_encode(["status" => "ok", "settings" => $input]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid input"]);
    }
    exit;
}

// 3. POST /api/products - Crear o editar un artículo
if (($path === '/api/products' || $path === '/api/products/') && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input) {
        $product_id = isset($input['id']) ? $input['id'] : null;
        $nombre = isset($input['name']) ? $input['name'] : 'Producto';
        $descripcion = isset($input['description']) ? $input['description'] : '';
        
        $imagen = '';
        if (isset($input['images']) && is_array($input['images']) && count($input['images']) > 0) {
            $cleaned_imgs = array_values(array_filter(array_map('trim', $input['images'])));
            $imagen = implode(',', $cleaned_imgs);
        } else if (isset($input['image'])) {
            $imagen = trim($input['image']);
        }
        
        $precio = isset($input['price']) ? (float)$input['price'] : 0.00;
        $categoria = isset($input['category']) ? $input['category'] : 'ropa';
        $tipo_id = isset($input['tipo_id']) ? (int)$input['tipo_id'] : 1;
        $categoria_id = isset($input['categoria_id']) ? (int)$input['categoria_id'] : 1;
        $tallas = isset($input['sizes']) && is_array($input['sizes']) ? implode(',', $input['sizes']) : '';
        $colores = isset($input['colors']) && is_array($input['colors']) ? implode(',', $input['colors']) : '';
        $stock = isset($input['stock']) ? (int)$input['stock'] : 10;
        $destacado = (isset($input['featured']) && $input['featured']) ? 1 : 0;
        $codigo = isset($input['code']) ? trim($input['code']) : '';
        
        // Si se manda categoria_id, sincronizamos también el nombre de texto 'categoria'
        // para mantener compatibilidad con el resto del sistema.
        if (isset($input['categoria_id'])) {
            $stmt_cat = $conexion->prepare("SELECT nombre FROM categorias WHERE id = ?");
            $stmt_cat->bind_param("i", $categoria_id);
            $stmt_cat->execute();
            $res_cat = $stmt_cat->get_result();
            if ($cat_row = $res_cat->fetch_assoc()) {
                $categoria = $cat_row['nombre'];
            }
            $stmt_cat->close();
        }
        
        $numeric_id = null;
        if (!empty($product_id)) {
            $numeric_id = (int)str_replace('prod-', '', $product_id);
        }
        
        if ($numeric_id) {
            // Editar existente
            $stmt_check = $conexion->prepare("SELECT id FROM articulos WHERE id = ?");
            $stmt_check->bind_param("i", $numeric_id);
            $stmt_check->execute();
            $stmt_check->store_result();
            $exists = $stmt_check->num_rows > 0;
            $stmt_check->close();
            
            if ($exists) {
                $stmt = $conexion->prepare("UPDATE articulos SET nombre = ?, descripcion = ?, imagen = ?, precio = ?, categoria = ?, tipo_id = ?, categoria_id = ?, tallas = ?, colores = ?, stock = ?, destacado = ?, codigo = ? WHERE id = ?");
                $stmt->bind_param("sssdsiissiisi", $nombre, $descripcion, $imagen, $precio, $categoria, $tipo_id, $categoria_id, $tallas, $colores, $stock, $destacado, $codigo, $numeric_id);
                $stmt->execute();
                $stmt->close();
                $input['id'] = 'prod-' . $numeric_id;
                $input['code'] = $codigo ?: ('COD-' . str_pad($numeric_id, 3, '0', STR_PAD_LEFT));
            } else {
                $stmt = $conexion->prepare("INSERT INTO articulos (id, nombre, descripcion, imagen, precio, categoria, tipo_id, categoria_id, tallas, colores, stock, destacado, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("isssdsiissiis", $numeric_id, $nombre, $descripcion, $imagen, $precio, $categoria, $tipo_id, $categoria_id, $tallas, $colores, $stock, $destacado, $codigo);
                $stmt->execute();
                $stmt->close();
                $input['id'] = 'prod-' . $numeric_id;
                $input['code'] = $codigo ?: ('COD-' . str_pad($numeric_id, 3, '0', STR_PAD_LEFT));
            }
        } else {
            // Nuevo artículo
            $stmt = $conexion->prepare("INSERT INTO articulos (nombre, descripcion, imagen, precio, categoria, tipo_id, categoria_id, tallas, colores, stock, destacado, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssdsiissiis", $nombre, $descripcion, $imagen, $precio, $categoria, $tipo_id, $categoria_id, $tallas, $colores, $stock, $destacado, $codigo);
            $stmt->execute();
            $new_id = $stmt->insert_id;
            $stmt->close();
            $input['id'] = 'prod-' . $new_id;
            $input['code'] = $codigo ?: ('COD-' . str_pad($new_id, 3, '0', STR_PAD_LEFT));
        }
        
        echo json_encode(["status" => "ok", "product" => $input]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid input"]);
    }
    exit;
}

// 3.5. POST /api/categorias - Crear una nueva categoría
if (($path === '/api/categorias' || $path === '/api/categorias/') && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $nombre_cat = isset($input['nombre']) ? trim($input['nombre']) : '';
    $tipo_id_cat = isset($input['tipo_id']) ? (int)$input['tipo_id'] : null;

    if (empty($nombre_cat)) {
        http_response_code(400);
        echo json_encode(["error" => "El nombre de la categoría es obligatorio"]);
        exit;
    }

    $stmt = $conexion->prepare("INSERT INTO categorias (nombre, tipo_id) VALUES (?, ?)");
    $stmt->bind_param("si", $nombre_cat, $tipo_id_cat);
    $stmt->execute();
    $new_id = $stmt->insert_id;
    $stmt->close();

    echo json_encode([
        "status" => "ok",
        "categoria" => ["id" => $new_id, "nombre" => $nombre_cat, "tipo_id" => $tipo_id_cat]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3.6. DELETE /api/categorias/{id} - Eliminar una categoría
if (preg_match('#^/api/categorias/([0-9]+)$#', $path, $matches) && $method === 'DELETE') {
    $cat_id = (int)$matches[1];

    $stmt = $conexion->prepare("DELETE FROM categorias WHERE id = ?");
    $stmt->bind_param("i", $cat_id);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["status" => "ok"]);
    exit;
}

// 4. DELETE /api/products/{id} - Eliminar un artículo
if (preg_match('#^/api/products/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
    $product_id = $matches[1];
    $numeric_id = (int)str_replace('prod-', '', $product_id);
    
    $stmt = $conexion->prepare("DELETE FROM articulos WHERE id = ?");
    $stmt->bind_param("i", $numeric_id);
    $stmt->execute();
    $stmt->close();
    
    echo json_encode(["status" => "ok"]);
    exit;
}

// 5. GET /api/chats - Obtener todos los chats
if (($path === '/api/chats' || $path === '/api/chats/') && $method === 'GET') {
    $chats_res = $conexion->query("SELECT * FROM chats ORDER BY updatedAt DESC");
    $chats = [];
    while ($row = $chats_res->fetch_assoc()) {
        $chats[] = [
            "id" => $row['id'],
            "customerName" => $row['customerName'],
            "createdAt" => $row['createdAt'],
            "updatedAt" => $row['updatedAt'],
            "messages" => json_decode($row['messages'], true) ?: [],
            "unread" => (bool)$row['unread']
        ];
    }
    echo json_encode($chats);
    exit;
}

// 6. POST /api/chats - Obtener o inicializar una sesión de chat por nombre de cliente
if (($path === '/api/chats' || $path === '/api/chats/') && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $customerName = isset($input['customerName']) ? $input['customerName'] : 'Cliente';
    
    $stmt = $conexion->prepare("SELECT * FROM chats WHERE LOWER(customerName) = ?");
    $lower_name = strtolower($customerName);
    $stmt->bind_param("s", $lower_name);
    $stmt->execute();
    $result = $stmt->get_result();
    $found_chat = $result->fetch_assoc();
    $stmt->close();
    
    if ($found_chat) {
        $chat_obj = [
            "id" => $found_chat['id'],
            "customerName" => $found_chat['customerName'],
            "createdAt" => $found_chat['createdAt'],
            "updatedAt" => $found_chat['updatedAt'],
            "messages" => json_decode($found_chat['messages'], true) ?: [],
            "unread" => (bool)$found_chat['unread']
        ];
        echo json_encode($chat_obj);
    } else {
        $chat_id = "chat-" . uniqid();
        $createdAt = date('c');
        $updatedAt = date('c');
        $welcome_messages = [
            [
                "id" => "msg-welcome",
                "sender" => "owner",
                "text" => "¡Hola " . $customerName . "! Bienvenido a nuestra tienda. ¿En qué podemos ayudarte hoy con nuestra ropa y zapatos?",
                "timestamp" => date('c')
            ]
        ];
        $messages_json = json_encode($welcome_messages);
        $unread = 0;
        
        $stmt_insert = $conexion->prepare("INSERT INTO chats (id, customerName, createdAt, updatedAt, messages, unread) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt_insert->bind_param("sssssi", $chat_id, $customerName, $createdAt, $updatedAt, $messages_json, $unread);
        $stmt_insert->execute();
        $stmt_insert->close();
        
        echo json_encode([
            "id" => $chat_id,
            "customerName" => $customerName,
            "createdAt" => $createdAt,
            "updatedAt" => $updatedAt,
            "messages" => $welcome_messages,
            "unread" => false
        ]);
    }
    exit;
}

// 7. POST /api/chats/{id}/messages - Enviar un mensaje de chat
if (preg_match('#^/api/chats/([^/]+)/messages$#', $path, $matches) && $method === 'POST') {
    $chat_id = $matches[1];
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input && isset($input['sender']) && isset($input['text'])) {
        $stmt = $conexion->prepare("SELECT * FROM chats WHERE id = ?");
        $stmt->bind_param("s", $chat_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $chat = $result->fetch_assoc();
        $stmt->close();
        
        if ($chat) {
            $messages = json_decode($chat['messages'], true) ?: [];
            $new_message = [
                "id" => "msg-" . uniqid(),
                "sender" => $input['sender'],
                "text" => $input['text'],
                "timestamp" => date('c')
            ];
            $messages[] = $new_message;
            $messages_json = json_encode($messages);
            $updatedAt = date('c');
            $unread = ($input['sender'] === 'customer') ? 1 : 0;
            
            $stmt_update = $conexion->prepare("UPDATE chats SET messages = ?, updatedAt = ?, unread = ? WHERE id = ?");
            $stmt_update->bind_param("ssis", $messages_json, $updatedAt, $unread, $chat_id);
            $stmt_update->execute();
            $stmt_update->close();
            
            // -------------------------------------------------------------
            // DISPARAR ASISTENTE INTELIGENTE GEMINI SI ESTÁ ACTIVO
            // -------------------------------------------------------------
            $settings = getStoreSettings($conexion);
            $gemini_key = getenv('GEMINI_API_KEY');
            if (!$gemini_key && isset($_ENV['GEMINI_API_KEY'])) {
                $gemini_key = $_ENV['GEMINI_API_KEY'];
            }
            if (!$gemini_key && defined('GEMINI_API_KEY')) {
                $gemini_key = GEMINI_API_KEY;
            }
            
            if ($input['sender'] === 'customer' && isset($settings['aiAssistantEnabled']) && (int)$settings['aiAssistantEnabled'] === 1 && !empty($gemini_key)) {
                // Obtener catálogo de productos como contexto para la IA
                $products_res = $conexion->query("SELECT * FROM articulos");
                $products_str = "";
                while ($prod_row = $products_res->fetch_assoc()) {
                    $p = mapRowToProduct($prod_row);
                    $cat_name = $p['category'] === "ropa" ? "Ropa" : "Zapatos";
                    $products_str .= "- [ID: " . $p['id'] . "] " . $p['name'] . " (" . $cat_name . "): $" . $p['price'] . ". Descripción: " . $p['description'] . ". Colores: " . implode(", ", $p['colors']) . ". Tallas: " . implode(", ", $p['sizes']) . ". Stock: " . $p['stock'] . " unidades.\n";
                }
                
                // Formar historial de mensajes
                $history_str = "";
                $context_messages = array_slice($messages, -8);
                foreach ($context_messages as $m) {
                    $sender_label = $m['sender'] === "customer" ? "Cliente" : ($m['sender'] === "ai" ? "Asistente AI" : "Dueño");
                    $history_str .= $sender_label . ": " . $m['text'] . "\n";
                }
                
                $systemPrompt = "Actúas como un asistente inteligente de ventas de la tienda \"" . $settings['storeName'] . "\".\n"
                              . "Tu objetivo es ayudar a los clientes con información de nuestro catálogo de ropa y zapatos.\n"
                              . "Sé amable, servicial y breve (máximo 2 párrafos de respuesta).\n"
                              . "Tono solicitado: " . (isset($settings['aiAssistantTone']) ? $settings['aiAssistantTone'] : "Amistoso y profesional") . ".\n\n"
                              . "Aquí está nuestro inventario actual:\n" . $products_str . "\n"
                              . "Configuraciones:\n"
                              . "- WhatsApp de contacto: " . $settings['whatsappNumber'] . "\n"
                              . "- Mensaje predeterminado de compra: " . $settings['whatsappTemplate'] . "\n\n"
                              . "Directrices de respuesta:\n"
                              . "1. Si preguntan por ropa o zapatos específicos, brinda detalles de precio, tallas y colores disponibles.\n"
                              . "2. Si el cliente quiere comprar, dile que puede seleccionar el producto en la tienda y dar clic en el botón de WhatsApp para contactar directamente al dueño, o que puede escribirle al número " . $settings['whatsappNumber'] . ".\n"
                              . "3. Si preguntan algo que no corresponde al catálogo o es una duda compleja, indícales amablemente que el dueño de la tienda se comunicará con ellos en breve para ayudarles de forma personalizada.\n"
                              . "4. NUNCA inventes productos que no estén en la lista anterior.\n\n"
                              . "Historial de conversación:\n" . $history_str . "\n"
                              . "Responde directamente al último mensaje del cliente como el Asistente AI (en primera persona, representando a la tienda):";
                              
                $aiReply = getGeminiReply($systemPrompt, $gemini_key);
                if ($aiReply) {
                    $ai_message = [
                        "id" => "msg-ai-" . uniqid(),
                        "sender" => "ai",
                        "text" => $aiReply,
                        "timestamp" => date('c')
                    ];
                    $messages[] = $ai_message;
                    $messages_json = json_encode($messages);
                    $updatedAt = date('c');
                    
                    $stmt_update_ai = $conexion->prepare("UPDATE chats SET messages = ?, updatedAt = ? WHERE id = ?");
                    $stmt_update_ai->bind_param("sss", $messages_json, $updatedAt, $chat_id);
                    $stmt_update_ai->execute();
                    $stmt_update_ai->close();
                }
            }
            
            echo json_encode(["status" => "ok", "message" => $new_message]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Chat not found"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid inputs"]);
    }
    exit;
}

// Si no coincide ninguna ruta
http_response_code(404);
echo json_encode(["error" => "Not Found", "path" => $path]);

