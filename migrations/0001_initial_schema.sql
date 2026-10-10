-- Migración Inicial: Esquema de OdontoSalud Multisede La Victoria & Colonia Tovar

CREATE TABLE IF NOT EXISTS sedes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    total_boxes INTEGER DEFAULT 4,
    activo INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO sedes (id, nombre, direccion, telefono, total_boxes, activo) VALUES
('victoria', 'OdontoSalud La Victoria', 'Av. Francisco de Miranda, Centro Profesional, La Victoria, Aragua', '+58 412-9876543', 4, 1),
('tovar', 'OdontoSalud La Colonia Tovar', 'Calle Principal, Sector El Centro, Colonia Tovar, Aragua', '+58 414-5550921', 2, 1);

CREATE TABLE IF NOT EXISTS pacientes (
    id TEXT PRIMARY KEY,
    cedula TEXT UNIQUE NOT NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT,
    alergias TEXT,
    seguro_nombre TEXT,
    fecha_nacimiento TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citas (
    id TEXT PRIMARY KEY,
    sede_id TEXT NOT NULL REFERENCES sedes(id),
    paciente_id TEXT NOT NULL REFERENCES pacientes(id),
    doctor_nombre TEXT NOT NULL,
    box_numero INTEGER NOT NULL,
    fecha_cita TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    motivo TEXT NOT NULL,
    estado TEXT CHECK(estado IN ('pendiente', 'confirmada', 'en_sillon', 'completada', 'cancelada')) DEFAULT 'pendiente',
    es_urgencia INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS odontograma_piezas (
    id TEXT PRIMARY KEY,
    paciente_id TEXT NOT NULL REFERENCES pacientes(id),
    numero_fdi INTEGER NOT NULL,
    cara_vestibular TEXT DEFAULT 'sano',
    cara_mesial TEXT DEFAULT 'sano',
    cara_oclusal TEXT DEFAULT 'sano',
    cara_distal TEXT DEFAULT 'sano',
    cara_palatino_lingual TEXT DEFAULT 'sano',
    estado_general TEXT DEFAULT 'presente',
    actualizado_por TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS radiografias (
    id TEXT PRIMARY KEY,
    paciente_id TEXT NOT NULL REFERENCES pacientes(id),
    pieza_fdi INTEGER,
    tipo TEXT CHECK(tipo IN ('periapical_rvg', 'panoramica', 'foto_intraoral')),
    r2_storage_url TEXT NOT NULL,
    observaciones TEXT,
    fecha_toma DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presupuestos (
    id TEXT PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    paciente_id TEXT NOT NULL REFERENCES pacientes(id),
    sede_id TEXT NOT NULL REFERENCES sedes(id),
    monto_total_usd REAL NOT NULL,
    monto_abonado_usd REAL DEFAULT 0.0,
    tasa_bcv_referencia REAL,
    estado TEXT CHECK(estado IN ('borrador', 'en_espera', 'aprobado_parcial', 'pagado', 'anulado')) DEFAULT 'en_espera',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pagos (
    id TEXT PRIMARY KEY,
    presupuesto_id TEXT NOT NULL REFERENCES presupuestos(id),
    monto_usd REAL NOT NULL,
    monto_bs REAL,
    metodo TEXT CHECK(metodo IN ('pago_movil', 'divisas_efectivo', 'zelle', 'punto_venta')) NOT NULL,
    referencia TEXT,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_citas_sede_fecha ON citas(sede_id, fecha_cita);
CREATE INDEX IF NOT EXISTS idx_odontograma_paciente ON odontograma_piezas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_paciente ON presupuestos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_presupuesto ON pagos(presupuesto_id);
