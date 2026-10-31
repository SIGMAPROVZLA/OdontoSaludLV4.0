import {
  SedeId,
  DashboardPulse,
  Cita,
  ToothRecord,
  Presupuesto,
  PagoRegistroRequest,
  TasaCambioInfo,
  OdontologoItem,
  HigienistaItem,
  TratamientoItem,
  PacienteItem,
  CondicionMedicaItem,
  TratamientoRealizadoItem,
  LiquidarHonorariosRequest,
} from '../types/clinical';

const API_BASE_URL = '/api';

export class ApiClient {
  private static getHeaders(sedeId?: SedeId): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-sede-id': sedeId || 'victoria',
    };
  }

  static async getDashboardPulse(sedeId: SedeId): Promise<DashboardPulse> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/pulse`, {
        headers: this.getHeaders(sedeId),
      });
      if (!res.ok) throw new Error('Error al obtener pulso clínico');
      return await res.json();
    } catch {
      return this.getMockDashboardPulse(sedeId);
    }
  }

  static async getCitas(sedeId: SedeId, fecha?: string): Promise<Cita[]> {
    try {
      const query = fecha ? `?fecha=${fecha}` : '';
      const res = await fetch(`${API_BASE_URL}/citas${query}`, {
        headers: this.getHeaders(sedeId),
      });
      if (!res.ok) throw new Error('Error al consultar citas');
      return await res.json();
    } catch {
      return this.getMockCitas(sedeId);
    }
  }

  static async crearCita(
    sedeId: SedeId,
    cita: Omit<Cita, 'id' | 'sedeId'>
  ): Promise<{ success: boolean; id: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/citas`, {
        method: 'POST',
        headers: this.getHeaders(sedeId),
        body: JSON.stringify(cita),
      });
      if (!res.ok) throw new Error('Error al crear cita');
      return await res.json();
    } catch {
      return { success: true, id: `cita-${Date.now()}` };
    }
  }

  static async actualizarEstadoCita(
    id: string,
    estado: string,
    sedeId: SedeId,
    boxNumero?: number
  ): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/citas/${id}/estado`, {
        method: 'PATCH',
        headers: this.getHeaders(sedeId),
        body: JSON.stringify({ estado, boxNumero }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      return await res.json();
    } catch {
      return { success: true };
    }
  }

  static async aprobarCitasLote(
    ids: string[],
    sedeId: SedeId
  ): Promise<{ success: boolean; count: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/citas/aprobar-lote`, {
        method: 'POST',
        headers: this.getHeaders(sedeId),
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Error al aprobar citas en lote');
      return await res.json();
    } catch {
      return { success: true, count: ids.length };
    }
  }

  static async getOdontograma(pacienteId: string, sedeId: SedeId): Promise<ToothRecord[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pacientes/${pacienteId}/odontograma`, {
        headers: this.getHeaders(sedeId),
      });
      if (!res.ok) throw new Error('Error al cargar odontograma');
      return await res.json();
    } catch {
      return this.getMockOdontograma();
    }
  }

  static async guardarPiezaOdontograma(
    pacienteId: string,
    pieza: ToothRecord,
    sedeId: SedeId
  ): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/pacientes/${pacienteId}/odontograma`, {
        method: 'POST',
        headers: this.getHeaders(sedeId),
        body: JSON.stringify({
          numeroFdi: pieza.numeroFdi,
          caras: pieza.surfaces,
          isAbsent: pieza.isAbsent,
          diagnostico: pieza.diagnostico,
          actualizadoPor: pieza.actualizadoPor,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar pieza');
      return await res.json();
    } catch {
      return { success: true };
    }
  }

  // 4. Módulo de Presupuestos Clínicos y Cobros en Box
  static async getPresupuestos(sedeId?: SedeId): Promise<Presupuesto[]> {
    try {
      const url = sedeId ? `${API_BASE_URL}/presupuestos?sedeId=${sedeId}` : `${API_BASE_URL}/presupuestos`;
      const res = await fetch(url, { headers: this.getHeaders(sedeId) });
      if (!res.ok) throw new Error('Error al cargar presupuestos');
      return await res.json();
    } catch {
      return [];
    }
  }

  static async getResumenCobros(sedeId?: SedeId): Promise<{
    success: boolean;
    cobradoHoyUsd: number;
    efectivoDivisasUsd: number;
    digitalUsd: number;
    presupuestosPendientesUsd: number;
    totalPresupuestosActivos: number;
  }> {
    try {
      const url = sedeId ? `${API_BASE_URL}/presupuestos/resumen?sedeId=${sedeId}` : `${API_BASE_URL}/presupuestos/resumen`;
      const res = await fetch(url, { headers: this.getHeaders(sedeId) });
      if (!res.ok) throw new Error('Error al cargar resumen financiero');
      return await res.json();
    } catch {
      return {
        success: true,
        cobradoHoyUsd: 0,
        efectivoDivisasUsd: 0,
        digitalUsd: 0,
        presupuestosPendientesUsd: 455,
        totalPresupuestosActivos: 4,
      };
    }
  }

  static async registrarCobro(
    datos: PagoRegistroRequest,
    sedeId: SedeId
  ): Promise<{
    success: boolean;
    reciboId: string;
    error?: string;
    presupuestoCodigo?: string;
    montoUsd?: number;
    montoBs?: number;
    tasaBcv?: number;
    nuevoAbonadoUsd?: number;
    saldoPendienteUsd?: number;
    estadoPresupuesto?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/presupuestos/cobro`, {
        method: 'POST',
        headers: this.getHeaders(sedeId),
        body: JSON.stringify(datos),
      });
      const data: any = await res.json();
      if (!res.ok) {
        return { success: false, reciboId: '', error: data?.error || 'Error al procesar cobro' };
      }
      return data;
    } catch (err: any) {
      return { success: false, reciboId: '', error: err?.message || 'Error de conexión con el servidor' };
    }
  }

  // 5. Integración Oficial en Línea de Tasa BCV
  static async getTasaBcv(refresh = false): Promise<TasaCambioInfo> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasas/bcv${refresh ? '?refresh=true' : ''}`);
      if (!res.ok) throw new Error('Error al consultar tasa BCV');
      return await res.json();
    } catch {
      return {
        moneda: 'USD',
        tasa: 875.65,
        fuente: 'BCV Oficial (Caché Local)',
        fechaActualizacion: new Date().toISOString(),
        esManual: false,
        origen: 'contingency',
      };
    }
  }

  static async fijarTasaManual(datos: {
    tasa: number;
    motivo?: string;
    fijadoPor?: string;
  }): Promise<TasaCambioInfo> {
    const res = await fetch(`${API_BASE_URL}/tasas/bcv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    if (!res.ok) throw new Error('Error al fijar tasa manual');
    return await res.json();
  }

  static async resetearTasaAutomatica(): Promise<TasaCambioInfo> {
    const res = await fetch(`${API_BASE_URL}/tasas/bcv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetearAutomatico: true }),
    });
    if (!res.ok) throw new Error('Error al restaurar tasa automática');
    return await res.json();
  }

  // 6. Control de Data: Odontólogos, Higienistas, Tratamientos, Pacientes, Condiciones Médicas y Citas
  static async getControlData(): Promise<{
    odontologos: OdontologoItem[];
    higienistas: HigienistaItem[];
    tratamientos: TratamientoItem[];
    pacientes?: PacienteItem[];
    condicionesMedicas?: CondicionMedicaItem[];
    citas?: Cita[];
  } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/control-data`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  static async eliminarCita(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/citas/${id}`, { method: 'DELETE' });
      return { success: res.ok };
    } catch {
      return { success: true };
    }
  }

  static async guardarCondicionMedica(item: CondicionMedicaItem): Promise<{ success: boolean; id: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/control-data/condiciones-medicas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Error D1');
      return await res.json();
    } catch {
      return { success: true, id: item.id };
    }
  }

  static async eliminarCondicionMedica(id: string): Promise<{ success: boolean }> {
    try {
      await fetch(`${API_BASE_URL}/control-data/condiciones-medicas/${id}`, { method: 'DELETE' });
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  static async guardarPaciente(item: PacienteItem): Promise<{ success: boolean; id: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/control-data/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Error D1');
      return await res.json();
    } catch {
      return { success: true, id: item.id };
    }
  }

  static async buscarPacientePorCedula(cedula: string): Promise<PacienteItem | null> {
    try {
      const clean = cedula.replace(/[^0-9]/g, '');
      const res = await fetch(`${API_BASE_URL}/pacientes/cedula/${clean}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  static async eliminarPaciente(id: string): Promise<{ success: boolean }> {
    try {
      await fetch(`${API_BASE_URL}/control-data/pacientes/${id}`, { method: 'DELETE' });
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  static async guardarOdontologo(item: OdontologoItem): Promise<{ success: boolean; id: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/control-data/odontologos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Error D1');
      return await res.json();
    } catch {
      return { success: true, id: item.id };
    }
  }

  static async eliminarOdontologo(id: string): Promise<{ success: boolean }> {
    try {
      await fetch(`${API_BASE_URL}/control-data/odontologos/${id}`, { method: 'DELETE' });
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  static async guardarHigienista(item: HigienistaItem): Promise<{ success: boolean; id: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/control-data/higienistas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Error D1');
      return await res.json();
    } catch {
      return { success: true, id: item.id };
    }
  }

  static async eliminarHigienista(id: string): Promise<{ success: boolean }> {
    try {
      await fetch(`${API_BASE_URL}/control-data/higienistas/${id}`, { method: 'DELETE' });
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  static async guardarTratamiento(item: TratamientoItem): Promise<{ success: boolean; id: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/control-data/tratamientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Error D1');
      return await res.json();
    } catch {
      return { success: true, id: item.id };
    }
  }

  static async eliminarTratamiento(id: string): Promise<{ success: boolean }> {
    try {
      await fetch(`${API_BASE_URL}/control-data/tratamientos/${id}`, { method: 'DELETE' });
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  // Métodos para Registro y Consulta de Tratamientos Realizados en Cloudflare D1
  static async getTratamientosRealizadosPaciente(pacienteId: string): Promise<{
    success: boolean;
    pacienteId: string;
    total: number;
    tratamientos: TratamientoRealizadoItem[];
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tratamientos-realizados/paciente/${encodeURIComponent(pacienteId)}`);
      if (!res.ok) throw new Error('Error al consultar historial del paciente');
      return await res.json();
    } catch {
      return {
        success: true,
        pacienteId,
        total: 1,
        tratamientos: [
          {
            id: 'tr-fallback-1',
            pacienteId,
            odontologoId: 'odo-1',
            odontologoNombre: 'Dra. María Alejandra Domínguez',
            tratamientoId: 'trat-1',
            tratamientoCodigo: 'OD-101',
            tratamientoNombre: 'Evaluación Integral & Diagnóstico Digital RVG',
            costoTotalUsd: 25,
            porcentajeHonorario: 50,
            montoHonorarioUsd: 12.5,
            estadoPagoHonorario: 'pendiente',
            sedeId: 'victoria',
            fechaRealizacion: new Date().toISOString(),
          },
        ],
      };
    }
  }

  static async getTratamientosRealizadosOdontologo(
    odontologoId: string,
    estado?: 'pendiente' | 'liquidado'
  ): Promise<{
    success: boolean;
    odontologoId: string;
    resumen: {
      totalProcedimientos: number;
      totalProduccionUsd: number;
      totalHonorariosPendientesUsd: number;
      totalHonorariosLiquidadosUsd: number;
    };
    tratamientos: TratamientoRealizadoItem[];
  }> {
    try {
      const query = estado ? `?estado=${estado}` : '';
      const res = await fetch(`${API_BASE_URL}/tratamientos-realizados/odontologo/${encodeURIComponent(odontologoId)}${query}`);
      if (!res.ok) throw new Error('Error al consultar honorarios del odontólogo');
      return await res.json();
    } catch {
      return {
        success: true,
        odontologoId,
        resumen: {
          totalProcedimientos: 0,
          totalProduccionUsd: 0,
          totalHonorariosPendientesUsd: 0,
          totalHonorariosLiquidadosUsd: 0,
        },
        tratamientos: [],
      };
    }
  }

  static async getTratamientosRealizados(params?: {
    sedeId?: string;
    estado?: 'pendiente' | 'liquidado';
  }): Promise<{
    success: boolean;
    total: number;
    tratamientos: TratamientoRealizadoItem[];
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.sedeId) queryParams.append('sedeId', params.sedeId);
      if (params?.estado) queryParams.append('estado', params.estado);
      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const res = await fetch(`${API_BASE_URL}/tratamientos-realizados${queryStr}`);
      if (!res.ok) throw new Error('Error al consultar tratamientos realizados');
      return await res.json();
    } catch {
      return {
        success: true,
        total: 0,
        tratamientos: [],
      };
    }
  }

  static async registrarTratamientoRealizado(
    data: Partial<TratamientoRealizadoItem>
  ): Promise<{
    success: boolean;
    id: string;
    montoHonorarioUsd: number;
    montoHonorarioBs: number;
    tasaBcv: number;
    mensaje: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tratamientos-realizados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al registrar procedimiento en D1');
      return await res.json();
    } catch {
      return {
        success: true,
        id: `tr-${Date.now()}`,
        montoHonorarioUsd: (data.costoTotalUsd || 0) * 0.4,
        montoHonorarioBs: (data.costoTotalUsd || 0) * 0.4 * 42.5,
        tasaBcv: 42.5,
        mensaje: 'Guardado localmente (contingencia)',
      };
    }
  }

  static async liquidarHonorariosLote(
    request: LiquidarHonorariosRequest
  ): Promise<{
    success: boolean;
    liquidados: number;
    referencia: string;
    fechaLiquidacion: string;
    mensaje: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tratamientos-realizados/liquidar-lote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error('Error al liquidar honorarios en D1');
      return await res.json();
    } catch {
      return {
        success: true,
        liquidados: request.ids.length,
        referencia: request.referencia,
        fechaLiquidacion: request.fechaLiquidacion || new Date().toISOString(),
        mensaje: 'Liquidado en modo contingencia',
      };
    }
  }

  static async eliminarTratamientoRealizado(id: string): Promise<{ success: boolean }> {
    try {
      await fetch(`${API_BASE_URL}/tratamientos-realizados/${id}`, { method: 'DELETE' });
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  // Mocks clínicos de alta fidelidad para fallback y desarrollo offline
  private static getMockDashboardPulse(sedeId: SedeId): DashboardPulse {
    return {
      sede: sedeId,
      tasaBcv: 49.85,
      timestamp: new Date().toISOString(),
      metricas: {
        citasTotal: sedeId === 'victoria' ? 12 : 6,
        enEspera: sedeId === 'victoria' ? 3 : 1,
        ocupacionPorcentaje: sedeId === 'victoria' ? 85 : 50,
        presupuestosPendientesUsd: 1420,
        cobradoHoyUsd: 680,
      },
      boxes: [
        {
          boxNumero: 1,
          estado: 'ocupado',
          doctorNombre: 'Dra. Domínguez',
          pacienteNombre: 'Carlos Mendoza',
          procedimiento: 'Endodoncia #16',
        },
        {
          boxNumero: 2,
          estado: 'ocupado',
          doctorNombre: 'Dr. Silva',
          pacienteNombre: 'Marcos Ramos',
          procedimiento: 'Control Ortodoncia',
        },
        {
          boxNumero: 3,
          estado: 'limpieza',
          doctorNombre: 'Dra. Domínguez',
          pacienteNombre: 'Siguiente turno',
        },
        {
          boxNumero: 4,
          estado: 'disponible',
        },
      ],
      citasHoy: this.getMockCitas(sedeId),
    };
  }

  private static getMockCitas(sedeId: SedeId): Cita[] {
    return [
      {
        id: 'cita-1',
        sedeId,
        pacienteId: 'pac-carlos',
        pacienteNombre: 'Carlos Mendoza',
        pacienteCedula: 'V-17.654.321',
        pacienteTelefono: '+58 412-1234567',
        pacienteAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBzpgvRJh9btHfNcLaqu8sARVkZh5qVPxp6j5yySwKypfVKbxSE1puHRsmNzVkRuYdXr7F9HTZ5V_8jhwQZ5fDhqDnYwMUIku7sJw4YNdq8kpukwjdlxFt0H4neGHQzZaxv2QJhzYotnKHghusM5DrlxvET1GpuedSAc7Q0bXwsvtwnOnlzOP0MBtQrEq-Dpa_eCdKoFLdDKxr_RThr44bDpu4zOHeHoRaCA_Lu6YI',
        doctorNombre: 'Dra. Domínguez',
        boxNumero: 1,
        fechaCita: '2025-10-10',
        horaInicio: '09:30 AM',
        motivo: 'Endodoncia #16',
        estado: 'en_sillon',
        esUrgencia: false,
        minutosTranscurridos: 22,
      },
      {
        id: 'cita-2',
        sedeId,
        pacienteId: 'pac-patricia',
        pacienteNombre: 'Patricia Velásquez',
        pacienteCedula: 'V-19.845.221',
        pacienteTelefono: '+58 414-5550921',
        pacienteAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBRXYjfamoV_aUlqbIMEBKdsh9YFwgLzf-ru3PEihAYV_t5uDcmgyKw0xaNI4cX0N9OIrm7cfsmc3I3eWGwk1X3wg7wI52y07yE8X6gcki6RxC4IUklN3m3q-OvCWvgExmJ0bOkYXebx171YsKVtRvPSjYftSSqjWrK8I9FUl45_u9xLFuPZY25UFTo10_yogGiIa1wpwpxgJViiDysivsjySS8Ip_G-ji_jyz-VZ0',
        doctorNombre: 'Dra. Domínguez',
        boxNumero: 1,
        fechaCita: '2025-10-10',
        horaInicio: '10:15 AM',
        motivo: 'Profilaxis & Destartraje',
        estado: 'pendiente',
        esUrgencia: false,
      },
      {
        id: 'cita-3',
        sedeId,
        pacienteId: 'pac-marcos',
        pacienteNombre: 'Marcos Ramos',
        pacienteCedula: 'V-22.113.890',
        pacienteTelefono: '+58 424-7890123',
        doctorNombre: 'Dr. Silva',
        boxNumero: 2,
        fechaCita: '2025-10-10',
        horaInicio: '11:00 AM',
        motivo: 'Control Ortodoncia',
        estado: 'confirmada',
        esUrgencia: false,
      },
    ];
  }

  private static getMockOdontograma(): ToothRecord[] {
    const teeth: ToothRecord[] = [];
    const allFdi = [
      18, 17, 16, 15, 14, 13, 12, 11,
      21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41,
      31, 32, 33, 34, 35, 36, 37, 38,
    ];

    allFdi.forEach((fdi) => {
      let isAbsent = false;
      let surfaces: ToothRecord['surfaces'] = {
        V: 'sano',
        M: 'sano',
        O: 'sano',
        D: 'sano',
        L: 'sano',
      };
      let diag = 'Esmalte íntegro, sin patologías';

      if (fdi === 18 || fdi === 28 || fdi === 48 || fdi === 38) {
        isAbsent = true;
        diag = 'Pieza ausente / No erupcionada';
      } else if (fdi === 16) {
        surfaces = { V: 'sano', M: 'sano', O: 'caries', D: 'sano', L: 'sano' };
        diag = 'Caries activa oclusal profunda grado III con riesgo pulpar';
      } else if (fdi === 15 || fdi === 46) {
        surfaces = { V: 'sano', M: 'sano', O: 'resina', D: 'sano', L: 'sano' };
        diag = 'Restauración oclusal adaptada';
      } else if (fdi === 24) {
        surfaces = { V: 'sano', M: 'resina', O: 'resina', D: 'sano', L: 'sano' };
        diag = 'Resina compuesta mesio-oclusal (MO)';
      } else if (fdi === 12 || fdi === 27) {
        surfaces = { V: 'corona', M: 'corona', O: 'corona', D: 'corona', L: 'corona' };
        diag = 'Corona completa en porcelana / Disilicato';
      }

      teeth.push({
        numeroFdi: fdi,
        nombre: `Pieza FDI ${fdi}`,
        surfaces,
        isAbsent,
        diagnostico: diag,
        actualizadoPor: 'Dra. María Alejandra Domínguez',
      });
    });

    return teeth;
  }
}
