-- =====================================================================
-- SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS MYSQL (AURA STUDIO)
-- =====================================================================
-- Credenciales de tu servidor de Hosting:
-- Host: localhost
-- Base de Datos: sql_9yemu7
-- Usuario: sql_9yemu7
-- Contraseña: A1@zV3BWmYZpt
-- =====================================================================

-- Eliminar tablas existentes para garantizar una instalación limpia
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS articulos;

-- 1. CREACIÓN DE LA TABLA DE ARTÍCULOS (PRODUCTOS)
CREATE TABLE articulos (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(500),
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    categoria VARCHAR(50) NOT NULL DEFAULT 'ropa',
    tallas VARCHAR(255) DEFAULT '',
    colores VARCHAR(255) DEFAULT '',
    stock INT NOT NULL DEFAULT 10,
    destacado TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CREACIÓN DE LA TABLA DE CONFIGURACIONES (SETTINGS)
CREATE TABLE settings (
    clave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    PRIMARY KEY (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CREACIÓN DE LA TABLA DE CHATS
CREATE TABLE chats (
    id VARCHAR(100) NOT NULL,
    customerName VARCHAR(255) NOT NULL,
    createdAt VARCHAR(100) NOT NULL,
    updatedAt VARCHAR(100) NOT NULL,
    messages TEXT NOT NULL,
    unread TINYINT(1) DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- INSERCIÓN DE DATOS POR DEFECTO
-- =====================================================================

-- Ajustes de la tienda
INSERT INTO settings (clave, valor) VALUES
('storeName', 'Arnielys & Juank • Aura Studio'),
('whatsappNumber', '5352943409'),
('whatsappTemplate', '¡Hola! Me interesa comprar el producto *{name}* (Precio: *{price}*, Talla: *{size}*, Color: *{color}*). ¿Está disponible?'),
('aiAssistantEnabled', '0'),
('aiAssistantTone', 'Amistoso, servicial y profesional');

-- Los 5 artículos con sus respectivas imágenes en la carpeta 'imagenes/'
INSERT INTO articulos (id, nombre, descripcion, imagen, precio, categoria, tallas, colores, stock, destacado) VALUES
(1, 'Chaqueta de Cuero Vintage', 'Chaqueta clásica de cuero genuino envejecido con detalles de cremallera metálica y forro interior suave. Una prenda atemporal para cualquier ocasión que combina elegancia y resistencia.', 'imagenes/articulo1.png', 129.99, 'ropa', 'S,M,L,XL', 'Negro,Marrón', 8, 1),
(2, 'Tenis Urban Comfort', 'Zapatos deportivos ultra cómodos con suela de espuma viscoelástica de doble densidad. Ideales para caminatas largas y uso casual diario con máxima amortiguación y soporte.', 'imagenes/articulo2.png', 79.99, 'zapatos', '38,39,40,41,42,43', 'Rojo,Negro,Blanco', 14, 1),
(3, 'Sudadera Oversize Minimalista', 'Sudadera con capucha confeccionada en algodón orgánico pesado. Corte holgado moderno con puños acanalados y bolsillo canguro frontal de alta durabilidad.', 'imagenes/articulo3.png', 49.99, 'ropa', 'M,L,XL', 'Gris,Beige,Verde Oliva', 20, 0),
(4, 'Botas de Cuero Clásicas', 'Botas robustas hechas a mano con cuero resistente al agua. Suela dentada antideslizante de larga duración, cordones encerados premium y costuras reforzadas.', 'imagenes/articulo4.png', 110.00, 'zapatos', '39,40,41,42,43', 'Marrón Oscuro,Negro', 6, 1),
(5, 'Pantalones Cargo Urbanos', 'Pantalones con múltiples bolsillos de carga reforzados, fabricados en lona de algodón duradera y rodillas preformadas para máxima flexibilidad urbana.', 'imagenes/articulo5.png', 64.99, 'ropa', '28,30,32,34,36', 'Verde Militar,Negro,Kaki', 12, 0);
