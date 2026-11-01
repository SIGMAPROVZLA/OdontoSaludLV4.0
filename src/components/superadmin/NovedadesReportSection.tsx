import React from 'react';
import { triggerClinicalConfetti } from '../../utils/confetti';
import { DeterministicIdenticon } from '../../utils/identicon';

/**
 * Reporte Oficial de Novedades y Motion Graphics v4.0 (AGENTS.md §4)
 * Muestra detallada con interactividad y demostraciones de todas las innovaciones cinemáticas implementadas.
 */

interface NovedadCard {
  id: string;
  categoria: 'Motion Graphics' | 'Cinemática Cliente' | 'Seguridad Forense' | 'Arquitectura Edge';
  titulo: string;
  subtitulo: string;
  icono: string;
  color: string;
  descripcion: string;
  beneficio: string;
  demoType?: 'confetti' | 'identicon' | 'video' | 'palette';
}

const NOVEDADES_PLATAFORMA: NovedadCard[] = [
  {
    id: 'nov-telemetria',
    categoria: 'Motion Graphics',
    titulo: 'Osciloscopio Anycast & Tráfico de APIs 60 FPS',
    subtitulo: 'Telemetría cinemática de paquetes y latencia en vivo',
    icono: 'query_stats',
    color: '#10B981',
    descripcion:
      'Motor gráfico en HTML5 Canvas que renderiza a 60 FPS el flujo de paquetes de red, el osciloscopio de latencia basal Anycast contra el SLA < 50ms y las llamadas transaccionales a Cloudflare D1, KV y R2.',
    beneficio: 'Diagnóstico en tiempo real sin recargar página ni degradar la CPU (< 10ms presupuesto).',
  },
  {
    id: 'nov-diagrama',
    categoria: 'Motion Graphics',
    titulo: 'Diagrama Cinemático Edge Zero-Server',
    subtitulo: 'Flujo visual interactivo con pulsos de luz SVG',
    icono: 'schema',
    color: '#38BDF8',
    descripcion:
      'Representación esquemática viva del ecosistema Cloudflare Native con pulsos luminosos cinemáticos que ilustran la sincronización atómica entre el Cliente PWA, Cloudflare Workers Hono y las capas de persistencia.',
    beneficio: 'Comprensión arquitectónica inmediata y trazabilidad del modelo Zero-Server.',
  },
  {
    id: 'nov-odontograma-pedia',
    categoria: 'Cinemática Cliente',
    titulo: 'Odontograma FDI Adulto (11–48) & Pediátrico (51–85)',
    subtitulo: 'Física táctil de resortes y halo luminoso reactivo',
    icono: 'dentistry',
    color: '#8B5CF6',
    descripcion:
      'Ampliación a dentición infantil temporal con 20 piezas FDI (51–85) y 32 permanentes (11–48). Micro-interacciones de resorte háptico visual (active:scale-95) y halos cromáticos perimetrales para Endodoncia (púrpura), Exodoncia (rojo), Prótesis (ámbar) e Implante (cian).',
    beneficio: 'Inspección odontopediátrica completa con selección inmediata en sillón.',
  },
  {
    id: 'nov-confetti',
    categoria: 'Cinemática Cliente',
    titulo: 'Feedback Positivo & Confeti Clínico en Canvas',
    subtitulo: 'Celebración táctil de liquidaciones y altas médicas',
    icono: 'celebration',
    color: '#F59E0B',
    descripcion:
      'Disparador cinemático de partículas aceleradas por hardware en HTML5 Canvas que felicita al facultativo y paciente al fijar el presupuesto definitivo o liquidar el 100% del pago en Box, respetando estrictamente prefers-reduced-motion.',
    beneficio: 'Experiencia clínica gratificante con 0 KB de dependencias npm superfluas.',
    demoType: 'confetti',
  },
  {
    id: 'nov-video',
    categoria: 'Cinemática Cliente',
    titulo: 'Exportador de Video y Resumen Clínico en Cliente',
    subtitulo: 'Generación WebCodecs / MediaRecorder MP4/WebM',
    icono: 'movie_edit',
    color: '#EC4899',
    descripcion:
      'Generador 100% en el navegador que renderiza una animación secuencial de evolución dental antes/después del Odontograma FDI y exporta un clip de video MP4/WebM o lámina HD con su sello forense SHA-256 para entregar al paciente.',
    beneficio: 'Cero costos de cómputo en servidores externos o APIs de pago.',
  },
  {
    id: 'nov-identicon',
    categoria: 'Cinemática Cliente',
    titulo: 'Identicones Vectoriales Deterministas SVG',
    subtitulo: 'Avatares únicos generados desde la cédula sin R2',
    icono: 'fingerprint',
    color: '#3B82F6',
    descripcion:
      'Algoritmo matemático de dispersión que genera identicones geométricos orgánicos en SVG para cada paciente y doctor basados en su cédula o correo. Reemplaza avatares genéricos sin realizar llamadas de almacenamiento a Cloudflare R2.',
    beneficio: 'Ahorro masivo de ancho de banda y consistencia de identidad visual.',
    demoType: 'identicon',
  },
  {
    id: 'nov-forense',
    categoria: 'Seguridad Forense',
    titulo: 'Sellado Forense Criptográfico SHA-256',
    subtitulo: 'Web Crypto API nativa (crypto.subtle) en el borde',
    icono: 'gpp_good',
    color: '#059669',
    descripcion:
      'Firma inmutable calculada en el navegador combinando los binarios de la imagen radiográfica RVG, récipe médico o comprobante de pago con la marca de tiempo UTC y el doctor tratante, resguardada en la tabla D1 auditoria_acciones.',
    beneficio: 'Respaldo legal y pericial odontológico contra manipulaciones.',
  },
  {
    id: 'nov-paletas',
    categoria: 'Arquitectura Edge',
    titulo: 'Motor Dinámico de Paletas del Catálogo Maestro',
    subtitulo: 'Inyección reactiva en variables CSS :root con KV/D1',
    icono: 'palette',
    color: '#6366F1',
    descripcion:
      'Permite al SuperAdmin alternar en vivo entre el Catálogo Maestro (#14 Founder Purple, #13 Deep Teal, #12 Trust Navy, #15 Enterprise Navy), actualizando dinámicamente las variables nativas del DOM y sincronizándolas en Cloudflare KV y D1.',
    beneficio: 'Personalización visual inmediata cumpliendo contraste WCAG AA >= 4.5:1.',
  },
];

export const NovedadesReportSection: React.FC = () => {
  return (
    <div className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4">
      {/* Cabecera del Reporte de Novedades */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-amber-400">new_releases</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                Reporte de Novedades & Motion Graphics v4.0
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                8 INNOVACIONES ACTIVAS
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Catálogo de capacidades cinemáticas en cliente, seguridad forense y arquitectura Edge Zero-Server
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => triggerClinicalConfetti()}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-primary text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">celebration</span>
          <span>Probar Confeti 60 FPS</span>
        </button>
      </div>

      {/* Grid de Novedades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {NOVEDADES_PLATAFORMA.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between gap-3 transition-all hover:bg-surface-container/60 shadow-2xs"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icono}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                      {item.categoria}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-dental-deep-navy leading-tight">
                      {item.titulo}
                    </h4>
                  </div>
                </div>

                {item.demoType === 'confetti' && (
                  <button
                    type="button"
                    onClick={() => triggerClinicalConfetti()}
                    className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-extrabold transition-all active:scale-90 shrink-0 cursor-pointer"
                  >
                    🎉 Disparar
                  </button>
                )}
                {item.demoType === 'identicon' && (
                  <div className="shrink-0">
                    <DeterministicIdenticon seed="V-16.762.319" name="Raymond Gilbonio" size={32} />
                  </div>
                )}
              </div>

              <p className="text-[11px] text-secondary leading-relaxed">
                {item.descripcion}
              </p>
            </div>

            <div className="pt-2 border-t border-border-subtle/60 flex items-center gap-1.5 text-[10px] text-dental-deep-navy font-semibold">
              <span className="material-symbols-outlined text-[14px] text-status-success">verified</span>
              <span><strong>Beneficio:</strong> {item.beneficio}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
