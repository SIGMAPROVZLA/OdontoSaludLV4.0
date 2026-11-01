/**
 * OdontoSalud La Victoria 4.0 - Compresión de Imágenes en Cliente
 * Optimización de radiografías digitales RVG 2.0, recetas médicas y comprobantes bancarios
 * para almacenamiento eficiente y ultraligero en Cloudflare D1 / R2.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 a 1.0
}

/**
 * Comprime un archivo File, Blob o string Base64 redimensionándolo proporcionalmente
 * y exportándolo como JPEG optimizado mediante HTML5 Canvas.
 * Reduce fotos tomadas desde smartphones (5-12 MB) a solo ~100-250 KB.
 */
export async function compressImage(
  fileOrBase64: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 1280, maxHeight = 1280, quality = 0.75 } = options;

  return new Promise((resolve, reject) => {
    // Si no estamos en entorno de navegador con soporte de Image/Canvas, retornar fallback
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      if (typeof fileOrBase64 === 'string') {
        return resolve(fileOrBase64);
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      return reader.readAsDataURL(fileOrBase64);
    }

    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calcular escalado proporcional manteniendo la relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (typeof fileOrBase64 === 'string') return resolve(fileOrBase64);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          return reader.readAsDataURL(fileOrBase64);
        }

        // Renderizar con suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como JPEG con la tasa de calidad solicitada
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
