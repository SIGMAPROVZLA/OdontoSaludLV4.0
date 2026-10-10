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

### 📌 Hito 7: Integración Oficial con Google Stitch (Diseño Dual Móvil & Escritorio)
* **Fecha:** 2026-10-10
* **Proyecto Stitch:** `Control Clinica OdontoSalud La Victoria` (`9982796618972867481`)
* **Archivos clave:**
  * [`src/hooks/useDeviceLayout.ts`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/hooks/useDeviceLayout.ts)
  * [`src/components/layout/DesktopSidebar.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/layout/DesktopSidebar.tsx)
  * [`src/components/layout/DesktopTopBar.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/layout/DesktopTopBar.tsx)
  * [`src/components/dashboard/DesktopDashboardView.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/dashboard/DesktopDashboardView.tsx)
* **💡 Comentario Pedagógico:**
  * **Consolidación sin Duplicación de Lógica:** Mediante la clave de API oficial de Stitch, se descargaron e inspeccionaron las 23 pantallas diseñadas para móvil y escritorio.
  * **Adaptive Component Switching:** En lugar de crear dos proyectos separados o duplicar el backend, se implementó el hook `useDeviceLayout()`. 
    * Si la pantalla es **Móvil (<1024px)**: La aplicación monta la barra inferior táctil (*Bottom Navigation*), odontograma vertical y cards compactas diseñadas para el pulgar.
    * Si la pantalla es **Escritorio o Tablet (≥1024px)**: La aplicación monta la **Barra Lateral Clínica Oscura (`#0F2B48`)**, la **TopBar Superior de Acciones Rápidas** (`+ Nuevo Paciente`, `+ Crear Presupuesto`, `+ Nueva Cita`) y el panel multi-columna de 12 rejillas (Agenda en vivo, Sala de espera con tiempos, Alertas de stock y tratamientos más solicitados).
  * **Cero Impacto Backend:** Ambas vistas consumen exactamente el mismo cliente `ApiClient` y la misma base de datos Cloudflare D1/KV.

---

### 📌 Hito 8: Consolidación Móvil de Google Stitch (Autoregistro & Triaje / Aprobación de Citas Previas)
* **Fecha:** 2026-10-10
* **Archivos clave:**
  * [`src/components/booking/BookingFlow.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/booking/BookingFlow.tsx) (Autoregistro y Reserva de Citas Móvil)
  * [`src/components/booking/AppointmentCoordinationView.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/booking/AppointmentCoordinationView.tsx) (Recepción & Triaje Digital - Citas Previas Web & Chat)
  * [`src/components/layout/BottomNavigation.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/layout/BottomNavigation.tsx) (Navegación inferior con badge dinámico de Triaje)
  * [`src/components/agenda/AgendaView.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/agenda/AgendaView.tsx) (Botón de agendamiento rápido y salto al Odontograma)
  * [`src/server/index.ts`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/server/index.ts) (Rutas de citas sincronizadas con D1)
* **💡 Comentario Pedagógico:**
  * **Inspección Visual con Google Stitch:** Se analizaron pixel a pixel las pantallas móviles exportadas de Google Stitch (`MOBILE_011782003fe0416cba6f61d617e9bf6e` y `MOBILE_5ffde8effccb47ebacb6a95559aacf61`).
  * **Autoregistro de Paciente (`BookingFlow.tsx`):**
    * **Selector de Odontólogo Activo:** Dra. María Domínguez (Titular • Box 1), Dr. Carlos Mendoza R. (Ortodoncia • Box 2) y Dra. Valentina Páez G. (Endodoncia • Box 3), con modal interactivo para cambiar de especialista.
    * **Malla de Tratamientos Táctiles:** Evaluación inicial con Rx digital, Limpieza con ultrasonido, Urgencias con badge animado prioritario, Ortodoncia, Endodoncia y Prótesis.
    * **Turnos en Vivo (Mañana / Tarde):** Carrusel de días interactivo con cupos disponibles y desglose horario asignando box clínico.
    * **Formulario con Validación Venezolana:** Prefijos de Cédula (`V-`, `E-`, `J-`, `P-`), validación de WhatsApp con badge *"Recibirá SMS"*, motivo de consulta y aviso legal amparado en la *Ley de Ejercicio de la Odontología en Venezuela*.
    * **Voucher Digital Clínico:** Emisión de código único de turno (`ODL-xxxx`), confirmación directa por WhatsApp y salto instantáneo a la pantalla de Triaje.
  * **Recepción & Triaje Digital (`AppointmentCoordinationView.tsx`):**
    * **Métricas 2x2:** *Por Confirmar (con urgencias)*, *Confirmadas Hoy (en sillón)*, *Reasignar casos* y *T. Respuesta promedio (~12 min)*.
    * **Filtros Temporales y de Categoría:** *Hoy*, *Esta semana*, *Pasadas*, *Todos*, *Por confirmar* y *Urgencias con dolor*.
    * **Aprobación Reactiva y en Lote:** Botón individual *"Aprobar Cita"* (conmuta estado a `confirmada` en Cloudflare D1) y barra flotante inferior sticky con *"Aprobar (N)"* y botón `+` para ingresar pacientes en recepción.
    * **WhatsApp Automatizado con Contexto Clínico:** Mensaje preconfigurado al WhatsApp del paciente indicando hora, motivo, sede y solicitud de confirmación de asistencia.
  * **Jerarquización y Navegación Móvil:**
    * Se integró la pestaña **"Triaje"** en la barra inferior móvil (`BottomNavigation`) con contador visual numérico de citas pendientes.
    * El Dashboard principal incorpora un banner de llamada a la acción hacia el Triaje Digital para que la recepción nunca pierda una solicitud entrante.

---

### 📌 Hito 9: Rediseño de Cabecera Clínica, Botón Flotante y Selector de Pacientes Registrados en Ficha
* **Fecha:** 2026-10-10
* **Archivos clave:**
  * [`src/components/layout/ClinicalHeader.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/layout/ClinicalHeader.tsx) (Cabecera minimalista: logo + título + selector simple de sedes + campanita + VictorIA Pro)
  * [`src/components/dashboard/DashboardView.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/dashboard/DashboardView.tsx) (Botón flotante inferior para agendar cita)
  * [`src/components/odontogram/OdontogramView.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/odontogram/OdontogramView.tsx) (Directorio emergente de pacientes registrados + botón flotante de agendamiento)
  * [`src/components/booking/VictoriaAssistantModal.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/booking/VictoriaAssistantModal.tsx) (Activación por evento personalizado desde el icono de cabecera)
* **💡 Comentario Pedagógico:**
  * **Cabecera Simplificada y Despejada:**
    * **Izquierda:** Emblema dental de OdontoSalud con indicador de guardia activa, Título principal (`OdontoSalud La Victoria`) y selector simple de sucursal (`La Victoria ⇄ Colonia Tovar`) como subtítulo limpio.
    * **Derecha:** Campanita de notificaciones (con acceso a Citas Previas / Triaje) e icono de acceso directo a **VictorIA Pro**.
    * Se eliminó el botón de agendar de la barra superior para concentrar la ergonomía táctil en el pulgar (zona inferior).
  * **Botón Flotante Ergonómico de Agendamiento:**
    * Ubicado de forma flotante (`fixed bottom-20 right-4`) exclusivamente en las vistas de **Inicio** ([`DashboardView`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/dashboard/DashboardView.tsx)) y de **Ficha Clínica** ([`OdontogramView`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/odontogram/OdontogramView.tsx)), facilitando la reserva rápida con una sola mano.
  * **Directorio de Pacientes Registrados en Ficha:**
    * Se creó una ventana modal/drawer con búsqueda en vivo por nombre, cédula o teléfono y filtros rápidos (*Todos*, *En Sillón*, *Con Alergias*).
    * Al seleccionar un paciente (ej. Patricia Velásquez, Carlos Mendoza, Marcos Ramos, Elena Blanco, Roberto Gil, Sofía Rivas), el odontograma anatómico, las alertas médicas, la radiografía periapical RVG y la nota de evolución clínica se recalculan y actualizan en caliente.

---

### 📌 Hito 10: Sincronización en Línea de la Tasa Oficial BCV y Centro de Notificaciones en la Campanita
* **Fecha:** 2026-10-10
* **Archivos clave:**
  * [`src/server/index.ts`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/server/index.ts) (Servicio resiliente multi-capa y endpoints `GET` / `POST` `/api/tasas/bcv`)
  * [`src/types/clinical.ts`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/types/clinical.ts) (Tipos `TasaCambioInfo` y `NotificacionItem`)
  * [`src/services/api.ts`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/services/api.ts) (Métodos de cliente para consultar, fijar y resetear tasa)
  * [`src/context/TasaCambioContext.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/context/TasaCambioContext.tsx) (Proveedor global de tasa de cambio y cola reactiva de avisos)
  * [`src/components/layout/NotificationCenterModal.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/layout/NotificationCenterModal.tsx) (Modal emergente con tasa en vivo, control manual y triaje)
  * [`src/components/layout/ClinicalHeader.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/layout/ClinicalHeader.tsx) (Campanita interactiva con badge animado)
  * [`src/components/billing/BillingView.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/billing/BillingView.tsx) (Caja y presupuestos con cálculo en vivo en Bolívares)
  * [`src/components/layout/DesktopTopBar.tsx`](file:///c:/Users/maria/OneDrive/Documentos/OdontoSaludLV%204.0/src/components/layout/DesktopTopBar.tsx) (Soporte de campanita en escritorio)
* **💡 Comentario Pedagógico:**
  * **La Realidad Técnica del BCV y la Solución Implementada:**
    * El Banco Central de Venezuela no ofrece una API JSON pública oficial. Su portal emite tablas HTML con certificados SSL y bloqueos de red intermitentes.
    * Para evitar caídas en el punto de cobro de la clínica, se construyó una **Arquitectura Resiliente en 4 Capas**:
      1. **Capa 1 (En línea):** Consulta a servicio especializado de alta disponibilidad (`https://ve.dolarapi.com/v1/dolares/oficial`) con timeout estricto de 3.5 segundos.
      2. **Capa 2 (Persistencia Local D1):** Cada tasa obtenida se guarda inmediatamente en la tabla SQLite D1 `configuraciones_tasas` con su fecha valor y fuente.
      3. **Capa 3 (Fallback Automático):** Si la conexión exterior falla o hay corte de internet, el sistema carga de forma transparente la última tasa almacenada en base de datos.
      4. **Capa 4 (Control Humano / Override Manual en Caja):** La administradora puede pulsar "Ajustar Manualmente" en cualquier momento para fijar una tasa especial de jornada o restablecer al modo automático con un solo clic.
  * **Notificación en la Campanita:**
    * La campanita de la cabecera móvil y de la barra de escritorio detecta de forma reactiva las actualizaciones de tasa y las solicitudes de citas de triaje web.
    * Muestra un indicador rojo pulsante (`animate-pulse`) cuando hay novedades pendientes de lectura.
    * Al tocar la campanita, se abre el **Centro de Notificaciones y Avisos**, mostrando el valor oficial en Bs/USD, la vigencia, el botón de actualización en caliente y accesos directos al triaje.
  * **Conciliación Financiera en Caja (`BillingView.tsx`):**
    * Los presupuestos, abonos parciales y pagos en moneda nacional (Pago Móvil y Punto de Venta) calculan de forma instantánea el contravalor exacto en Bolívares usando la tasa vigente.

---

## 🔭 4. Estado Actual del Proyecto y Próximos Pasos

* **Estado de Código:** **100% libre de errores de compilación** (`tsc --noEmit` aprobado exitosamente con código 0).
* **Estado de Base de Datos:** Base relacional Cloudflare D1 emulada localmente y probada de extremo a extremo, incluyendo tabla persistente `configuraciones_tasas`.
* **Estado de Interfaz:** Cabecera con selector multisede, botones flotantes táctiles, selector de pacientes, tasa BCV en tiempo real y centro de notificaciones operativo.
* **Próximos pasos recomendados:**
  1. Integración de las pantallas panorámicas de escritorio para la recepción y odontograma de sillón.
  2. Implementación de los webhooks de WhatsApp Cloud API para auto-confirmar citas recibidas por mensajería.


