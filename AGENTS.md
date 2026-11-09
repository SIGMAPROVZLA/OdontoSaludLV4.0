# AGENTS.MD - REGLAS DE GOBERNANZA TÉCNICA, ARQUITECTURA Y MOTION DESIGN
# PROYECTO: OdontoSaludLV 4.0 — Plataforma Integral de Gestión y Salud Odontológica
# ORGANIZACIÓN: Venezolana de Proyectos SIGMA C.A. / OdontoSalud La Victoria
# ESTÁNDAR: Edge Zero-Server (100% Cloudflare Native), Cinemática en Cliente & Memoria Continua

Este documento rige la gobernanza técnica y la conducta de los agentes de IA que operan en este proyecto. Define la armonía entre habilidades para evitar solapamientos, degradación de contexto y contradicciones de estilo o código.

---

## 1. DIRECTRICES DE ARQUITECTURA (EDGE ZERO-SERVER — 100% CLOUDFLARE NATIVE)
La infraestructura se ejecuta de extremo a extremo sobre el borde global de Cloudflare, sin servidores externos, sin contenedores ni bases de datos de terceros (Cero Supabase / Cero Docker):

- **Runtime de API y Lógica de Negocio:** Cloudflare Workers con framework **Hono** en TypeScript estricto (`strict: true`). Presupuesto CPU `< 10 ms` por petición.
- **Persistencia Primaria Relacional:** **Cloudflare D1** (SQLite distribuido en el Edge).
  - Consultas estrictamente parametrizadas con `env.DB.prepare().bind()`. Prohibida la concatenación de strings en SQL.
  - Uso de transacciones por lotes (`env.DB.batch([...])`) para registrar simultáneamente el presupuesto, citas programadas y cambios en el odontograma.
  - Restricciones ácidas `UNIQUE` para citas y expedientes, previniendo doble agenda, duplicados de pacientes o colisiones en citas concurrentes.
  - Saneamiento y normalización estricta de identidades venezolanas (cédulas V-, E-, J-, G- y fechas de nacimiento formato ISO `YYYY-MM-DD`).
- **Caché Rápida, Sesiones y Rate Limiting:** **Cloudflare KV**.
  - Sesiones activas de odontólogos y asistentes con TTL configurable.
  - Limitador de tasa (`rate_limit:ip_or_user`) para repeler fuerza bruta en inicio de sesión.
  - Almacén de configuración de tema y paleta activa por clínica o usuario.
- **Almacenamiento Multimedia Clínico (Radiografías e Imágenes Intraorales):** **Cloudflare R2**.
  - **Prohibido retener binarios pesados en RAM** (límite Worker 128 MB). Las radiografías panorámicas, periapicales y fotos se transmiten por flujo (`ReadableStream` directo desde la subida hacia `env.R2.put()`).
  - Compresión obligatoria en el cliente con Canvas/JPEG a ~100-250 KB antes del envío para optimizar ancho de banda.
  - Visualización segura mediante Worker con cabeceras de caché o Presigned URLs firmadas con Web Crypto nativo (`crypto.subtle`).
- **Alojamiento Frontend:** **Cloudflare Pages / Vite** (React + Vite + Tailwind CSS + Lucide Icons / Material Symbols).
- **Cero GPS Complejo:** No aplica geolocalización satelital avanzada, filtros de Kalman ni PostGIS. La gestión territorial se limita a las sedes físicas de la clínica registradas en D1 (Sede La Victoria y Sede Colonia Tovar).

---

## 2. ESQUEMA DE DISEÑO FLUIDO (FLUID UI/UX ARCHITECTURE — 4 CAPAS)
Para garantizar interfaces atractivas, modernas, accesibles y fluidas sin mezclar paradigmas contradictorios, los agentes deben estructurar el diseño en 4 capas estrictas:

```
┌─────────────────────────────────────────────────────────────┐
│ CAPA 4: CINÉTICA Y RESPUESTA (micro-interactions-animations)│
│ • Resorte háptico visual (scale-95 al pulsar, spring)       │
│ • Retroalimentación táctil <16ms                            │
│ • Aceleración por GPU (exclusivamente transform y opacity) │
│ • Respeto a prefers-reduced-motion                          │
├─────────────────────────────────────────────────────────────┤
│ CAPA 3: ESTÉTICA DE SUPERFICIE (Regla de Exclusión Mutua)   │
│   [Opción A - Elegida para OdontoSalud]:                     │
│   • glassmorphism-transparency: Vidrio esmerilado,          │
│     backdrop-filter: blur(), borde especular 1px alfa,      │
│     orbes de luz ambiental, contraste WCAG AA >= 4.5:1.     │
│   [Opción B - Solo en formularios clínicos densos]:         │
│   • google-material-design: M3 superficies tonales sólidas  │
│     y contenedores semánticos (surface-container).          │
│   * NUNCA mezclar estética A y B en la misma tarjeta o vista.│
├─────────────────────────────────────────────────────────────┤
│ CAPA 2: ESTRUCTURA Y JERARQUÍA (awesome-design)             │
│ • Grilla rítmica de 8pt (p-2, p-4, p-6, gap-4)              │
│ • Regla 60-30-10 para balance de color                      │
│ • Escalas tipográficas responsivas con clamp()              │
│ • Pirámide de jerarquía: 1 solo foco de acción por pantalla │
├─────────────────────────────────────────────────────────────┤
│ CAPA 1: MOTOR DE CÓDIGO (ui-styling)                        │
│ • Tailwind CSS + React + Lucide Icons / Material Symbols    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. DASHBOARD SUPERADMIN Y SEGUIMIENTO DE SALUD DE LA ARQUITECTURA
El panel central de SuperAdmin y Control Financiero incorpora:

1. **Métricas de Salud Operativa Edge en Vivo:**
   - Monitoreo del consumo de lectura/escritura en Cloudflare D1.
   - Estado de cuotas de almacenamiento R2 y solicitudes KV en tiempo real.
   - Latencia Anycast en el borde basal contra SLA `< 50 ms`.
2. **Selector Dinámico de Paletas del Catálogo Corporativo:**
   - La paleta de color de la interfaz no está fija en código: es **100% elegible en vivo** desde el panel de configuración del SuperAdmin.
   - Se alimenta del Catálogo Maestro Corporativo (Paleta #13 Deep Teal, Paleta #12 Trust Navy, Paleta #14 Founder Purple, Paleta #15 Enterprise Navy, etc.).
   - La selección inyecta reactivamente las variables CSS nativas (`--color-bg`, `--color-surface`, `--color-primary`, `--color-border`, `--color-text`) en el elemento `:root` del DOM y persiste la preferencia del usuario/clínica en Cloudflare KV y D1.
3. **Control Financiero Multisede y Cierres Diarios:**
   - Soporte de conmutación y consolidación de sedes (La Victoria, Colonia Tovar y Ambas Sedes).
   - Conversión bimonetaria instantánea (USD / Bs) alimentada por la tasa oficial BCV viva.
   - Arqueo y registro inmutable de cierres diarios de caja en la tabla D1 `cierres_diarios`.
4. **Auditoría de Acciones y Seguridad:**
   - Registro inmutable de los últimos cambios de configuración, creación de usuarios, roles de acceso y modificaciones de presupuestos.

---

## 4. COMPONENTES DE MOTION GRAPHICS, CINEMÁTICA Y VIDEO EN CLIENTE
Toda animación y procesamiento multimedia se ejecuta en el navegador del cliente (Licencia MIT / Apache 2.0, cero costos de cómputo en la nube):

- **Transiciones Fluidas Automáticas (`@formkit/auto-animate` / CSS Transitions):**
  - Aplicación obligatoria en listas de pacientes, historial de evoluciones clínicas, tablas de citas del día y desglose de presupuestos.
- **Micro-Interacciones Táctiles y Física de Resortes 60 FPS (`motion` / CSS springs):**
  - Dinámica interactiva sobre el **Odontograma Vectorial SVG** (reacción táctil al marcar caries, resinas, coronas, endodoncias, exodoncias, prótesis e implantes).
  - Micro-animaciones aceleradas por hardware (`transform`, `opacity`), respetando estrictamente `prefers-reduced-motion`.
- **Feedback Positivo y Logros Clínicos (`canvas-confetti`):**
  - Animación de confeti al completar planes de tratamiento integrales o liquidar presupuestos médicos.
- **Variantes de Componentes Estandarizadas (`cva` - Class Variance Authority):**
  - Gestión limpia de estados clínicos en botones, modales y badges (*Tratamiento Pendiente*, *En Curso*, *Alta Médica*, *Liquidado*).
- **Generación de Resúmenes y Video Clínico en Cliente (`mp4-muxer` + WebCodecs):**
  - Exportación de videos MP4 de evolución dental (comparativas antes/después del tratamiento) generados 100% en el navegador sin depender de APIs de renderizado de pago ni servidores externos.
- **Identidad Determinista sin Almacenamiento (`blobatar` / SVG Identicons):**
  - Generación de identicones vectoriales SVG en tiempo real para pacientes y odontólogos a partir de su cédula o correo, ahorrando llamadas de almacenamiento a R2.

---

## 5. ESQUEMA DE PLANIFICACIÓN Y DESARROLLO (PLANNING & DEVELOPMENT ARCHITECTURE)
Los agentes deben evitar saltar directamente al código en tareas de mediano o alto impacto. Se aplica un ciclo ordenado por fases de desarrollo basado en especificaciones:

```
    [ FASE 1: ARQUITECTURA ]
           │  • Modo Architect (roo-modes)
           │  • Discusión y Clarificación (gsd-discuss-phase / brainstorming)
           ▼
    [ FASE 2: PLANIFICACIÓN ATÓMICA ]
           │  • Especificación formal (gsd-plan-phase / writing-plans)
           │  • Generación de prd.json o PLAN.md
           ▼
    [ FASE 3: EJECUCIÓN CONTINUA CON BACKPRESSURE ]
           │  • Modo Code (roo-modes)
           │  • Bucle iterativo con tests (ralph-loop / test-driven-development)
           │  • Commits atómicos por tarea
           ▼
    [ FASE 4: AUDITORÍA Y VERIFICACIÓN RIGUROSA ]
           │  • Auditoría estricta de seguridad y lógica (coderabbit-review)
           │  • Verificación con evidencia (verification-before-completion)
           ▼
    [ FASE 5: RESOLUCIÓN DE BUGS (Si ocurren fallos) ]
              • Diagnóstico de causa raíz (systematic-debugging / gsd-debug)
              • Cero parches a ciegas
```

### Reglas de Convivencia entre Habilidades de Desarrollo:
1. **Un solo planificador activo:** Si se usa el flujo `gsd-core` (`gsd-plan-phase`), no se invoca en paralelo `writing-plans` para la misma tarea. Se mantiene una única fuente de verdad (`PLAN.md` o `prd.json`).
2. **Contexto Limpio (Anti-Rot):** En sesiones largas o tareas multi-fase, apoyarse en `ralph-loop` o `gsd-execute-phase` para ejecutar en bloques atómicos sin arrastrar residuos en la ventana de contexto.
3. **Evidencia antes de declarar victoria:** Ninguna funcionalidad se marca como terminada sin verificar logs de servidor (`task-1020` Vite, `task-1022` Wrangler) o pruebas de compilación/unitarias (`verification-before-completion`).
4. **Revisión de Seguridad obligatoria:** Todo cambio en endpoints de API o sincronización de base de datos debe ser auditado con los criterios de `coderabbit-review` (OWASP, validación de inputs, resiliencia).
5. **Gobernanza de Git Push (Ahorro de Tokens y Estabilidad):** Prohibido ejecutar `git push` en cada micro-iteración o cambio menor. El `git push` se reserva exclusivamente para:
   - Cerrar una jornada de trabajo completa (fin de sesión).
   - Consolidar un gran hito arquitectónico o funcional verificado al 100%.
   - En las fases intermedias se opera en local; el agente evaluará y recomendará el momento idóneo del push sin forzarlo en cada turno.

---

## 6. PROTOCOLO OBLIGATORIO DE SKILLS Y MEMORIA CONTINUA
1. **Memoria Continua y Contexto (`claude-mem` / `mem-search`):**
   - Consultar decisiones previas mediante `mem-search` al iniciar cualquier sesión de desarrollo o refactorización.
   - Mantener el control de versiones y decisiones en `LOGS_TAREAS_IMPLEMENTADAS.md` y `CONTROL_PROYECTO.md`.
2. **Ingeniería Pragmática (`ponytail`):**
   - Filosofía `ponytail` por defecto: Código conciso, estructurado y sin dependencias superfluas. Si una Web API nativa o función TypeScript pura lo resuelve, no instalar paquetes adicionales.
3. **Diseño y Estándares de Accesibilidad (`ui-ux-pro-max` & `ui-styling`):**
   - Garantizar contraste óptimo y ergonomía visual para ambientes de consultorio médico (WCAG 2.1 AA >= 4.5:1).
4. **Calidad y Verificación (`tdd` / `coderabbit-review`):**
   - Pruebas unitarias y de tipos (`npx tsc --noEmit`) obligatorias para la lógica financiera (presupuestos, cobros, honorarios, cierres) y la máquina de estados del odontograma antes de cada confirmación.

---

## 7. REGLAS DE NEGOCIO ODONTOLÓGICO Y BLINDAJE LEGAL
1. **Odontograma Vectorial Interactivo (FDI):**
   - 100% SVG nativo, interactivo y reactivo.
   - Numeración dental internacional de dos dígitos (adultos 11-48, niños 51-85) con sub-superficies independientes (oclusal, vestibular, lingual/palatina, mesial, distal y radicular) y procedimientos generales (Endodoncia, Exodoncia, Prótesis, Implante, Corona).
2. **Inmutabilidad de la Historia Médica y Sellado Forense:**
   - Prohibido sobrescribir notas clínicas o diagnósticos pasados. Toda corrección se añade como nota complementaria firmada con fecha, hora y doctor tratante.
   - Sellado hash **SHA-256** en el cliente de radiografías e imágenes antes de transmitirlas a Cloudflare R2/D1, integrando metadatos de fecha UTC y doctor tratante para respaldo legal.
3. **Seguridad Perimetral (`jose`):**
   - Tokens JWT para autenticación de doctores y personal clínico validados mediante Web Crypto nativo en el borde de Cloudflare.
4. **Prevención de Doble Cobro:**
   - Control estricto anti-duplicados por número de referencia bancaria en pagos electrónicos (Pago Móvil, Punto de Venta, Transferencia).
