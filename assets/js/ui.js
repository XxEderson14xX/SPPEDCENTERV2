import { esc, ms } from './format.js';

export function encabezado({ eyebrow = '', titulo, desc = '', extra = '', acciones = '' }) {
  return `<header class="encabezado"><div>
    ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
    <h1>${esc(titulo)}</h1>${desc ? `<p class="desc">${esc(desc)}</p>` : ''}${extra}
  </div><div class="acciones">${acciones}</div></header>`;
}
// kpi({ etq, ico, color, val, unidad, pieIzq, pieDer, valColor })
export function kpi(k) {
  return `<div class="kpi"><div class="top"><div class="etq">${esc(k.etq)}</div><div class="ico-box ${k.color || ''}">${ms(k.ico)}</div></div>
    <div class="val" ${k.valColor ? `style="color:var(--${k.valColor})"` : ''}>${k.val}${k.unidad ? `<small>${esc(k.unidad)}</small>` : ''}</div>
    <div class="pie"><span class="mono">${k.pieIzq || ''}</span>${k.pieDer || ''}</div></div>`;
}
export function enMigracion(nombre, detalle, ico = 'construction') {
  return `<section class="panel rojo"><div class="migracion"><div class="ico-box rojo">${ms(ico, 's24')}</div>
    <h3>${esc(nombre)} · en migración</h3><p>${esc(detalle)}</p>
    <p class="soft" style="font-size:13px">Mientras tanto sigue usando este módulo en la V11.8. No se mueve ningún dato.</p></div></section>`;
}
export function errorTabla(tabla, error) {
  const noExiste = error?.code === '42P01' || /does not exist|could not find|schema cache/i.test(error?.message || '');
  return `<div class="alerta warn">${esc(noExiste
    ? `No se encontró la tabla "${tabla}". Corrige el nombre en assets/js/config.js (TABLAS).`
    : `No se pudo leer "${tabla}": ${error?.message || 'error'}. Si es de permisos, es RLS protegiendo los datos.`)}</div>`;
}
export const fase2 = (txt, ico, cls = 'sec') => `<button class="btn ${cls} off" disabled title="Disponible en Fase 2 · hoy se hace en la V11.8">${ms(ico, 's18')} ${esc(txt)}</button>`;
export function paginar(total, pag, porPag) {
  const n = Math.max(1, Math.ceil(total / porPag)); const p = Math.min(pag, n);
  const ini = total ? (p - 1) * porPag + 1 : 0, fin = Math.min(p * porPag, total);
  let nums = []; for (let i = Math.max(1, p - 2); i <= Math.min(n, p + 2); i++) nums.push(i);
  return { p, n, html: `<div class="paginacion"><span>Mostrando ${ini}–${fin} de ${total}</span><div class="pags">
    <button data-pag="${p - 1}" ${p <= 1 ? 'disabled' : ''}>Anterior</button>
    ${nums.map(i => `<button data-pag="${i}" class="${i === p ? 'on' : ''}">${i}</button>`).join('')}
    <button data-pag="${p + 1}" ${p >= n ? 'disabled' : ''}>Siguiente</button></div></div>` };
}
