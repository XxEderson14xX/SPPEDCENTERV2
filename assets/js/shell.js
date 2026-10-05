import { esc, iniciales, pick } from './format.js';
import { ROLES, ROLES_ADMIN } from './config.js';
import { cerrarSesion } from './auth.js';

// Menú completo: los 13 módulos de V11.8 + Prospectos.
export const MENU = [
  { grupo: 'Operación' },
  { ruta: 'dashboard', txt: 'Inicio', ico: '▦' },
  { ruta: 'prospectos', txt: 'Prospectos', ico: '✉' },
  { ruta: 'cotizaciones', txt: 'Cotizaciones', ico: '$' },
  { ruta: 'ordenes', txt: 'Órdenes de trabajo', ico: '⚙' },
  { ruta: 'carga', txt: 'Carga de trabajo', ico: '≡' },
  { ruta: 'ingresos', txt: 'Ingresos', ico: '¤' },
  { ruta: 'herramienta', txt: 'Herramienta especial', ico: '⚒' },
  { grupo: 'Padrón' },
  { ruta: 'clientes', txt: 'Clientes', ico: '☺' },
  { ruta: 'vehiculos', txt: 'Vehículos e historial', ico: '◈' },
  { ruta: 'catalogo', txt: 'Catálogo de servicios', ico: '☰' },
  { grupo: 'Administración', admin: true },
  { ruta: 'importacion', txt: 'Importación masiva', ico: '⇪', admin: true },
  { ruta: 'usuarios', txt: 'Usuarios', ico: '⚿', admin: true },
  { ruta: 'bitacora', txt: 'Bitácora', ico: '⧗', admin: true }
];

export function esAdmin(perfil) {
  return ROLES_ADMIN.includes(String(perfil?.rol || '').toLowerCase());
}

export function renderShell(root, sesion) {
  const p = sesion.perfil;
  const nombre = pick(p, ['nombre_completo', 'nombre', 'username'], sesion.user.email);
  const rolTxt = ROLES[String(p.rol || '').toLowerCase()] || p.rol || '—';
  const admin = esAdmin(p);

  const items = MENU.filter(m => !m.admin || admin).map(m => m.grupo
    ? `<div class="nav-grupo">${esc(m.grupo)}</div>`
    : `<a href="#/${m.ruta}" data-ruta="${m.ruta}"><span class="ico" aria-hidden="true">${m.ico}</span>${esc(m.txt)}</a>`
  ).join('');

  root.innerHTML = `
  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <button class="marca" id="btn-home" aria-label="Ir al inicio"><img src="assets/img/logo-oscuro.svg" alt="SpeedCenter" /></button>
      <nav class="nav" aria-label="Navegación principal">${items}</nav>
      <div class="pie">SpeedCenter 2.0 · Fase 0 · GitHub Pages</div>
    </aside>
    <div class="principal">
      <header class="topbar">
        <button class="btn-menu" id="btn-menu" aria-label="Abrir menú">☰</button>
        <div></div>
        <div class="usuario">
          <div class="txt" style="text-align:right">
            <div class="nombre">${esc(nombre)}</div>
            <div class="rol">${esc(rolTxt)}</div>
          </div>
          <div class="avatar" aria-hidden="true">${esc(iniciales(nombre))}</div>
          <button class="btn secundario sm" id="btn-salir">Cerrar sesión</button>
        </div>
      </header>
      <main class="contenido" id="contenido"></main>
    </div>
  </div>`;

  root.querySelector('#btn-salir').addEventListener('click', cerrarSesion);
  root.querySelector('#btn-home').addEventListener('click', () => { location.hash = '#/dashboard'; });
  const sidebar = root.querySelector('#sidebar');
  root.querySelector('#btn-menu').addEventListener('click', () => sidebar.classList.toggle('abierto'));
  sidebar.addEventListener('click', (e) => { if (e.target.closest('a')) sidebar.classList.remove('abierto'); });

  return root.querySelector('#contenido');
}

export function marcarActivo(ruta) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('activo', a.dataset.ruta === ruta));
}
