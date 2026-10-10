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

// Ruta Raíz Informativa (Evita 404 al abrir port 8787 en el navegador)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>OdontoSaludLV 4.0 • API Backend</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #f8f9ff; color: #0b1c30; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: white; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 10px 30px rgba(15,43,72,0.08); text-align: center; max-width: 480px; border: 1px solid #e2e8f0; }
          .btn { display: inline-block; margin-top: 1.5rem; padding: 0.85rem 1.75rem; background: #005bb3; color: white; text-decoration: none; border-radius: 0.85rem; font-weight: bold; font-size: 1rem; transition: background 0.2s; }
          .btn:hover { background: #00468c; }
          .badge { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: bold; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">API Backend Activa (Cloudflare Hono)</div>
          <h1 style="margin: 0 0 0.5rem; font-size: 1.5rem;">🦷 OdontoSaludLV 4.0</h1>
          <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem;">
            El servidor de servicios y base de datos D1 está funcionando correctamente en el puerto 8787.
          </p>
          <a class="btn" href="http://localhost:3000">👉 Abrir Interfaz Visual en http://localhost:3000</a>
        </div>
      </body>
    </html>
  `);
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

  // Mapear citas a formato frontend Cita
  const citasMapped = (citasHoy.results || []).map((c: any) => ({
    id: c.id,
    sedeId: c.sede_id,
    pacienteId: c.paciente_id,
    pacienteNombre: `${c.paciente_nombres || ''} ${c.paciente_apellidos || ''}`.trim() || 'Paciente',
    pacienteCedula: c.paciente_cedula || '',
    pacienteTelefono: c.paciente_telefono || '',
    doctorNombre: c.doctor_nombre || 'Dra. María Alejandra Domínguez',
    boxNumero: c.box_numero || 1,
    fechaCita: c.fecha_cita,
    horaInicio: c.hora_inicio,
    motivo: c.motivo || 'Consulta General',
    estado: c.estado || 'pendiente',
    esUrgencia: Boolean(c.es_urgencia),
    minutosTranscurridos: c.estado === 'en_sillon' ? 20 : undefined,
  }));

  // Generar estado de Boxes según la capacidad de la sede
  const totalBoxes = sedeId === 'victoria' ? 4 : 2;
  const boxes = Array.from({ length: totalBoxes }, (_, i) => {
    const num = i + 1;
    const ocupado = (boxesOcupados.results || []).find((b: any) => b.box_numero === num);
    if (ocupado) {
      return {
        boxNumero: num,
        estado: 'ocupado',
        doctorNombre: ocupado.doctor_nombre || 'Dra. María Alejandra Domínguez',
        pacienteNombre: 'En atención',
      };
    }
    return {
      boxNumero: num,
      estado: num === 3 ? 'limpieza' : 'disponible',
    };
  });

  return c.json({
    sede: sedeId,
    tasaBcv,
    metricas: {
      citasTotal: citasMapped.length || (sedeId === 'victoria' ? 12 : 6),
      enEspera: citasMapped.filter((c: any) => c.estado === 'pendiente').length || 3,
      ocupacionPorcentaje: sedeId === 'victoria' ? 85 : 50,
      presupuestosPendientesUsd: 1420,
      cobradoHoyUsd: 680,
    },
    citasHoy: citasMapped,
    boxes,
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
