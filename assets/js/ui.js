import { esc } from './format.js';

export function encabezado(titulo, subtitulo = '', acciones = '') {
  return `<header class="encabezado"><div><h1>${esc(titulo)}</h1>${subtitulo ? `<p>${esc(subtitulo)}</p>` : ''}</div><div>${acciones}</div></header>`;
}

export function enMigracion(nombre, detalle) {
  return `<section class="panel"><div class="migracion">
    <h3>${esc(nombre)} · en migración</h3>
    <p>${esc(detalle)}</p>
    <p style="margin-top:10px">Mientras tanto sigue usando este módulo en la V11.8. No se mueve ningún dato.</p>
  </div></section>`;
}

export function errorTabla(tabla, error) {
  const noExiste = error?.code === '42P01' || /does not exist|not find/i.test(error?.message || '');
  const txt = noExiste
    ? `No se encontró la tabla "${tabla}". Corrige el nombre en src/config/tablas.js.`
    : `No se pudo leer "${tabla}": ${error?.message || 'error desconocido'}. Si es un tema de permisos, es RLS haciendo su trabajo.`;
  return `<div class="alerta warn">${esc(txt)}</div>`;
}

// Tabla de solo lectura con buscador local.
// columnas: [{ label, html: (fila) => string (ya escapado), der?: bool }]
export function montarTabla(contenedor, { titulo, columnas, filas, buscarEn }) {
  contenedor.innerHTML = `
  <section class="panel">
    <div class="panel-cab">
      <h3>${esc(titulo)} <span class="muted num" style="font-weight:500">(${filas.length})</span></h3>
      <input class="input buscador" type="search" placeholder="Buscar…" aria-label="Buscar" />
    </div>
    <div class="tabla-scroll"><table class="tabla">
      <thead><tr>${columnas.map(c => `<th class="${c.der ? 'der' : ''}">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody></tbody>
    </table></div>
  </section>`;
  const tbody = contenedor.querySelector('tbody');
  const pintar = (lista) => {
    tbody.innerHTML = lista.length
      ? lista.map(f => `<tr>${columnas.map(c => `<td class="${c.der ? 'der' : ''}">${c.html(f)}</td>`).join('')}</tr>`).join('')
      : `<tr><td class="vacio" colspan="${columnas.length}">Sin registros.</td></tr>`;
  };
  pintar(filas);
  contenedor.querySelector('input').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return pintar(filas);
    pintar(filas.filter(f => (buscarEn ? buscarEn(f) : JSON.stringify(f)).toLowerCase().includes(q)));
  });
}
