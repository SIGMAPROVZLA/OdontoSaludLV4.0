# Marco de Orquestación para OdontoSalud La Victoria: Diseño Fluido, Planificación y Desarrollo

Este documento rige la conducta de los agentes de IA que operan en este proyecto. Define la armonía entre habilidades para evitar solapamientos, degradación de contexto y contradicciones de estilo o código.

---

## 1. Esquema de Diseño Fluido (Fluid UI/UX Architecture)

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
│ • Tailwind CSS + React + Lucide Icons                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Esquema de Planificación y Desarrollo (Planning & Development Architecture)

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
3. **Evidencia antes de declarar victoria:** Ninguna funcionalidad se marca como terminada sin verificar logs de servidor (`task-1020` Vite, `task-1022` Wrangler) o pruebas unitarias (`verification-before-completion`).
4. **Revisión de Seguridad obligatoria:** Todo cambio en endpoints de API o sincronización de base de datos debe ser auditado con los criterios de `coderabbit-review` (OWASP, validación de inputs, resiliencia).
