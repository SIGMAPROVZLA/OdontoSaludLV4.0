# 📘 Diario de Desarrollo & Registro Pedagógico de Cambios
## Proyecto OdontoSaludLV 4.0 (Plataforma Médica Consolidada)

---

## 🎯 1. Visión y Propósito del Proyecto
**OdontoSaludLV 4.0** es una plataforma clínica integral diseñada para la gestión médica y administrativa moderna de los centros **OdontoSalud** en **La Victoria** (Sede Principal) y la **Colonia Tovar** (Sucursal), integrando el motor de inteligencia clínica **VictorIA Pro**.

La arquitectura está concebida bajo el paradigma **Serverless Edge-First**, combinando:
1. **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS para una interfaz reactiva, táctil y de respuesta instantánea en box o escritorio.
2. **Backend:** Cloudflare Workers impulsado por el framework ultraligero **Hono**, operando con latencia perimetral mínima.
3. **Persistencia:** Cloudflare D1 (SQLite relacional distribuido), Cloudflare KV (sesiones y caché de tasas BCV) y Cloudflare R2 (almacén de imágenes periapicales RVG y radiografías).

---

## 🪵 2. Registro de Hitos & Cambios con Comentarios Pedagógicos

### 📌 Hito 1: Inicialización y Repositorio Seguro en GitHub
* **Fecha:** 2026-10-10
* **Repositorio Remoto:** `https://github.com/SIGMAPROVZLA/OdontoSaludLV4.0.git`
* **Commit:** `5d084d2` (`main`)
* **Autor:** `sigmprovzla` <`Raymondgilbonio@sigmaprovzla.com`>
* **💡 Comentario Pedagógico:**
  * **Problema resuelto:** En sistemas Windows con múltiples proyectos, *Git Credential Manager* retiene sesiones anteriores (en este caso, la cuenta antigua `Sigmapro-VZLA`). Esto ocasionaba un error `403 Forbidden` al intentar empujar al nuevo repositorio de la organización.
  * **Solución aplicada:** Se depuró la credencial previa en el subsistema `cmdkey` de Windows y se inyectó el nuevo Personal Access Token (PAT) con permisos de escritura de repositorio directamente en el almacén cifrado DPAPI de Windows. Esto asegura que ningún secreto quede expuesto en el historial de Git ni en los archivos de configuración local.

---

### 📌 Hito 2: Resguardo y Disponibilidad de Variables de Entorno (`.dev.vars`)
* **Archivos clave:** [`.dev.vars`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/.dev.vars), [`.gitignore`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/.gitignore)
* **💡 Comentario Pedagógico:**
  * **Ecosistema Cloudflare:** A diferencia de proyectos tradicionales basados en Node.js que emplean archivos `.env`, Cloudflare Wrangler utiliza `.dev.vars` para el desarrollo local emulado y secrets perimetrales en producción.
  * **Disponibilidad:** Se recopilaron de forma segura las credenciales de Cloudflare (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) y los identificadores de recursos heredados de VictorIA Pro. Al estar `.dev.vars` registrado dentro de `.gitignore`, se protege la privacidad de la infraestructura ante cualquier commit involuntario.

---

### 📌 Hito 3: Arquitectura Multisede con Aislamiento Contextual
* **Archivos clave:** [`src/context/SedeContext.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/context/SedeContext.tsx), [`src/services/api.ts`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/services/api.ts)
* **💡 Comentario Pedagógico:**
  * **Patrón de Diseño Multisede:** Se configuró un contexto reactivo (`SedeContext`) que gestiona el estado de la sede activa:
    * **La Victoria:** C. C. Márquez del Toro, PB, Local 18 (4 boxes, sillón quirúrgico RVG).
    * **Colonia Tovar:** C. C. Manantial, Sector La Ballesta (2 boxes, atención integral/ortodoncia).
  * **Inyección de Cabecera:** Toda petición saliente del cliente HTTP (`ApiClient`) incluye de forma transparente la cabecera `x-sede-id: victoria | tovar`. El servidor Hono intercepta esta cabecera mediante un middleware perimetral y segmenta automáticamente las consultas a nivel de base de datos sin requerir subdominios complejos.

---

### 📌 Hito 4: Odontograma Anatómico SVG Interactivo (Norma FDI)
* **Archivos clave:**
  * [`src/components/odontogram/AnatomicalToothSvg.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/odontogram/AnatomicalToothSvg.tsx)
  * [`src/components/odontogram/QuadrantArchView.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/odontogram/QuadrantArchView.tsx)
  * [`src/components/odontogram/ToothEditorModal.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/odontogram/ToothEditorModal.tsx)
* **💡 Comentario Pedagógico:**
  * **Anatomía vs. Diagrama Geométrico:** En lugar de representar los dientes con simples cuadrados o círculos planos, se implementó renderizado SVG vectorial detallado por corona y raíz.
  * **Topología de 5 Caras:** Cada pieza dental mapea independientemente sus superficies:
    * **V:** Vestibular
    * **M:** Mesial
    * **O:** Oclusal / Incisal
    * **D:** Distal
    * **L:** Palatino / Lingual
  * **Estados Clínicos Diagnósticos:** Permite conmutar estados patológicos y terapéuticos con código de color médico estandarizado:
    * 🔴 Caries activa (Rojo de alerta)
    * 🔵 Obturación en resina (Azul restaurador)
    * 🟡 Corona completa / Prótesis fija (Ámbar)
    * 🟣 Endodoncia / Tratamiento de conducto (Púrpura)
    * ⚪ Pieza ausente / Exodoncia (Opacidad atenuada con cruz)

---

### 📌 Hito 5: Base de Datos Relacional D1 y Semillas Clínicas Locales
* **Archivos clave:**
  * [`migrations/0001_initial_schema.sql`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/migrations/0001_initial_schema.sql)
  * [`migrations/0002_seed_clinical_data.sql`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/migrations/0002_seed_clinical_data.sql)
* **💡 Comentario Pedagógico:**
  * **Esquema Relacional SQLite/D1:** Se crearon las tablas operativas: `sedes`, `pacientes`, `citas`, `odontograma_piezas`, `radiografias`, `presupuestos`, `pagos`.
  * **Semillas de Alta Fidelidad:** Se crearon y aplicaron datos iniciales reales con los pacientes Carlos Mendoza, Patricia Velásquez y Marcos Ramos, incluyendo citas programadas para el día y piezas registradas en el odontograma para validar inmediatamente la visualización tanto en el frontend como en las rutas del servidor.

---

### 📌 Hito 6: Configuración del Proxy Vite para Desarrollo Integrado
* **Archivos clave:** [`vite.config.ts`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/vite.config.ts), [`package.json`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/package.json)
* **💡 Comentario Pedagógico:**
  * **Desacoplamiento Local con Proxy:** Vite corre por defecto en el puerto `3000` y Wrangler emula el backend en el puerto `8787`. Al incorporar la regla de proxy:
    ```ts
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      }
    }
    ```
    El cliente en el navegador realiza peticiones relativas a `/api/...` sin disparar problemas de CORS ni requerir URLs absolutas diferentes entre el entorno de pruebas y el despliegue final.

---

## 🚀 3. Guía Pedagógica de Ejecución y Pruebas

Para revisar y probar el proyecto de forma completa, dispones de los siguientes comandos:

| Comando | Propósito | Explicación |
| :--- | :--- | :--- |
| `npm run dev` | Servidor Frontend (Vite) | Inicia la interfaz web en `http://localhost:3000` con Hot Module Replacement (HMR). |
| `npm run dev:server` | Servidor Backend (Wrangler/Hono) | Emula el Cloudflare Worker en `http://127.0.0.1:8787` con la base de datos D1 local. |
| `npm run db:migrate:local` | Migración de Tablas D1 | Aplica la estructura del esquema de base de datos en el entorno local. |
| `npm run db:seed:local` | Carga de Datos Clínicos | Inserta pacientes, citas del día y estados del odontograma para pruebas. |
| `npm run lint` | Validación TypeScript | Verifica que no existan errores de tipos en ningún archivo del código. |
| `npm run build` | Compilación de Producción | Genera el bundle final optimizado en la carpeta `dist/`. |

---

## 🔭 4. Estado Actual del Proyecto y Próximos Pasos

* **Estado de Código:** **100% libre de errores de compilación** (`tsc --noEmit` y `vite build` aprobados exitosamente).
* **Estado de Base de Datos:** Migración y Semillas ejecutadas con éxito en D1 local.
* **Próximos pasos recomendados:**
  1. Lanzar las pruebas visuales del Frontend para verificar navegación, el selector de sedes y el odontograma interactivo.
  2. Verificar los endpoints en vivo de Hono (`/api/dashboard/pulse`, `/api/citas`, `/api/pacientes/:id/odontograma`).
  3. Integrar la calculadora de divisas con actualización de tasa BCV en el módulo de facturación y recibos digitales.
