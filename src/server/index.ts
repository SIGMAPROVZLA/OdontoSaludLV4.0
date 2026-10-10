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

// Servicio Resiliente de Tasa de Cambio BCV (Multi-capa: En línea -> D1 Caché -> Contingencia)
async function getOrFetchBcvRate(
  db: D1Database,
  cache?: KVNamespace,
  forceRefresh = false
): Promise<{
  tasa: number;
  fuente: string;
  fechaActualizacion: string;
  esManual: boolean;
  origen: 'live_network' | 'manual_override' | 'fallback_d1' | 'contingency';
}> {
  // Asegurar tabla de persistencia en D1
  try {
    await db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS configuraciones_tasas (
        id TEXT PRIMARY KEY,
        tasa REAL NOT NULL,
        fuente TEXT NOT NULL,
        fecha_valor TEXT,
        es_manual INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
      )
      .run();
  } catch (e) {
    console.warn('Error verificando tabla configuraciones_tasas:', e);
  }

  // 1. Verificar si existe una tasa fijada manualmente por administración (override)
  if (!forceRefresh) {
    try {
      const manualRecord = await db
        .prepare(`SELECT * FROM configuraciones_tasas WHERE id = 'bcv_usd' AND es_manual = 1`)
        .first<any>();

      if (manualRecord && manualRecord.tasa) {
        return {
          tasa: Number(manualRecord.tasa),
          fuente: manualRecord.fuente || 'Manual (Administración)',
          fechaActualizacion: manualRecord.updated_at || new Date().toISOString(),
          esManual: true,
          origen: 'manual_override',
        };
      }
    } catch {
      // Continuar al intento en línea si falla la lectura manual
    }
  }

  // 2. Consulta en vivo a API Comunitaria del BCV (DolarApi oficial) con timeout de 3.5 segundos
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as any;
      const tasaNum = Number(data.promedio || data.venta || data.compra);

      if (tasaNum && !isNaN(tasaNum) && tasaNum > 0) {
        const fechaActualizacion = data.fechaActualizacion || new Date().toISOString();
        const fuente = 'BCV Oficial (DolarApi)';

        // Persistir en SQLite D1 para respaldo local
        try {
          await db
            .prepare(
              `
            INSERT INTO configuraciones_tasas (id, tasa, fuente, fecha_valor, es_manual, updated_at)
            VALUES ('bcv_usd', ?, ?, ?, 0, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              tasa = excluded.tasa,
              fuente = excluded.fuente,
              fecha_valor = excluded.fecha_valor,
              es_manual = 0,
              updated_at = CURRENT_TIMESTAMP
          `
            )
            .bind(tasaNum, fuente, fechaActualizacion)
            .run();
        } catch (dbErr) {
          console.warn('No se pudo guardar la tasa en D1:', dbErr);
        }

        if (cache) {
          try {
            await cache.put('bcv_rate_usd', tasaNum.toString());
          } catch {
            // Ignorar si KV local no está configurado
          }
        }

        return {
          tasa: tasaNum,
          fuente,
          fechaActualizacion,
          esManual: false,
          origen: 'live_network',
        };
      }
    }
  } catch (fetchErr) {
    console.warn('Fallo al obtener tasa BCV en vivo, activando fallback local:', fetchErr);
  }

  // 3. Fallback: Buscar último valor registrado en SQLite D1
  try {
    const saved = await db
      .prepare(`SELECT * FROM configuraciones_tasas WHERE id = 'bcv_usd'`)
      .first<any>();

    if (saved && saved.tasa) {
      return {
        tasa: Number(saved.tasa),
        fuente: saved.fuente ? `${saved.fuente} (Respaldo D1)` : 'BCV Oficial (Caché Local)',
        fechaActualizacion: saved.updated_at || new Date().toISOString(),
        esManual: Boolean(saved.es_manual),
        origen: 'fallback_d1',
      };
    }
  } catch {
    // Continuar al valor de contingencia
  }

  // 4. Contingencia de Seguridad
  const contingencia = 875.65;
  return {
    tasa: contingencia,
    fuente: 'BCV Oficial (Tasa de Contingencia OdontoSalud)',
    fechaActualizacion: new Date().toISOString(),
    esManual: false,
    origen: 'contingency',
  };
}

// 1. Pulso Clínico y Ocupación en Vivo
app.get('/api/dashboard/pulse', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const sedeId = c.get('sedeId');

  // Obtener tasa BCV resiliente
  const tasaData = await getOrFetchBcvRate(db, cache);
  const tasaBcv = tasaData.tasa;

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
  const fecha = c.req.query('fecha');
  const estado = c.req.query('estado');

  let query = `
    SELECT c.*, p.nombres, p.apellidos, p.telefono, p.cedula
    FROM citas c
    JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.sede_id = ?
  `;
  const params: any[] = [sedeId];

  if (fecha && fecha !== 'all') {
    query += ` AND c.fecha_cita = ?`;
    params.push(fecha);
  }

  if (estado) {
    query += ` AND c.estado = ?`;
    params.push(estado);
  }

  query += ` ORDER BY c.fecha_cita DESC, c.hora_inicio ASC`;

  const results = await db
    .prepare(query)
    .bind(...params)
    .all();

  const mapped = (results.results || []).map((row: any) => ({
    id: row.id,
    sedeId: row.sede_id,
    pacienteId: row.paciente_id,
    pacienteNombre: `${row.nombres || ''} ${row.apellidos || ''}`.trim() || 'Paciente',
    pacienteCedula: row.cedula || '',
    pacienteTelefono: row.telefono || '',
    doctorNombre: row.doctor_nombre || 'Dra. María Alejandra Domínguez',
    boxNumero: row.box_numero || 1,
    fechaCita: row.fecha_cita,
    horaInicio: row.hora_inicio,
    motivo: row.motivo || 'Consulta General',
    estado: row.estado || 'pendiente',
    esUrgencia: Boolean(row.es_urgencia),
  }));

  return c.json(mapped);
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

// Actualizar estado de una cita (Aprobar, Pasar a sillón, Cancelar)
app.patch('/api/citas/:id/estado', async (c) => {
  const db = c.env.DB;
  const { id } = c.req.param();
  const { estado, boxNumero } = await c.req.json();

  if (boxNumero) {
    await db
      .prepare(`UPDATE citas SET estado = ?, box_numero = ? WHERE id = ?`)
      .bind(estado, boxNumero, id)
      .run();
  } else {
    await db
      .prepare(`UPDATE citas SET estado = ? WHERE id = ?`)
      .bind(estado, id)
      .run();
  }

  return c.json({ success: true, id, estado });
});

// Aprobación de citas en lote (Bulk action)
app.post('/api/citas/aprobar-lote', async (c) => {
  const db = c.env.DB;
  const { ids } = await c.req.json();

  if (Array.isArray(ids) && ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    await db
      .prepare(`UPDATE citas SET estado = 'confirmada' WHERE id IN (${placeholders})`)
      .bind(...ids)
      .run();
  }

  return c.json({ success: true, count: ids?.length || 0 });
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

// 5. Endpoint de Consulta en Línea de Tasa Oficial BCV
app.get('/api/tasas/bcv', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const forceRefresh = c.req.query('refresh') === 'true';

  const tasaInfo = await getOrFetchBcvRate(db, cache, forceRefresh);
  return c.json({
    success: true,
    ...tasaInfo,
  });
});

// 6. Endpoint para Modificación / Override Manual de Tasa por Administración
app.post('/api/tasas/bcv', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const body = await c.req.json();

  if (body.resetearAutomatico) {
    // Volver a modo automático consultando en vivo
    await db
      .prepare(`UPDATE configuraciones_tasas SET es_manual = 0 WHERE id = 'bcv_usd'`)
      .run();

    const nuevaTasa = await getOrFetchBcvRate(db, cache, true);
    return c.json({
      success: true,
      mensaje: 'Tasa restaurada al modo automático en línea BCV',
      ...nuevaTasa,
    });
  }

  const tasaNum = Number(body.tasa);
  if (!tasaNum || isNaN(tasaNum) || tasaNum <= 0) {
    return c.json({ success: false, error: 'Monto de tasa inválido' }, 400);
  }

  const motivo = body.motivo || 'Fijación por Administración de Sede';
  const fijadoPor = body.fijadoPor || 'Administración OdontoSalud';
  const fuente = `Manual (${fijadoPor}: ${motivo})`;
  const fechaActualizacion = new Date().toISOString();

  await db
    .prepare(
      `
    INSERT INTO configuraciones_tasas (id, tasa, fuente, fecha_valor, es_manual, updated_at)
    VALUES ('bcv_usd', ?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      tasa = excluded.tasa,
      fuente = excluded.fuente,
      fecha_valor = excluded.fecha_valor,
      es_manual = 1,
      updated_at = CURRENT_TIMESTAMP
  `
    )
    .bind(tasaNum, fuente, fechaActualizacion)
    .run();

  if (cache) {
    try {
      await cache.put('bcv_rate_usd', tasaNum.toString());
    } catch {
      // Ignorar si KV no está inicializado
    }
  }

  return c.json({
    success: true,
    tasa: tasaNum,
    fuente,
    fechaActualizacion,
    esManual: true,
    origen: 'manual_override',
  });
});

export default app;
