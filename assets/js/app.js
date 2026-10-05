import { sb, configOk } from './supabase.js';
import { cargarPerfil } from './auth.js';
import { esc } from './format.js';
import { renderLogin } from './login.js';
import { renderShell, marcarActivo, esAdmin, estadoConexion, MENU } from './shell.js';
import { limpiarCache } from './datos.js';
import { dashboard } from './modulos/dashboard.js';
import { cotizaciones } from './modulos/cotizaciones.js';
import { clientes, vehiculos } from './modulos/padron.js';
import * as O from './modulos/otros.js';

const RUTAS = {
  dashboard, cotizaciones, clientes, vehiculos,
  prospectos: O.prospectos, ordenes: O.ordenes, carga: O.carga, ingresos: O.ingresos, herramienta: O.herramienta,
  catalogo: O.catalogo, importacion: O.importacion, usuarios: O.usuarios, bitacora: O.bitacora
};
const SOLO_ADMIN = new Set(MENU.filter(m => m.admin && m.ruta).map(m => m.ruta));
const root = document.getElementById('app');
let sesion = null, contenido = null;

async function navegar() {
  if (!sesion || !contenido) return;
  const [rutaRaw, qs] = location.hash.replace(/^#\/?/, '').split('?');
  let ruta = rutaRaw || 'dashboard';
  if (!RUTAS[ruta]) ruta = 'dashboard';
  // Ocultar en el menú NO es seguridad; la protección real es RLS.
  if (SOLO_ADMIN.has(ruta) && !esAdmin(sesion.perfil)) ruta = 'dashboard';
  marcarActivo(ruta);
  window.scrollTo(0, 0);
  try { await RUTAS[ruta](contenido, new URLSearchParams(qs || '')); estadoConexion(true); }
  catch (err) {
    estadoConexion(!/fetch|network/i.test(err.message));
    contenido.innerHTML = `<div class="alerta error">Error al cargar el módulo: ${esc(err.message)}</div>`;
  }
}
function entrar(s) {
  sesion = s; limpiarCache();
  contenido = renderShell(root, sesion);
  if (!location.hash) location.hash = '#/dashboard';
  navegar();
}
async function iniciar() {
  if (!configOk) {
    root.innerHTML = `<main class="login-fondo"><div class="login-wrap"><div class="login-card"><h1>SpeedCenter</h1><p class="sub">Configuración pendiente</p>
      <div class="alerta error">Pega tu <b>SUPABASE_URL</b> y tu <b>SUPABASE_ANON_KEY</b> en <span class="mono">assets/js/config.js</span>.</div></div></div></main>`;
    return;
  }
  window.addEventListener('hashchange', navegar);
  sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && sesion) { sesion = null; renderLogin(root, entrar); } });
  try { const s = await cargarPerfil(); s ? entrar(s) : renderLogin(root, entrar); }
  catch (err) { renderLogin(root, entrar, err.message); }
}
iniciar();
