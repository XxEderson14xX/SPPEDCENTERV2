import { TABLAS, ROLES } from '../config.js';
import { esc, pick, dinero, fecha, badge, ms, iniciales } from '../format.js';
import { encabezado, kpi, errorTabla, enMigracion, paginar, fase2 } from '../ui.js';
import { leer, padron, pagoValido, importePago, idCot, clienteDeCot, nombreCli } from '../datos.js';

const POR_PAG = 15;
function tablaPaginada(zona, { columnas, filas, buscarEn, titulo, icono, chips }) {
  zona.innerHTML = `<section class="panel rojo">
    <div class="panel-cab"><h3>${ms(icono)} ${esc(titulo)} <span class="cnt">${filas.length}</span></h3></div>
    <div class="toolbar" style="padding-top:0"><div class="campo-bus">${ms('search')}<input type="search" placeholder="Buscar…" /></div></div>
    ${chips ? `<div class="chips">${chips.map((c, i) => `<button class="chip ${i ? '' : 'on'}" data-i="${i}">${esc(c.txt)}</button>`).join('')}</div>` : ''}
    <div class="tabla-scroll"><table class="tabla"><thead><tr>${columnas.map(c => `<th class="${c.der ? 'der' : ''}">${esc(c.label)}</th>`).join('')}</tr></thead><tbody></tbody></table></div><div class="pag"></div></section>`;
  const tb = zona.querySelector('tbody'), pg = zona.querySelector('.pag');
  let q = '', p = 1, ch = 0;
  const pintar = () => {
    let l = filas; if (chips) l = l.filter(chips[ch].f);
    if (q) l = l.filter(f => (buscarEn ? buscarEn(f) : JSON.stringify(f)).toLowerCase().includes(q));
    const P = paginar(l.length, p, POR_PAG); p = P.p;
    tb.innerHTML = l.slice((p - 1) * POR_PAG, p * POR_PAG).map(f => `<tr>${columnas.map(c => `<td class="${c.der ? 'der' : ''}">${c.html(f)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${columnas.length}" class="vacio">Sin registros.</td></tr>`;
    pg.innerHTML = P.html;
  };
  zona.querySelector('input').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); p = 1; pintar(); });
  pg.addEventListener('click', e => { const b = e.target.closest('button[data-pag]'); if (b && !b.disabled) { p = Number(b.dataset.pag); pintar(); } });
  zona.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => { ch = Number(b.dataset.i); p = 1; zona.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); pintar(); }));
  pintar();
}

// =============================== INGRESOS ===============================
export async function ingresos(el) {
  el.innerHTML = '<div class="cargando">Cargando ingresos…</div>';
  const P = await padron(true);
  if (P.err.pagos) { el.innerHTML = errorTabla(TABLAS.pagos, P.err.pagos); return; }
  const val = P.pagos.filter(pagoValido);
  const met = m => val.filter(p => String(pick(p, ['metodo', 'metodo_pago'], '')).toLowerCase().includes(m)).reduce((s, p) => s + importePago(p), 0);
  const hoy = new Date().toDateString(); const mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
  const totHoy = val.filter(p => new Date(p.created_at).toDateString() === hoy).reduce((s, p) => s + importePago(p), 0);
  const totMes = val.filter(p => new Date(p.created_at) >= mes).reduce((s, p) => s + importePago(p), 0);

  el.innerHTML = encabezado({ titulo: 'Ingresos', desc: 'Pagos registrados desde cotizaciones. Sin CFDI: los importes son cobranza, no facturación fiscal.' }) + `
  <div class="kpis">
    ${kpi({ etq: 'Cobrado hoy', ico: 'today', color: 'verde', val: dinero(totHoy), valColor: 'ok' })}
    ${kpi({ etq: 'Cobrado este mes', ico: 'calendar_month', color: 'azul', val: dinero(totMes) })}
    ${kpi({ etq: 'Efectivo (histórico)', ico: 'payments', val: dinero(met('efectivo')) })}
    ${kpi({ etq: 'Transferencia / tarjeta', ico: 'credit_card', color: 'morado', val: dinero(met('transfer') + met('tarjeta')) })}
  </div><div id="zona"></div>`;
  tablaPaginada(el.querySelector('#zona'), {
    titulo: 'Movimientos', icono: 'receipt_long', filas: P.pagos,
    chips: [{ txt: 'Todos', f: () => true }, { txt: 'Efectivo', f: p => /efectivo/i.test(pick(p, ['metodo', 'metodo_pago'], '')) }, { txt: 'Transferencia', f: p => /transfer/i.test(pick(p, ['metodo', 'metodo_pago'], '')) }, { txt: 'Tarjeta', f: p => /tarjeta/i.test(pick(p, ['metodo', 'metodo_pago'], '')) }, { txt: 'Cancelados', f: p => !pagoValido(p) }],
    columnas: [
      { label: 'Fecha y hora', html: p => `<span class="mono">${fecha(p.created_at, true)}</span>` },
      { label: 'Cotización', html: p => { const c = P.cot.get(idCot(p)); return c ? `<a class="folio" style="text-decoration:none" href="#/cotizaciones?id=${encodeURIComponent(c.id)}">${esc(c.folio || '—')}</a>` : '—'; } },
      { label: 'Cliente', html: p => { const c = P.cot.get(idCot(p)); const cl = c && clienteDeCot(P, c); return esc(cl ? nombreCli(cl) : '—'); } },
      { label: 'Método', html: p => esc(pick(p, ['metodo', 'metodo_pago'], '—')) },
      { label: 'Referencia', html: p => `<span class="mono">${esc(pick(p, ['referencia'], '—'))}</span>` },
      { label: 'Importe', der: true, html: p => `<span class="importe" style="color:${pagoValido(p) ? 'var(--ok)' : 'var(--soft)'}">${dinero(importePago(p))}</span>` },
      { label: 'Estado', html: p => badge(pagoValido(p) ? 'Válido' : (p.estado || 'Cancelado')) }
    ],
    buscarEn: p => { const c = P.cot.get(idCot(p)); return [p.metodo, p.metodo_pago, p.referencia, c?.folio].join(' '); }
  });
}

// =============================== USUARIOS ===============================
export async function usuarios(el) {
  el.innerHTML = '<div class="cargando">Cargando usuarios…</div>';
  const { data, error } = await leer(TABLAS.perfiles, { orden: null });
  if (error) { el.innerHTML = errorTabla(TABLAS.perfiles, error); return; }
  const U = data || []; const rolDe = u => String(u.rol || '').toLowerCase();
  el.innerHTML = encabezado({ eyebrow: 'Control de identidad y accesos', titulo: 'Usuarios y Accesos', desc: 'Roles oficiales: Administrador, Asesor de servicio, Técnico y Consulta.', acciones: fase2('Crear usuario', 'person_add', '') }) + `
  <div class="kpis">
    ${kpi({ etq: 'Usuarios', ico: 'group', color: 'rojo', val: U.length })}
    ${kpi({ etq: 'Activos', ico: 'verified_user', color: 'verde', val: U.filter(u => u.activo !== false).length, valColor: 'ok' })}
    ${kpi({ etq: 'Inactivos', ico: 'block', val: U.filter(u => u.activo === false).length })}
    ${kpi({ etq: 'Administradores', ico: 'admin_panel_settings', color: 'morado', val: U.filter(u => ['administrador', 'admin'].includes(rolDe(u))).length })}
  </div><div id="zona"></div>`;
  tablaPaginada(el.querySelector('#zona'), {
    titulo: 'Cuentas', icono: 'manage_accounts', filas: U,
    chips: [{ txt: 'Todos', f: () => true }, ...['administrador', 'asesor', 'tecnico', 'consulta'].map(r => ({ txt: ROLES[r], f: u => rolDe(u) === r || (r === 'administrador' && rolDe(u) === 'admin') }))],
    columnas: [
      { label: 'Usuario', html: u => `<div class="cliente-fila"><div class="avatar dark" style="width:32px;height:32px;font-size:12px">${esc(iniciales(pick(u, ['nombre_completo', 'nombre', 'username'])))}</div><div><div style="font-weight:600">${esc(pick(u, ['nombre_completo', 'nombre'], '—'))}</div><div class="sub mono">@${esc(pick(u, ['username', 'usuario'], '—'))}</div></div></div>` },
      { label: 'Rol', html: u => `<span class="badge ${['administrador', 'admin'].includes(rolDe(u)) ? 'morado' : 'azul'}">${esc(ROLES[rolDe(u)] || u.rol || '—')}</span>` },
      { label: 'Estado', html: u => badge(u.activo === false ? 'Inactivo' : 'Activo') },
      { label: 'Alta', html: u => fecha(u.created_at) }
    ],
    buscarEn: u => [u.username, u.nombre, u.nombre_completo, u.rol].join(' ')
  });
}

// =============================== BITÁCORA ===============================
export async function bitacora(el) {
  el.innerHTML = '<div class="cargando">Cargando bitácora…</div>';
  const { data, error } = await leer(TABLAS.bitacora, { limite: 3000 });
  if (error) { el.innerHTML = errorTabla(TABLAS.bitacora, error); return; }
  el.innerHTML = encabezado({ titulo: 'Bitácora del Sistema', desc: 'Acciones sensibles registradas. En Fase 1 se generará con triggers en la base (no desde el navegador).' }) + '<div id="zona"></div>';
  const det = b => { const d = pick(b, ['detalle', 'descripcion', 'datos'], ''); return typeof d === 'object' ? JSON.stringify(d) : String(d); };
  tablaPaginada(el.querySelector('#zona'), {
    titulo: 'Eventos', icono: 'history', filas: data || [],
    columnas: [
      { label: 'Fecha y hora', html: b => `<span class="mono">${fecha(b.created_at, true)}</span>` },
      { label: 'Tabla', html: b => `<span class="mono">${esc(pick(b, ['tabla'], '—'))}</span>` },
      { label: 'Acción', html: b => badge(pick(b, ['accion'], '—')) },
      { label: 'Usuario', html: b => `<span class="mono">${esc(pick(b, ['usuario', 'username', 'actor'], '—'))}</span>` },
      { label: 'Detalle', html: b => `<span style="font-size:13px">${esc(det(b).slice(0, 180))}${det(b).length > 180 ? '…' : ''}</span>` }
    ],
    buscarEn: b => JSON.stringify(b)
  });
}

// =============================== EN MIGRACIÓN ===============================
const pendiente = (n, d, ico) => async el => { el.innerHTML = encabezado({ titulo: n }) + enMigracion(n, d, ico); };
export const prospectos = pendiente('Prospectos', 'Detalle del prospecto de la landing, bitácora de contacto, asesor responsable y "Convertir a cliente y abrir cotización".', 'contact_mail');
export const ordenes = pendiente('Órdenes de Trabajo', 'Tablero por OT, técnico asignado, checklist de avance y piezas asignadas.', 'engineering');
export const carga = pendiente('Carga de Trabajo', 'Distribución operativa de órdenes. No genera rankings ni evaluaciones de personas.', 'view_kanban');
export const herramienta = pendiente('Herramienta Especial', 'Inventario, custodia e historial de préstamos (identificador HER-…).', 'handyman');
export const catalogo = pendiente('Catálogo de Servicios', 'Servicios, mano de obra, refacciones y combos con desglose de ahorro.', 'inventory_2');
export const importacion = pendiente('Importación Masiva', 'Carga CSV del catálogo con validación previa antes de guardar.', 'upload_file');
