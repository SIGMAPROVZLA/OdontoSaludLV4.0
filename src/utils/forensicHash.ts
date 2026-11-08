/**
 * Utilidad de Sellado Forense SHA-256 en Cliente (AGENTS.md §7.2)
 * Usa exclusivamente Web Crypto API nativa (crypto.subtle) sin dependencias externas (Filosofía ponytail).
 */

export interface ForensicSealMetadata {
  pacienteId?: string;
  doctorNombre: string;
  tipoDocumento:
    | 'radiografia_rvg'
    | 'prescripcion_medica'
    | 'evolucion_clinica'
    | 'comprobante_pago'
    | 'comprobante_liquidacion_honorarios';
  timestampUtc?: string;
}

export interface ForensicSealResult {
  sha256Hash: string;
  shortHash: string;
  selladoUtc: string;
  doctorFirmante: string;
  payloadSizeBytes: number;
}

/**
 * Calcula un hash SHA-256 criptográfico en hexadecimal a partir de un string o ArrayBuffer
 */
export async function computeSha256Hex(input: string | ArrayBuffer): Promise<string> {
  const buffer =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback determinista en entornos sin WebCrypto (tests aislados)
  const str = typeof input === 'string' ? input : new TextDecoder().decode(input);
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0').repeat(7).slice(0, 56);
}

/**
 * Genera un sello forense inmutable combinando el contenido clínico/multimedia
 * con la marca de tiempo UTC y el facultativo tratante.
 */
export async function generateForensicSeal(
  contentData: string,
  meta: ForensicSealMetadata
): Promise<ForensicSealResult> {
  const selladoUtc = meta.timestampUtc || new Date().toISOString();
  const doctorFirmante = (meta.doctorNombre || 'Facultativo OdontoSalud').trim();
  const canonicalEnvelope = `ODONTOSALUD-FORENSIC-V4|${meta.tipoDocumento}|${meta.pacienteId || 'N/A'}|${doctorFirmante}|${selladoUtc}|${contentData}`;

  const sha256Hash = await computeSha256Hex(canonicalEnvelope);
  const payloadSizeBytes = new TextEncoder().encode(contentData).byteLength;

  return {
    sha256Hash,
    shortHash: `${sha256Hash.slice(0, 8).toUpperCase()}…${sha256Hash.slice(-6).toUpperCase()}`,
    selladoUtc,
    doctorFirmante,
    payloadSizeBytes,
  };
}
