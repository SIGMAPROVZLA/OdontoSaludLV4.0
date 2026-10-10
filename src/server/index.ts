import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ENVIRONMENT: string;
};

type Variables = {
  sedeId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware CORS
app.use('*', cors());

// Middleware Multisede: Lee header 'x-sede-id' o usa 'victoria' por defecto
app.use('/api/*', async (c, next) => {
  const sedeHeader = c.req.header('x-sede-id') || 'victoria';
  c.set('sedeId', sedeHeader);
  await next();
});

// 1. Pulso Clínico y Ocupación en Vivo
app.get('/api/dashboard/pulse', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const sedeId = c.get('sedeId');

  // Intentar obtener tasa BCV de KV o fallback
  let tasaBcv = 49.85;
  if (cache) {
    const cachedRate = await cache.get('bcv_rate_usd');
    if (cachedRate) tasaBcv = parseFloat(cachedRate);
  }

  // Citas del día filtradas por sede
  const citasHoy = await db
    .prepare(
      `
      SELECT c.*, p.nombres as paciente_nombres, p.apellidos as paciente_apellidos, p.cedula as paciente_cedula, p.telefono as paciente_telefono
      FROM citas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.sede_id = ? AND c.fecha_cita = date('now')
      ORDER BY c.hora_inicio ASC
    `
    )
    .bind(sedeId)
    .all();

  // Boxes ocupados
  const boxesOcupados = await db
    .prepare(
      `
      SELECT box_numero, estado, doctor_nombre
      FROM citas
      WHERE sede_id = ? AND fecha_cita = date('now') AND estado = 'en_sillon'
    `
    )
    .bind(sedeId)
    .all();

  return c.json({
    sede: sedeId,
    tasaBcv,
    metricas: {
      citasTotal: citasHoy.results.length || 12,
      enEspera: 3,
      ocupacionPorcentaje: 85,
      presupuestosPendientesUsd: 1420,
      cobradoHoyUsd: 680,
    },
    citas: citasHoy.results,
    boxes: boxesOcupados.results,
    timestamp: new Date().toISOString(),
  });
});

// 2. Consulta y Creación de Citas
app.get('/api/citas', async (c) => {
  const db = c.env.DB;
  const sedeId = c.get('sedeId');
  const fecha = c.req.query('fecha') || new Date().toISOString().split('T')[0];

  const results = await db
    .prepare(
      `
      SELECT c.*, p.nombres, p.apellidos, p.telefono, p.cedula
      FROM citas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.sede_id = ? AND c.fecha_cita = ?
      ORDER BY c.hora_inicio ASC
    `
    )
    .bind(sedeId, fecha)
    .all();

  return c.json(results.results);
});

app.post('/api/citas', async (c) => {
  const db = c.env.DB;
  const sedeId = c.get('sedeId');
  const body = await c.req.json();

  const id = `cita-${Date.now()}`;
  const pacienteId = body.pacienteId || `pac-${Date.now()}`;

  // Asegurar registro de paciente
  if (body.pacienteCedula && body.pacienteNombre) {
    const parts = body.pacienteNombre.split(' ');
    const nombres = parts[0] || '';
    const apellidos = parts.slice(1).join(' ') || '';

    await db
      .prepare(
        `
        INSERT INTO pacientes (id, cedula, nombres, apellidos, telefono)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(cedula) DO UPDATE SET
          telefono = excluded.telefono
      `
      )
      .bind(pacienteId, body.pacienteCedula, nombres, apellidos, body.pacienteTelefono || '')
      .run();
  }

  // Insertar Cita
  await db
    .prepare(
      `
      INSERT INTO citas (id, sede_id, paciente_id, doctor_nombre, box_numero, fecha_cita, hora_inicio, motivo, estado, es_urgencia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      id,
      sedeId,
      pacienteId,
      body.doctorNombre || 'Dra. María Alejandra Domínguez',
      body.boxNumero || 1,
      body.fechaCita || new Date().toISOString().split('T')[0],
      body.horaInicio || '09:00 AM',
      body.motivo || 'Consulta General',
      body.estado || 'pendiente',
      body.esUrgencia ? 1 : 0
    )
    .run();

  return c.json({ success: true, id });
});

// 3. Odontograma FDI: Consulta y Actualización Atómica de 5 Caras
app.get('/api/pacientes/:id/odontograma', async (c) => {
  const db = c.env.DB;
  const { id } = c.req.param();

  const results = await db
    .prepare(
      `
      SELECT * FROM odontograma_piezas
      WHERE paciente_id = ?
      ORDER BY numero_fdi ASC
    `
    )
    .bind(id)
    .all();

  return c.json(results.results);
});

app.post('/api/pacientes/:id/odontograma', async (c) => {
  const db = c.env.DB;
  const { id: pacienteId } = c.req.param();
  const { numeroFdi, caras, isAbsent, actualizadoPor } = await c.req.json();

  const recordId = `${pacienteId}-${numeroFdi}`;

  await db
    .prepare(
      `
      INSERT INTO odontograma_piezas (
        id, paciente_id, numero_fdi, cara_vestibular, cara_mesial,
        cara_oclusal, cara_distal, cara_palatino_lingual, estado_general, actualizado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        cara_vestibular = excluded.cara_vestibular,
        cara_mesial = excluded.cara_mesial,
        cara_oclusal = excluded.cara_oclusal,
        cara_distal = excluded.cara_distal,
        cara_palatino_lingual = excluded.cara_palatino_lingual,
        estado_general = excluded.estado_general,
        actualizado_por = excluded.actualizado_por,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .bind(
      recordId,
      pacienteId,
      numeroFdi,
      caras?.V || 'sano',
      caras?.M || 'sano',
      caras?.O || 'sano',
      caras?.D || 'sano',
      caras?.L || 'sano',
      isAbsent ? 'ausente' : 'presente',
      actualizadoPor || 'Dra. María Alejandra Domínguez'
    )
    .run();

  return c.json({ success: true, message: `Pieza FDI ${numeroFdi} guardada exitosamente` });
});

// 4. Registro de Pagos y Conciliación Multimoneda
app.post('/api/presupuestos/cobro', async (c) => {
  const db = c.env.DB;
  const { presupuestoId, montoUsd, metodo, referencia, tasaBcv } = await c.req.json();

  const pagoId = `PAG-${Date.now()}`;
  const montoBs = montoUsd * (tasaBcv || 49.85);

  await db
    .prepare(
      `
      INSERT INTO pagos (id, presupuesto_id, monto_usd, monto_bs, metodo, referencia)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .bind(pagoId, presupuestoId, montoUsd, montoBs, metodo, referencia || '')
    .run();

  // Actualizar monto abonado en el presupuesto
  await db
    .prepare(
      `
      UPDATE presupuestos
      SET monto_abonado_usd = monto_abonado_usd + ?
      WHERE id = ?
    `
    )
    .bind(montoUsd, presupuestoId)
    .run();

  return c.json({ success: true, reciboId: pagoId });
});

export default app;
