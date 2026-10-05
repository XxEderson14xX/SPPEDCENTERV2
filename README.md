# SpeedCenter 2.0

Sistema del taller hecho **solo con GitHub Pages + Supabase**.
No usa Node, npm, Vite, Vercel ni GitHub Actions: son archivos estáticos que subes tal cual.

> **Fase 0:** login, diseño nuevo y consulta de datos reales (solo lectura).
> Crear, autorizar, cobrar y dar de alta usuarios **sigue en la V11.8**. Ambas usan el mismo Supabase.

## 1. Configurar (un solo archivo)
Abre `assets/js/config.js` y pon tu URL y tu anon key de Supabase
(Supabase → Project Settings → API). Son los mismos de la V11.8.
Nunca pongas la `service_role` key.

## 2. Subir a GitHub
1. GitHub → **New repository** → nombre `speedcenter-2` → Create.
2. **Add file → Upload files** → arrastra **todo el contenido** de esta carpeta
   (index.html, `.nojekyll`, `assets`, `supabase`, etc.) → Commit.
3. **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save.**
4. Al minuto queda en `https://TU_USUARIO.github.io/speedcenter-2/`

`.nojekyll` es un archivo vacío que evita que GitHub procese los archivos. Si Windows no lo deja ver, créalo en GitHub con **Add file → Create new file** llamado `.nojekyll`.

> Repo **privado** con Pages requiere GitHub Pro. Con cuenta gratis debe ser público; tus datos siguen protegidos por RLS en Supabase.

## 3. Supabase (SQL Editor, en orden)
| Archivo | Qué hace |
|---|---|
| `supabase/00_diagnostico.sql` | Solo lee: tablas, columnas, políticas, buckets |
| `supabase/01_login_por_usuario.sql` | Permite entrar con usuario además de correo |
| `supabase/02_perfiles_solo_activos.sql` | Quita el `using(true)` de perfiles (trae rollback) |

Después: **Authentication → URL Configuration** → agrega la URL de GitHub Pages en *Redirect URLs*.

Si un módulo dice *"No se encontró la tabla X"*, corrige el nombre en `TABLAS` dentro de `assets/js/config.js`.

## 4. Probar en tu PC (opcional)
Los módulos JS no abren con doble clic. En la carpeta:
`python -m http.server 8080` → abre `http://localhost:8080`

## 5. Estructura
```
index.html            .nojekyll           DESIGN.md
assets/css/styles.css sistema de diseño Precision Ops
assets/img/           logo-oscuro.svg · logo-claro.svg · favicon.svg
assets/js/config.js   ← URL, anon key, nombres de tablas, IVA
assets/js/app.js      arranque + rutas (#/clientes)
assets/js/            supabase · auth · login · shell · ui · datos · format
assets/js/modulos/    index.js (pantallas) · maestro.js (lista + ficha)
supabase/             00 · 01 · 02
```

## 6. Qué hay en esta versión
- **Inicio:** KPIs reales (abiertas, pendientes, con saldo, cobrado hoy) y actividad reciente.
- **Cotizaciones:** lista con filtros + ficha con conceptos, IVA desglosado, anticipo 50%, abonado, saldo y pagos.
- **Clientes:** ficha con contacto, vehículos y cotizaciones.
- **Vehículos:** ficha con VIN (avisa si no tiene 17 caracteres), datos e historial.
- **Ingresos, Usuarios, Bitácora:** tablas con buscador (Usuarios/Bitácora solo admin).
- **Prospectos, OT, Carga, Herramienta, Catálogo, Importación:** marcados "en migración", sin datos inventados.

Reglas: todo texto de la base pasa por `esc()`; el total incluye IVA y se desglosa; ocultar en el menú no es seguridad, RLS sí.
