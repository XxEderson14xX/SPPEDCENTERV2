import { esc, iniciales, pick, ms } from './format.js';
import { ROLES, ROLES_ADMIN } from './config.js';
import { cerrarSesion } from './auth.js';
import { padron, nombreCli, placaDe, vinDe, autoDe, clienteDeCot } from './datos.js';

export const MENU = [
  { grupo: 'Operaciones taller' },
  { ruta: 'dashboard', txt: 'Dashboard', ico: 'dashboard' },
  { ruta: 'prospectos', txt: 'Prospectos', ico: 'contact_mail' },
  { ruta: 'cotizaciones', txt: 'Cotizaciones', ico: 'request_quote' },
  { ruta: 'ordenes', txt: 'Órdenes de Trabajo', ico: 'engineering' },
  { ruta: 'carga', txt: 'Carga de Trabajo', ico: 'view_kanban' },
  { ruta: 'clientes', txt: 'Clientes', ico: 'group' },
  { ruta: 'vehiculos', txt: 'Vehículos', ico: 'directions_car' },
  { ruta: 'herramienta', txt: 'Herramienta Especial', ico: 'handyman' },
  { ruta: 'ingresos', txt: 'Ingresos', ico: 'payments' },
  { ruta: 'catalogo', txt: 'Catálogo de Servicios', ico: 'inventory_2' },
  { grupo: 'Administración', admin: true },
  { ruta: 'importacion', txt: 'Importación Masiva', ico: 'upload_file', admin: true },
  { ruta: 'usuarios', txt: 'Usuarios y Accesos', ico: 'manage_accounts', admin: true },
  { ruta: 'bitacora', txt: 'Bitácora', ico: 'history', admin: true }
];
export const esAdmin = p => ROLES_ADMIN.includes(String(p?.rol || '').toLowerCase());

export function renderShell(root, sesion) {
  const p = sesion.perfil;
  const nombre = pick(p, ['nombre_completo', 'nombre', 'username'], sesion.user.email);
  const rol = ROLES[String(p.rol || '').toLowerCase()] || p.rol || '—';
  const admin = esAdmin(p);
  const nav = MENU.filter(m => !m.admin || admin).map(m => m.grupo
    ? `<div class="nav-grupo">${esc(m.grupo)}</div>`
    : `<a href="#/${m.ruta}" data-ruta="${m.ruta}">${ms(m.ico)}<span>${esc(m.txt)}</span></a>`).join('');

  root.innerHTML = `
  <aside class="sidebar" id="sidebar">
    <button class="sb-marca" id="btn-home" aria-label="Ir al Dashboard"><img src="assets/img/logo-oscuro.svg" alt="SpeedCenter" /></button>
    <nav class="nav" aria-label="Navegación principal">${nav}</nav>
    <div class="sb-estado" id="sb-estado"><div><div class="t1">Supabase</div><div class="t2">CONECTADO</div></div>${ms('cloud_done')}</div>
  </aside>
  <div class="principal">
    <header class="topbar">
      <button class="btn-menu btn-icono" id="btn-menu" aria-label="Abrir menú">${ms('menu')}</button>
      <div class="busqueda">${ms('search')}
        <input id="bus-global" type="search" placeholder="Búsqueda universal: VIN, placas, folio o cliente…" autocomplete="off" aria-label="Búsqueda universal" />
        <div class="resultados oculto" id="bus-res"></div>
      </div>
      <span class="pill-estado">Sesión activa · ${esc(rol)}</span>
      <div class="usuario">
        <div class="txt"><div class="nom">${esc(nombre)}</div><div class="rol">${esc(rol)}</div></div>
        <div class="avatar on" aria-hidden="true">${esc(iniciales(nombre))}</div>
        <button class="btn-icono" id="btn-salir" title="Cerrar sesión" aria-label="Cerrar sesión">${ms('logout')}</button>
      </div>
    </header>
    <main class="contenido" id="contenido"></main>
  </div>`;

  root.querySelector('#btn-salir').addEventListener('click', cerrarSesion);
  root.querySelector('#btn-home').addEventListener('click', () => { location.hash = '#/dashboard'; });
  const sidebar = root.querySelector('#sidebar');
  root.querySelector('#btn-menu').addEventListener('click', () => sidebar.classList.toggle('abierto'));
  sidebar.addEventListener('click', e => { if (e.target.closest('a')) sidebar.classList.remove('abierto'); });
  montarBusqueda(root);
  return root.querySelector('#contenido');
}

function montarBusqueda(root) {
  const inp = root.querySelector('#bus-global'), res = root.querySelector('#bus-res');
  let t;
  const cerrar = () => res.classList.add('oculto');
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const q = inp.value.trim().toLowerCase();
      if (q.length < 2) return cerrar();
      const P = await padron();
      const h = (...v) => v.join(' ').toLowerCase().includes(q);
      const cots = P.cotizaciones.filter(c => { const cl = clienteDeCot(P, c); return h(c.folio, cl && nombreCli(cl)); }).slice(0, 5);
      const vehs = P.vehiculos.filter(v => h(placaDe(v), vinDe(v), autoDe(v))).slice(0, 5);
      const clis = P.clientes.filter(c => h(nombreCli(c), c.telefono, c.correo, c.email, c.rfc)).slice(0, 5);
      const fila = (href, ico, t1, t2) => `<a href="${href}">${ms(ico, 's18')}<div><div>${t1}</div><div class="r2">${t2}</div></div></a>`;
      res.innerHTML = (cots.length ? '<div class="grp">Cotizaciones</div>' + cots.map(c => fila(`#/cotizaciones?id=${encodeURIComponent(c.id)}`, 'request_quote', `<span class="folio">${esc(c.folio || '—')}</span>`, esc(nombreCli(clienteDeCot(P, c))))).join('') : '')
        + (vehs.length ? '<div class="grp">Vehículos</div>' + vehs.map(v => fila(`#/vehiculos?id=${encodeURIComponent(v.id)}`, 'directions_car', esc(autoDe(v)), `<span class="mono">${esc(placaDe(v))} · ${esc(vinDe(v) || 'sin VIN')}</span>`)).join('') : '')
        + (clis.length ? '<div class="grp">Clientes</div>' + clis.map(c => fila(`#/clientes?id=${encodeURIComponent(c.id)}`, 'person', esc(nombreCli(c)), `<span class="mono">${esc(c.telefono || '')}</span>`)).join('') : '')
        || '<div class="vacio">Sin coincidencias.</div>';
      res.classList.remove('oculto');
    }, 200);
  });
  res.addEventListener('click', e => { if (e.target.closest('a')) { cerrar(); inp.value = ''; } });
  document.addEventListener('click', e => { if (!e.target.closest('.busqueda')) cerrar(); });
  inp.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrar(); inp.blur(); } });
}

export function marcarActivo(ruta) {
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('activo', a.dataset.ruta === ruta));
}
export function estadoConexion(ok) {
  const el = document.getElementById('sb-estado'); if (!el) return;
  el.classList.toggle('off', !ok); el.querySelector('.t2').textContent = ok ? 'CONECTADO' : 'SIN CONEXIÓN';
}
