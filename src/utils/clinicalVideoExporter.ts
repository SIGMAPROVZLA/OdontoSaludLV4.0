import { ToothRecord } from '../types/clinical';

/**
 * Generación de Resúmenes y Video Clínico en Cliente (AGENTS.md §4)
 * Renderiza un clip MP4/WebM de evolución del Odontograma FDI 100% en el navegador
 * usando HTML5 Canvas + MediaRecorder / WebCodecs (Cero costos de servidor en la nube).
 */

export interface ClinicalVideoExportParams {
  pacienteNombre: string;
  pacienteCedula: string;
  doctorNombre: string;
  sedeNombre: string;
  fechaConsulta: string;
  teeth: ToothRecord[];
  presupuestoTotalUsd: number;
  sha256Seal: string;
}

export async function exportClinicalEvolutionVideo(
  params: ClinicalVideoExportParams
): Promise<{ success: boolean; format: 'video' | 'image'; filename: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el motor gráfico Canvas 2D');
  }

  const affectedTeeth = params.teeth.filter(
    (t) =>
      t.isAbsent ||
      (t.procedimientoGeneral && t.procedimientoGeneral !== 'ninguno') ||
      Object.values(t.surfaces || {}).some((s) => s !== 'sano')
  );

  const drawFrame = (progress: number) => {
    // Fondo oscuro clínico de alto contraste
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#17121D');
    grad.addColorStop(1, '#302538');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Cabecera institucional
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(40, 32, 1200, 95);
    ctx.strokeStyle = 'rgba(176,155,184,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 32, 1200, 95);

    ctx.fillStyle = '#E8DDEB';
    ctx.font = 'bold 28px Sora, sans-serif';
    ctx.fillText('ODONTOSALUD LA VICTORIA 4.0 — RESUMEN CLÍNICO EVOLUTIVO', 68, 74);

    ctx.fillStyle = '#B09BB8';
    ctx.font = '600 16px Manrope, sans-serif';
    ctx.fillText(
      `Sede: ${params.sedeNombre}  |  Fecha: ${params.fechaConsulta}  |  Facultativo: ${params.doctorNombre}`,
      68,
      106
    );

    // Tarjeta de Paciente y Presupuesto
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fillRect(40, 150, 1200, 110);

    ctx.fillStyle = '#17121D';
    ctx.font = 'bold 24px Sora, sans-serif';
    ctx.fillText(`Paciente: ${params.pacienteNombre} (${params.pacienteCedula})`, 68, 195);

    ctx.fillStyle = '#51405F';
    ctx.font = 'bold 18px Manrope, sans-serif';
    ctx.fillText(
      `Piezas con hallazgos o tratamiento activo: ${affectedTeeth.length} de ${params.teeth.length} piezas evaluadas`,
      68,
      232
    );

    // Badge Presupuesto
    ctx.fillStyle = '#10B981';
    ctx.fillRect(940, 170, 270, 70);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Manrope, sans-serif';
    ctx.fillText('PRESUPUESTO DE LA CITA', 965, 196);
    ctx.font = 'bold 28px Sora, sans-serif';
    ctx.fillText(`$${params.presupuestoTotalUsd.toFixed(2)} USD`, 965, 228);

    // Visualización animada del Odontograma FDI (Arcada Superior e Inferior)
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(40, 285, 1200, 330);
    ctx.strokeStyle = 'rgba(176,155,184,0.3)';
    ctx.strokeRect(40, 285, 1200, 330);

    ctx.fillStyle = '#E8DDEB';
    ctx.font = 'bold 18px Sora, sans-serif';
    ctx.fillText('MAPA VECTORIAL ODONTOGRAMA FDI (EVOLUCIÓN ANTES / DESPUÉS)', 68, 322);

    const upperRow = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const lowerRow = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

    const drawArchRow = (rowFdi: number[], yBase: number) => {
      rowFdi.forEach((fdi, idx) => {
        const revealIndex = Math.floor(progress * 16);
        const isRevealed = idx <= revealIndex;
        const tooth = params.teeth.find((t) => t.numeroFdi === fdi);
        const x = 66 + idx * 71;

        let boxColor = 'rgba(255,255,255,0.12)';
        let borderColor = 'rgba(255,255,255,0.25)';
        let statusTag = 'SANO';

        if (tooth && isRevealed) {
          const proc = tooth.procedimientoGeneral || 'ninguno';
          const hasCaries = Object.values(tooth.surfaces || {}).includes('caries');
          const hasResina = Object.values(tooth.surfaces || {}).includes('resina');
          const hasCorona = proc === 'corona' || Object.values(tooth.surfaces || {}).includes('corona');

          if (proc === 'endodoncia') {
            boxColor = 'rgba(139, 92, 246, 0.35)';
            borderColor = '#8B5CF6';
            statusTag = 'ENDO';
          } else if (proc === 'exodoncia' || tooth.isAbsent) {
            boxColor = 'rgba(239, 68, 68, 0.35)';
            borderColor = '#EF4444';
            statusTag = 'EXO';
          } else if (proc === 'protesis') {
            boxColor = 'rgba(16, 185, 129, 0.35)';
            borderColor = '#10B981';
            statusTag = 'PRÓT';
          } else if (proc === 'implante') {
            boxColor = 'rgba(6, 182, 212, 0.35)';
            borderColor = '#06B6D4';
            statusTag = 'IMPL';
          } else if (hasCorona) {
            boxColor = 'rgba(245, 158, 11, 0.35)';
            borderColor = '#F59E0B';
            statusTag = 'COR';
          } else if (hasCaries) {
            boxColor = 'rgba(239, 68, 68, 0.3)';
            borderColor = '#F87171';
            statusTag = 'CARIES';
          } else if (hasResina) {
            boxColor = 'rgba(59, 130, 246, 0.35)';
            borderColor = '#60A5FA';
            statusTag = 'RESINA';
          }
        }

        ctx.fillStyle = boxColor;
        ctx.fillRect(x, yBase, 62, 92);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, yBase, 62, 92);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Sora, sans-serif';
        ctx.fillText(`#${fdi}`, x + 14, yBase + 30);

        ctx.fillStyle = '#E8DDEB';
        ctx.font = 'bold 11px Manrope, sans-serif';
        ctx.fillText(statusTag, x + 10, yBase + 68);
      });
    };

    drawArchRow(upperRow, 350);
    drawArchRow(lowerRow, 480);

    // Pie de Sello Forense SHA-256
    ctx.fillStyle = '#090D16';
    ctx.fillRect(40, 635, 1200, 52);
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `SELLO FORENSE SHA-256 (EDGE ZERO-SERVER): ${params.sha256Seal}  |  UTC: ${new Date().toISOString()}`,
      64,
      666
    );
  };

  const cleanCedula = params.pacienteCedula.replace(/[^0-9A-Za-z]/g, '');

  // Intentar grabación de video en cliente a 30 FPS durante 1.5 segundos si MediaRecorder está disponible
  if (typeof MediaRecorder !== 'undefined' && typeof (canvas as any).captureStream === 'function') {
    try {
      const stream = (canvas as any).captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const stopPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start();
      const totalSteps = 25;
      for (let step = 0; step <= totalSteps; step++) {
        drawFrame(step / totalSteps);
        await new Promise((r) => setTimeout(r, 45));
      }
      recorder.stop();

      const videoBlob = await stopPromise;
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const filename = `Evolucion_OdontoSalud_${cleanCedula}.${ext}`;
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      return { success: true, format: 'video', filename };
    } catch {
      // Fallback a lámina de alta definición si MediaRecorder falla en algún navegador móvil
    }
  }

  // Fallback instantáneo: exportar lámina clínica HD en JPEG firmada
  drawFrame(1);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const filename = `Resumen_Clinico_OdontoSalud_${cleanCedula}.jpg`;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  return { success: true, format: 'image', filename };
}
