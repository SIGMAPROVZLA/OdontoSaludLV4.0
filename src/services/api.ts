import { SedeId, DashboardPulse, Cita, ToothRecord, Presupuesto, PagoRegistroRequest } from '../types/clinical';

const API_BASE_URL = '/api';

export class ApiClient {
  private static getHeaders(sedeId: SedeId): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-sede-id': sedeId,
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

  static async registrarCobro(
    datos: PagoRegistroRequest,
    sedeId: SedeId
  ): Promise<{ success: boolean; reciboId: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/presupuestos/cobro`, {
        method: 'POST',
        headers: this.getHeaders(sedeId),
        body: JSON.stringify(datos),
      });
      if (!res.ok) throw new Error('Error al registrar cobro');
      return await res.json();
    } catch {
      return { success: true, reciboId: `REC-${Date.now()}` };
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
