# SpeedCenter Precision Ops · Sistema de diseño (fuente única)

Interfaz para jornadas de 8 horas: neutros para descansar la vista, rojo de marca solo para acción y selección.

## Colores
| Token | Valor | Uso |
|---|---|---|
| `--brand` | #D32F2F | Botón principal, selección activa, franja superior de paneles |
| `--brand-hover` | #B71C1C | Hover del botón principal |
| `--sidebar` | #211E1E | Menú lateral y fondo de modales |
| `--sidebar-hover` | #2B2727 | Hover en el menú |
| `--canvas` | #F4F6F8 | Fondo de trabajo |
| `--card` | #FFFFFF | Paneles, tablas, inputs |
| `--border` | #E2E8F0 | Bordes |
| `--text` / `--muted` | #1E2833 / #64748B | Texto principal / secundario |

**Rojo de marca ≠ rojo de peligro.** El peligro usa #C0392B sobre #FDECEA.

## Badges (texto / fondo)
- Verde · Autorizada / Pagada: #16A34A / #E7F6EE
- Rojo · Rechazada / Cancelada: #C0392B / #FDECEA
- Naranja · Pendiente / Con saldo: #D98C00 / #FFF4E0
- Azul · Enviada / Diagnóstico: #1B6F7A / #E6F2F4
- Gris · Borrador / Sin iniciar: #64748B / #EEF1F4
- Morado · Paquete / Especial: #70459E / #F0E9F7

## Tipografía
- **Inter** para toda la interfaz (cuerpo 14px).
- **JetBrains Mono** obligatoria para VIN, folios (`COT-AAAA-NNNNNN`), `HER-…`, placas e importes. Números con `tabular-nums`.

## Layout
- Menú lateral fijo de 250px; contenido con padding 26px 32px.
- Por debajo de 860px el menú se vuelve cajón deslizable.
- KPIs en 4 columnas → 2 (≤1024px) → 1 (≤560px).

## Componentes
- **Panel:** blanco, radio 12px, borde #E2E8F0, franja superior roja de 3px.
- **Botones:** principal (rojo), secundario (blanco con borde), peligro (blanco con texto #C0392B), `.sm` compacto. Radio 8px.
- **Inputs:** borde #E2E8F0, foco con borde rojo y halo `rgba(211,47,47,.25)`.
- **Tablas:** cabecera pegajosa en mayúsculas 12px gris, hover #F8FAFC, estado vacío en cursiva.
- **Modales:** fondo `rgba(33,30,30,.6)` con blur, radio 12px, botón cerrar con `aria-label="Cerrar modal"`. Anchos: 420 / 560 / 740 / 860 / 960px.

## Reglas de contenido
- Nunca mostrar datos inventados, indicadores decorativos ni certificaciones que no existan.
- Todo texto de la base pasa por `esc()`.
- Importes: el total incluye IVA 16% y se desglosa.
