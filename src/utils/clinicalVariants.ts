/**
 * Variantes de Componentes Estandarizadas (Patrón CVA - AGENTS.md §4)
 * Gestión limpia de estados clínicos en botones, modales y badges sin dependencias externas.
 */

export type ClinicalStatusVariant =
  | 'tratamiento_pendiente'
  | 'en_curso'
  | 'alta_medica'
  | 'liquidado'
  | 'forense_sellado';

const BADGE_VARIANTS: Record<
  ClinicalStatusVariant,
  { label: string; icon: string; classes: string }
> = {
  tratamiento_pendiente: {
    label: 'Tratamiento Pendiente',
    icon: 'schedule',
    classes: 'bg-amber-50 text-amber-800 border border-amber-300',
  },
  en_curso: {
    label: 'En Curso',
    icon: 'dentistry',
    classes: 'bg-purple-50 text-primary border border-outline-variant',
  },
  alta_medica: {
    label: 'Alta Médica',
    icon: 'verified',
    classes: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
  },
  liquidado: {
    label: 'Liquidado 100%',
    icon: 'paid',
    classes: 'bg-emerald-600 text-white border border-emerald-700 shadow-sm',
  },
  forense_sellado: {
    label: 'Sellado SHA-256',
    icon: 'gpp_good',
    classes: 'bg-slate-900 text-emerald-300 border border-emerald-500/40 font-mono',
  },
};

export function getClinicalBadgeConfig(variant: ClinicalStatusVariant) {
  return BADGE_VARIANTS[variant] || BADGE_VARIANTS.tratamiento_pendiente;
}
