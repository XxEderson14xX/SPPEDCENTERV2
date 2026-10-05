
import { sb, configOk } from './supabase.js';
import { cargarPerfil } from './auth.js';
import { esc } from './format.js';
import { renderLogin } from './login.js';
import { renderShell, marcarActivo, esAdmin, MENU } from './shell.js';
import * as P from './modulos/index.js';

const RUTAS = {
  dashboard: P.dashboard, prospectos: P.prospectos, cotizaciones: P.cotizaciones, ordenes: P.ordenes,
  carga: P.carga, ingresos: P.ingresos, herramienta: P.herramienta, clientes: P.clientes,
  vehiculos: P.vehiculos, catalogo: P.catalogo, importacion: P.importacion, usuarios: P.usuarios, bitacora: P.bitacora
};
const SOLO_ADMIN = new Set(MENU.filter(x => x.admin && x.ruta).map(x => x.ruta));

const root = document.getElementById('app');
let sesion = null;
let contenido = null;

async function navegar() {
  if (!sesion || !contenido) return;
  let ruta = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0];
  if (!RUTAS[ruta]) ruta = 'dashboard';
  // Ocultar en el menú NO es seguridad: la protección real es RLS en Supabase.
  if (SOLO_ADMIN.has(ruta) && !esAdmin(sesion.perfil)) ruta = 'dashboard';
  marcarActivo(ruta);
  try {
    await RUTAS[ruta](contenido);
  } catch (err) {
    contenido.innerHTML = `<div class="alerta error">Error al cargar el módulo: ${esc(err.message)}</div>`;
  }
}

function entrar(s) {
  sesion = s;
  contenido = renderShell(root, sesion);
  if (!location.hash) location.hash = '#/dashboard';
  navegar();
}

async function iniciar() {
  if (!configOk) {
    root.innerHTML = `<div class="login-fondo"><div class="login-card"><div class="alerta error">
      Falta poner tu <span class="mono">SUPABASE_URL</span> y <span class="mono">SUPABASE_ANON_KEY</span>
      en el archivo <span class="mono">assets/js/config.js</span>.</div></div></div>`;
    return;
  }
  window.addEventListener('hashchange', navegar);
  sb.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT' && sesion) { sesion = null; renderLogin(root, entrar); }
  });
  try {
    const s = await cargarPerfil();
    s ? entrar(s) : renderLogin(root, entrar);
  } catch (err) {
    renderLogin(root, entrar, err.message);
  }
}

iniciar();
