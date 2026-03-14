-- ============================================================
-- FoxPetroleum Database Setup Script
-- Run: mysql -u root < ayauya.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS foxpetroleum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE foxpetroleum;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

INSERT INTO roles (name, description, created_at, updated_at) VALUES
('admin',      'Administrateur avec accès complet',                NOW(), NOW()),
('manager',    'Gestionnaire avec accès opérationnel',             NOW(), NOW()),
('commercial', 'Commercial pour la gestion des ventes',            NOW(), NOW()),
('chauffeur',  'Chauffeur pour les livraisons',                    NOW(), NOW()),
('user',       'Utilisateur standard (client enregistré)',         NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updated_at=NOW();

-- ============================================================
-- USERS  (password = bcrypt of 'password')
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    phone VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT users_role_id_foreign FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- Test credentials — all passwords are "password"
INSERT INTO users (name, email, password, role_id, phone, is_active, created_at, updated_at) VALUES
('Admin FoxPetroleum',  'admin@foxpetroleum.com',      '$2y$12$T30gNKyLTITEnMuaXh4XGOTfRNufxsjUNsGkU2XAQigJ07rEkn.tO', 1, '+212 522-000001', 1, NOW(), NOW()),
('Manager FoxPetroleum','manager@foxpetroleum.com',    '$2y$12$T30gNKyLTITEnMuaXh4XGOTfRNufxsjUNsGkU2XAQigJ07rEkn.tO', 2, '+212 522-000002', 1, NOW(), NOW()),
('Sara Moussaoui',      'commercial@foxpetroleum.com', '$2y$12$T30gNKyLTITEnMuaXh4XGOTfRNufxsjUNsGkU2XAQigJ07rEkn.tO', 3, '+212 522-000003', 1, NOW(), NOW()),
('Karim El Amrani',     'chauffeur@foxpetroleum.com',  '$2y$12$T30gNKyLTITEnMuaXh4XGOTfRNufxsjUNsGkU2XAQigJ07rEkn.tO', 4, '+212 522-000004', 1, NOW(), NOW()),
('Client Test',         'client@foxpetroleum.com',     '$2y$12$T30gNKyLTITEnMuaXh4XGOTfRNufxsjUNsGkU2XAQigJ07rEkn.tO', 5, '+212 522-000005', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE password=VALUES(password), role_id=VALUES(role_id), updated_at=NOW();

-- ============================================================
-- PRODUCTS  (Petroleum / lubricant products)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10,2) NOT NULL,
    tva_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 10,
    unit VARCHAR(255) NOT NULL DEFAULT 'L',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

INSERT INTO products (code, name, description, price, tva_rate, stock, min_stock, unit, is_active, created_at, updated_at) VALUES
('HUI-001', 'Huile Moteur 5W30',         'Huile synthétique haute performance pour moteurs essence et diesel', 85.50,  20.00, 450,  100, 'L',  1, NOW(), NOW()),
('HUI-002', 'Huile Moteur 10W40',        'Huile semi-synthétique pour moteurs diesel',                        65.00,  20.00, 320,  80,  'L',  1, NOW(), NOW()),
('HUI-003', 'Huile Transmission 80W90',  'Huile pour boîtes de vitesse et ponts',                             45.00,  20.00, 180,  50,  'L',  1, NOW(), NOW()),
('MAZ-001', 'Mazout FOD',                'Fioul domestique pour chauffage',                                    12.50,  20.00, 5000, 1000,'L',  1, NOW(), NOW()),
('LUB-001', 'Graisse Lithium EP2',       'Graisse multi-usage pour roulements et mécanismes',                  35.00,  20.00, 75,   30,  'Kg', 1, NOW(), NOW()),
('HUI-004', 'Huile Hydraulique ISO 46',  'Huile pour systèmes hydrauliques',                                   55.00,  20.00, 25,   50,  'L',  1, NOW(), NOW()),
('GAZ-001', 'Gasoil 50',                 'Gasoil standard pour véhicules diesel',                              14.20,  20.00, 8000, 2000,'L',  1, NOW(), NOW()),
('HUI-005', 'Huile Moteur 15W40',        'Huile minérale pour moteurs industriels',                             42.00,  20.00, 600,  150, 'L',  1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock), updated_at=NOW();

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    address TEXT NULL,
    city VARCHAR(255) NULL,
    ice VARCHAR(255) NULL,
    rc VARCHAR(255) NULL,
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

INSERT INTO customers (code, name, email, phone, address, city, ice, rc, credit_limit, is_active, created_at, updated_at) VALUES
('CLI-001', 'Auto Garage Marrakech',  'contact@autogarage.ma',       '+212 524-334455', '123 Boulevard Mohammed VI',       'Marrakech',  '001234567000089', '123456', 50000.00,  1, NOW(), NOW()),
('CLI-002', 'Transport Rapide SA',    'achats@transportrapide.ma',   '+212 522-445566', '45 Avenue des FAR',               'Casablanca', '001234567000090', '234567', 75000.00,  1, NOW(), NOW()),
('CLI-003', 'Hôtel Atlas Palace',     'maintenance@atlas-palace.ma', '+212 524-556677', 'Zone Industrielle Sidi Ghanem',   'Marrakech',  '001234567000091', '345678', 60000.00,  1, NOW(), NOW()),
('CLI-004', 'Carrière du Sud',        'admin@carrieresud.ma',        '+212 528-667788', 'Route de Ouarzazate, Km 15',      'Marrakech',  '001234567000092', '456789', 40000.00,  1, NOW(), NOW()),
('CLI-005', 'Société Minière Atlas',  'logistique@smatlas.ma',       '+212 524-778899', '88 Zone Industrielle Tassila',    'Agadir',     '001234567000093', '567890', 100000.00, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), updated_at=NOW();

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    license_plate VARCHAR(255) NOT NULL UNIQUE,
    model VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    capacity INT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB;

INSERT INTO vehicles (license_plate, model, brand, capacity, is_active, created_at, updated_at) VALUES
('12345-A-50', 'Actros 2545',  'Mercedes', 20000, 1, NOW(), NOW()),
('67890-B-40', 'FM 460',       'Volvo',    18000, 1, NOW(), NOW()),
('11111-C-30', 'Premium 450',  'Renault',  15000, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE model=VALUES(model), updated_at=NOW();

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    commercial_id BIGINT UNSIGNED NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    total_tva DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    status ENUM('draft','confirmed','preparation','delivery','delivered','cancelled') NOT NULL DEFAULT 'draft',
    notes TEXT NULL,
    delivery_date TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT orders_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT orders_commercial_id_foreign FOREIGN KEY (commercial_id) REFERENCES users(id)
) ENGINE=InnoDB;

INSERT INTO orders (order_number, customer_id, commercial_id, subtotal, total_tva, total, status, notes, delivery_date, created_at, updated_at) VALUES
('CMD-2026-0001', 1, 3, 2685.00,  537.00,  3222.00,  'delivered',   'Livraison urgente',           '2026-02-01 10:00:00', '2026-01-28 14:30:00', '2026-02-01 12:00:00'),
('CMD-2026-0002', 2, 3, 2250.00,  450.00,  2700.00,  'delivery',    '',                            '2026-02-05 09:00:00', '2026-02-01 10:00:00', '2026-02-04 16:00:00'),
('CMD-2026-0003', 3, 3, 12500.00, 2500.00, 15000.00, 'confirmed',   'Livraison mensuelle',         '2026-02-10 08:00:00', '2026-02-03 11:00:00', '2026-02-03 11:00:00'),
('CMD-2026-0004', 4, 3, 3250.00,  650.00,  3900.00,  'preparation', '',                            '2026-02-06 14:00:00', '2026-02-04 09:30:00', '2026-02-05 10:00:00'),
('CMD-2026-0005', 1, 3, 855.00,   171.00,  1026.00,  'draft',       'En attente de validation',    NULL,                  '2026-02-05 16:00:00', '2026-02-05 16:00:00');

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    tva_rate DECIMAL(5,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT order_items_order_id_foreign FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_foreign FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

INSERT INTO order_items (order_id, product_id, quantity, price, tva_rate, total, created_at, updated_at) VALUES
(1, 1, 20, 85.50, 20.00, 2052.00, NOW(), NOW()),
(1, 2, 15, 65.00, 20.00, 1170.00, NOW(), NOW()),
(2, 3, 50, 45.00, 20.00, 2700.00, NOW(), NOW()),
(3, 4, 1000, 12.50, 20.00, 15000.00, NOW(), NOW()),
(4, 5, 30, 35.00, 20.00, 1260.00, NOW(), NOW()),
(4, 6, 40, 55.00, 20.00, 2640.00, NOW(), NOW()),
(5, 1, 10, 85.50, 20.00, 1026.00, NOW(), NOW());

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    chauffeur_id BIGINT UNSIGNED NOT NULL,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    status ENUM('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
    planned_date TIMESTAMP NOT NULL,
    actual_departure TIMESTAMP NULL,
    actual_arrival TIMESTAMP NULL,
    notes TEXT NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT deliveries_order_id_foreign FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT deliveries_chauffeur_id_foreign FOREIGN KEY (chauffeur_id) REFERENCES users(id),
    CONSTRAINT deliveries_vehicle_id_foreign FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB;

INSERT INTO deliveries (order_id, chauffeur_id, vehicle_id, status, planned_date, actual_departure, actual_arrival, notes, latitude, longitude, created_at, updated_at) VALUES
(1, 4, 1, 'completed',   '2026-02-01 10:00:00', '2026-02-01 09:30:00', '2026-02-01 11:45:00', 'Livraison effectuée sans problème', 31.62950000, -7.98110000, '2026-01-30 10:00:00', '2026-02-01 11:45:00'),
(2, 4, 2, 'in_progress', '2026-02-05 09:00:00', '2026-02-05 08:15:00', NULL,                  'En route vers Casablanca',          33.57310000, -7.58980000, '2026-02-03 10:00:00', '2026-02-05 08:15:00'),
(3, 4, 3, 'planned',     '2026-02-10 08:00:00', NULL,                  NULL,                  '',                                   NULL,        NULL,        '2026-02-04 10:00:00', '2026-02-04 10:00:00');

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(255) NOT NULL UNIQUE,
    order_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP NOT NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT invoices_order_id_foreign FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT invoices_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

INSERT INTO invoices (invoice_number, order_id, customer_id, amount, paid_amount, status, due_date, paid_at, created_at, updated_at) VALUES
('FAC-2026-0001', 1, 1, 3222.00, 3222.00, 'paid',    '2026-03-01 00:00:00', '2026-02-15 10:00:00', '2026-02-01 12:00:00', '2026-02-15 10:00:00'),
('FAC-2026-0002', 2, 2, 2700.00, 0.00,    'pending',  '2026-03-05 00:00:00', NULL,                 '2026-02-04 16:00:00', '2026-02-04 16:00:00');

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash','bank_transfer','check','credit_card') NOT NULL DEFAULT 'cash',
    reference VARCHAR(255) NULL,
    payment_date TIMESTAMP NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT payments_invoice_id_foreign FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB;

INSERT INTO payments (invoice_id, amount, payment_method, reference, payment_date, notes, created_at, updated_at) VALUES
(1, 3222.00, 'bank_transfer', 'VIR-2026-0215', '2026-02-15 10:00:00', 'Paiement intégral par virement', NOW(), NOW());

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('todo','in_progress','done','cancelled') NOT NULL DEFAULT 'todo',
    priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    created_by_id BIGINT UNSIGNED NOT NULL,
    assigned_to_id BIGINT UNSIGNED NULL,
    order_id BIGINT UNSIGNED NULL,
    due_date TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT tasks_created_by_id_foreign FOREIGN KEY (created_by_id) REFERENCES users(id),
    CONSTRAINT tasks_assigned_to_id_foreign FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    CONSTRAINT tasks_order_id_foreign FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

INSERT INTO tasks (title, description, status, priority, created_by_id, assigned_to_id, order_id, due_date, created_at, updated_at) VALUES
('Validation prix spécial Client Atlas',  'Demande de remise de 10% pour commande > 10 000L mazout', 'todo',        'high',   3, 1, 3, '2026-02-08 17:00:00', '2026-02-04 10:00:00', '2026-02-04 10:00:00'),
('Commande urgente Carrière du Sud',      'Client demande livraison express pour demain',            'in_progress', 'urgent', 3, 4, 4, '2026-02-06 08:00:00', '2026-02-05 09:00:00', '2026-02-05 14:00:00'),
('Mise à jour stock huiles',              'Inventaire mensuel des huiles moteur',                    'todo',        'medium', 1, NULL, NULL, '2026-02-10 17:00:00', '2026-02-05 11:00:00', '2026-02-05 11:00:00'),
('Relance paiement FAC-2026-0002',        'Envoyer relance pour facture impayée',                    'done',        'medium', 1, 3, NULL, NULL, '2026-02-04 09:00:00', '2026-02-05 15:00:00');

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    model_type VARCHAR(255) NOT NULL,
    model_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(255) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT audit_logs_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- CACHE, SESSIONS, JOBS (Laravel standard)
-- ============================================================
CREATE TABLE IF NOT EXISTS cache (
    `key` VARCHAR(255) NOT NULL PRIMARY KEY,
    value MEDIUMTEXT NOT NULL,
    expiration INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cache_locks (
    `key` VARCHAR(255) NOT NULL PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload LONGTEXT NOT NULL,
    last_activity INT NOT NULL,
    INDEX sessions_user_id_index (user_id),
    INDEX sessions_last_activity_index (last_activity)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload LONGTEXT NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL,
    reserved_at INT UNSIGNED NULL,
    available_at INT UNSIGNED NOT NULL,
    created_at INT UNSIGNED NOT NULL,
    INDEX jobs_queue_index (queue)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_batches (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_jobs INT NOT NULL,
    pending_jobs INT NOT NULL,
    failed_jobs INT NOT NULL,
    failed_job_ids LONGTEXT NOT NULL,
    options MEDIUMTEXT NULL,
    cancelled_at INT NULL,
    created_at INT NOT NULL,
    finished_at INT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS failed_jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload LONGTEXT NOT NULL,
    exception LONGTEXT NOT NULL,
    failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- MIGRATIONS TABLE (so Laravel knows state)
-- ============================================================
CREATE TABLE IF NOT EXISTS migrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    migration VARCHAR(255) NOT NULL,
    batch INT NOT NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO migrations (migration, batch) VALUES
('0001_01_01_000000_create_users_table', 1),
('0001_01_01_000001_create_cache_table', 1),
('0001_01_01_000002_create_jobs_table', 1),
('2026_02_06_214419_create_roles_table', 1),
('2026_02_06_214420_create_products_table', 1),
('2026_02_06_214421_create_customers_table', 1),
('2026_02_06_214422_create_orders_table', 1),
('2026_02_06_214423_create_order_items_table', 1),
('2026_02_06_214424_create_deliveries_table', 1),
('2026_02_06_214425_create_vehicles_table', 1),
('2026_02_06_214426_create_invoices_table', 1),
('2026_02_06_214427_create_payments_table', 1),
('2026_02_06_214428_create_tasks_table', 1),
('2026_02_06_214429_create_audit_logs_table', 1);