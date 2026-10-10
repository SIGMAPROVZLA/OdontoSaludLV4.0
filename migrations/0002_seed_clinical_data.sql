-- Migración 0002: Semillas Clínicas y Pacientes Iniciales

-- 1. Pacientes Iniciales
INSERT OR IGNORE INTO pacientes (id, cedula, nombres, apellidos, telefono, email, alergias, fecha_nacimiento) VALUES
('pac-carlos', 'V-17.654.321', 'Carlos', 'Mendoza', '+58 412-1234567', 'carlos.mendoza@email.com', 'Penicilina', '1988-04-12'),
('pac-patricia', 'V-19.845.221', 'Patricia', 'Velásquez', '+58 414-5550921', 'patricia.v@email.com', 'Ninguna conocida', '1992-09-24'),
('pac-marcos', 'V-22.113.890', 'Marcos', 'Ramos', '+58 424-7890123', 'marcos.ramos@email.com', 'Látex', '1998-11-05');

-- 2. Citas del Día (Multi-sede)
INSERT OR IGNORE INTO citas (id, sede_id, paciente_id, doctor_nombre, box_numero, fecha_cita, hora_inicio, motivo, estado, es_urgencia) VALUES
('cita-1', 'victoria', 'pac-carlos', 'Dra. María Alejandra Domínguez', 1, date('now'), '09:30 AM', 'Endodoncia #16', 'en_sillon', 0),
('cita-2', 'victoria', 'pac-patricia', 'Dra. María Alejandra Domínguez', 1, date('now'), '10:15 AM', 'Profilaxis & Destartraje', 'pendiente', 0),
('cita-3', 'victoria', 'pac-marcos', 'Dr. Marcos Silva', 2, date('now'), '11:00 AM', 'Control Ortodoncia', 'confirmada', 0);

-- 3. Odontograma Inicial (Pieza #16 de Carlos Mendoza con caries oclusal activa)
INSERT OR IGNORE INTO odontograma_piezas (id, paciente_id, numero_fdi, cara_vestibular, cara_mesial, cara_oclusal, cara_distal, cara_palatino_lingual, estado_general, actualizado_por) VALUES
('pac-carlos-16', 'pac-carlos', 16, 'sano', 'sano', 'caries', 'sano', 'sano', 'presente', 'Dra. María Alejandra Domínguez'),
('pac-carlos-15', 'pac-carlos', 15, 'sano', 'sano', 'resina', 'sano', 'sano', 'presente', 'Dra. María Alejandra Domínguez'),
('pac-carlos-18', 'pac-carlos', 18, 'sano', 'sano', 'sano', 'sano', 'sano', 'ausente', 'Dra. María Alejandra Domínguez'),
('pac-carlos-28', 'pac-carlos', 28, 'sano', 'sano', 'sano', 'sano', 'sano', 'ausente', 'Dra. María Alejandra Domínguez'),
('pac-carlos-38', 'pac-carlos', 38, 'sano', 'sano', 'sano', 'sano', 'sano', 'ausente', 'Dra. María Alejandra Domínguez'),
('pac-carlos-48', 'pac-carlos', 48, 'sano', 'sano', 'sano', 'sano', 'sano', 'ausente', 'Dra. María Alejandra Domínguez');

-- 4. Presupuestos Iniciales
INSERT OR IGNORE INTO presupuestos (id, codigo, paciente_id, sede_id, monto_total_usd, monto_abonado_usd, tasa_bcv_referencia, estado) VALUES
('pre-carlos-01', 'PRE-2026-001', 'pac-carlos', 'victoria', 120.0, 50.0, 49.85, 'aprobado_parcial'),
('pre-patricia-01', 'PRE-2026-002', 'pac-patricia', 'victoria', 35.0, 0.0, 49.85, 'en_espera');
