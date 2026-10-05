import { sb } from '../supabase.js';
import { TABLAS, ROLES } from '../config.js';
import { esc, pick, dinero, fecha, badge, desglosarIVA } from '../format.js';
import { encabezado, enMigracion, errorTabla, montarTabla } from '../ui.js';
import { leer, relacionados, indexar } from '../datos.js';
import { maestroDetalle } from './maestro.js';

const m = v => `<span class="mono">${esc(v || '—')}</span>`;
const dato = (k, v) => `<div class="dato"><div class="k">${esc(k)}</div><div class="v">${v}</div></div>`;
const est = c => String(pick(c, ['estado_comercial', 'estado'], '')).toLowerCase();
const nombreCli = c => pick(c, ['nombre_completo', 'nombre'], '—');
const placa = v => pick(v, ['placa', 'placas'], '—');
const auto = v => v ? `${pick(v, ['marca'])} ${pick(v, ['modelo'])} ${pick(v, ['anio', 'año', 'ano'])}`.trim() : '—';
const idCli = r => pick(r, ['cliente_id', 'id_cliente'], null);
const idVeh = r => pick(r, ['vehiculo_id', 'id_vehiculo'], null);

// Carga base compartida (clientes + vehículos) para cruzar nombres.
async function padron() {
  const [c, v] = await Promise.all([leer(TABLAS.clientes, { limite: 2000 }), leer(TABLAS.vehiculos, { limite: 2000 })]);
  return { cli: indexar(c.data), veh: indexar(v.data), errC: c.error, errV: v.error, clientes: c.data || [], vehiculos: v.data || [] };
}

// ======================= INICIO =======================
export async function dashboard(el) {
  el.innerHTML = encabezado('Vista general del taller', 'Datos reales de tu Supabase') + '<div class="cargando">Cargando…</div>';
  const [cot, pag] = await Promise.all([leer(TABLAS.cotizaciones, { limite: 1000 }), leer(TABLAS.pagos, { limite: 1000 })]);
  const { cli, veh } = await padron();
  if (cot.error) { el.innerHTML = encabezado('Vista general del taller') + errorTabla(TABLAS.cotizaciones, cot.error); return; }

  const cots = cot.data || [];
  const abiertas = cots.filter(c => !['cerrada', 'cancelada', 'rechazada'].includes(est(c)));
  const pendientes = cots.filter(c => est(c).includes('pendiente'));
  const conSaldo = cots.filter(c => Number(pick(c, ['saldo', 'saldo_pendiente'], 0)) > 0);
  const hoy = new Date().toDateString();
  const pagosHoy = (pag.data || []).filter(p => new Date(p.created_at).toDateString() === hoy && String(p.estado || 'valido').toLowerCase() !== 'cancelado');
  const ingresoHoy = pagosHoy.reduce((s, p) => s + Number(pick(p, ['importe', 'monto'], 0)), 0);

  el.innerHTML = encabezado('Vista general del taller', 'Datos reales de tu Supabase', '<a class="btn secundario" href="#/cotizaciones">Ver cotizaciones</a>') + `
  <div class="kpis">
    <div class="kpi"><div class="etq">Cotizaciones abiertas</div><div class="val">${abiertas.length}</div></div>
    <div class="kpi"><div class="etq">Pendientes de autorización</div><div class="val" style="color:var(--warn)">${pendientes.length}</div></div>
    <div class="kpi"><div class="etq">Con saldo pendiente</div><div class="val" style="color:var(--danger)">${conSaldo.length}</div></div>
    <div class="kpi"><div class="etq">Cobrado hoy</div><div class="val" style="color:var(--ok)">${dinero(ingresoHoy)}</div></div>
  </div>
  <section class="panel"><div class="panel-cab"><h3>Actividad reciente</h3></div>
  <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Folio</th><th>Cliente</th><th>Vehículo</th><th class="der">Total</th><th class="der">Saldo</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>
  ${cots.slice(0, 10).map(c => { const v = veh.get(idVeh(c)); const cl = cli.get(idCli(c)) || cli.get(idCli(v)); return `<tr>
    <td>${m(pick(c, ['folio']))}</td><td>${esc(cl ? nombreCli(cl) : '—')}</td><td>${esc(auto(v))} ${v ? m(placa(v)) : ''}</td>
    <td class="der mono">${dinero(pick(c, ['total'], null))}</td><td class="der mono">${dinero(pick(c, ['saldo', 'saldo_pendiente'], null))}</td>
    <td>${badge(pick(c, ['estado_comercial', 'estado']))}</td><td>${fecha(c.created_at)}</td></tr>`; }).join('') || '<tr><td colspan="7" class="vacio">Sin cotizaciones.</td></tr>'}
  </tbody></table></div></section>`;
}

// ======================= COTIZACIONES =======================
export async function cotizaciones(el) {
  el.innerHTML = encabezado('Cotizaciones', 'Solo lectura · crear, autorizar y cobrar sigue en la V11.8');
  const [r, base] = await Promise.all([leer(TABLAS.cotizaciones), padron()]);
  if (r.error) { el.insertAdjacentHTML('beforeend', errorTabla(TABLAS.cotizaciones, r.error)); return; }
  const { cli, veh } = base;
  const filas = r.data || [];
  const cliDe = c => cli.get(idCli(c)) || cli.get(idCli(veh.get(idVeh(c))));

  maestroDetalle(el, {
    titulo: 'Cotizaciones', filas,
    chips: [
      { txt: 'Todas', filtro: () => true },
      { txt: 'Borrador', filtro: c => est(c) === 'borrador' },
      { txt: 'Pendientes', filtro: c => est(c).includes('pendiente') },
      { txt: 'Autorizadas', filtro: c => est(c) === 'autorizada' },
      { txt: 'Con saldo', filtro: c => Number(pick(c, ['saldo', 'saldo_pendiente'], 0)) > 0 }
    ],
    buscarEn: c => { const v = veh.get(idVeh(c)); const cl = cliDe(c); return [c.folio, cl && nombreCli(cl), v && placa(v), v && v.vin, v && auto(v)].join(' '); },
    item: c => { const v = veh.get(idVeh(c)); const cl = cliDe(c); return `
      <div class="l1"><span class="mono" style="color:var(--brand)">${esc(pick(c, ['folio'], '—'))}</span><span class="mono">${dinero(pick(c, ['total'], null))}</span></div>
      <div class="l2"><span>${esc(cl ? nombreCli(cl) : '—')} · ${esc(auto(v))}</span>${badge(pick(c, ['estado_comercial', 'estado']))}</div>`; },
    detalle: async c => {
      const v = veh.get(idVeh(c)); const cl = cliDe(c);
      const conceptos = await relacionados(TABLAS.detalle, ['cotizacion_id', 'id_cotizacion'], c.id, { orden: null });
      const pagos = await relacionados(TABLAS.pagos, ['cotizacion_id', 'id_cotizacion'], c.id);
      const total = Number(pick(c, ['total'], 0));
      const { subtotal, iva } = desglosarIVA(total);
      const abonado = pagos.filter(p => String(p.estado || 'valido').toLowerCase() !== 'cancelado').reduce((s, p) => s + Number(pick(p, ['importe', 'monto'], 0)), 0);
      const anticipo = Math.round(total * 50) / 100;
      return `
      <div class="det-cab">
        <div>${m(pick(c, ['folio']))} ${badge(pick(c, ['estado_comercial', 'estado']))}</div>
        <h2>${esc(cl ? nombreCli(cl) : 'Cliente no encontrado')}</h2>
        <div class="muted">Creada ${fecha(c.created_at, true)}</div>
      </div>
      <div class="det-sec"><h4>Vehículo</h4><div class="grid2">
        ${dato('Unidad', esc(auto(v)))}${dato('Placa', m(v && placa(v)))}
        ${dato('VIN / NIV', m(v && pick(v, ['vin', 'niv'])))}${dato('Teléfono', m(cl && pick(cl, ['telefono'])))}
      </div></div>
      <div class="det-sec"><h4>Conceptos (${conceptos.length})</h4>
        ${conceptos.map(d => `<div class="concepto"><div><div style="font-weight:600">${esc(pick(d, ['descripcion', 'nombre', 'concepto'], '—'))}</div>
          <div class="muted" style="font-size:12px">${esc(pick(d, ['tipo', 'categoria'], ''))} ${pick(d, ['cantidad'], '') !== '' ? '· Cant. ' + esc(pick(d, ['cantidad'])) : ''}</div></div>
          <div class="mono">${dinero(pick(d, ['importe', 'total', 'subtotal', 'precio'], null))}</div></div>`).join('') || '<div class="muted">Sin conceptos registrados.</div>'}
      </div>
      <div class="det-sec"><h4>Totales</h4><div class="totales">
        <div class="fila"><span>Subtotal</span><span>${dinero(subtotal)}</span></div>
        <div class="fila"><span>IVA 16%</span><span>${dinero(iva)}</span></div>
        <div class="fila grande"><span>Total</span><span>${dinero(total)}</span></div>
        <div class="fila" style="color:var(--ok)"><span>Abonado</span><span>${dinero(abonado)}</span></div>
        <div class="fila" style="color:var(--danger)"><span>Saldo</span><span>${dinero(Math.max(total - abonado, 0))}</span></div>
      </div>
      <div class="anticipo"><span>Anticipo requerido (50%)</span><span class="mono">${dinero(anticipo)} ${abonado >= anticipo && total > 0 ? '✓' : ''}</span></div></div>
      <div class="det-sec"><h4>Pagos (${pagos.length})</h4>
        ${pagos.map(p => `<div class="concepto"><div>${fecha(p.created_at, true)} · ${esc(pick(p, ['metodo', 'metodo_pago'], '—'))} ${m(pick(p, ['referencia'], ''))}</div><div class="mono">${dinero(pick(p, ['importe', 'monto'], null))}</div></div>`).join('') || '<div class="muted">Sin pagos.</div>'}
      </div>`;
    }
  });
}

// ======================= CLIENTES =======================
export async function clientes(el) {
  el.innerHTML = encabezado('Clientes', 'Directorio con vehículos y cotizaciones asociadas');
  const base = await padron();
  if (base.errC) { el.insertAdjacentHTML('beforeend', errorTabla(TABLAS.clientes, base.errC)); return; }
  maestroDetalle(el, {
    titulo: 'Clientes', filas: base.clientes,
    buscarEn: c => [c.nombre, c.nombre_completo, c.telefono, c.correo, c.email, c.rfc].join(' '),
    item: c => `<div class="l1"><span>${esc(nombreCli(c))}</span></div>
      <div class="l2"><span class="mono">${esc(pick(c, ['telefono'], '—'))}</span><span>${base.vehiculos.filter(v => idCli(v) === c.id).length} vehículo(s)</span></div>`,
    detalle: async c => {
      const autos = base.vehiculos.filter(v => idCli(v) === c.id);
      const cots = await relacionados(TABLAS.cotizaciones, ['cliente_id', 'id_cliente'], c.id);
      return `
      <div class="det-cab"><h2>${esc(nombreCli(c))}</h2><div class="muted">Cliente desde ${fecha(c.created_at)}</div></div>
      <div class="det-sec"><h4>Contacto</h4><div class="grid2">
        ${dato('Teléfono', m(pick(c, ['telefono'])))}${dato('Correo', esc(pick(c, ['correo', 'email'], '—')))}
        ${dato('RFC', m(pick(c, ['rfc'])))}${dato('Dirección', esc(pick(c, ['direccion'], '—')))}
      </div>${pick(c, ['observaciones'], '') ? `<div class="alerta warn" style="margin:12px 0 0">${esc(c.observaciones)}</div>` : ''}</div>
      <div class="det-sec"><h4>Vehículos (${autos.length})</h4>
        ${autos.map(v => `<div class="concepto"><div><strong>${esc(auto(v))}</strong><div class="muted mono" style="font-size:12px">VIN ${esc(pick(v, ['vin', 'niv'], '—'))}</div></div>${m(placa(v))}</div>`).join('') || '<div class="muted">Sin vehículos.</div>'}
      </div>
      <div class="det-sec"><h4>Cotizaciones (${cots.length})</h4>
        ${cots.map(q => `<div class="concepto"><div>${m(pick(q, ['folio']))} · ${fecha(q.created_at)}</div><div>${badge(pick(q, ['estado_comercial', 'estado']))} <span class="mono">${dinero(pick(q, ['total'], null))}</span></div></div>`).join('') || '<div class="muted">Sin cotizaciones directas.</div>'}
      </div>`;
    }
  });
}

// ======================= VEHÍCULOS =======================
export async function vehiculos(el) {
  el.innerHTML = encabezado('Vehículos e historial', 'Identidad permanente anclada al VIN · placas volátiles');
  const base = await padron();
  if (base.errV) { el.insertAdjacentHTML('beforeend', errorTabla(TABLAS.vehiculos, base.errV)); return; }
  maestroDetalle(el, {
    titulo: 'Padrón vehicular', filas: base.vehiculos,
    buscarEn: v => [placa(v), v.vin, v.niv, v.marca, v.modelo, base.cli.get(idCli(v)) && nombreCli(base.cli.get(idCli(v)))].join(' '),
    item: v => `<div class="l1"><span>${esc(auto(v))}</span>${m(placa(v))}</div>
      <div class="l2"><span class="mono">${esc(pick(v, ['vin', 'niv'], 'Sin VIN'))}</span><span>${esc(base.cli.get(idCli(v)) ? nombreCli(base.cli.get(idCli(v))) : '—')}</span></div>`,
    detalle: async v => {
      const cl = base.cli.get(idCli(v));
      const hist = await relacionados(TABLAS.cotizaciones, ['vehiculo_id', 'id_vehiculo'], v.id);
      const km = pick(v, ['kilometraje', 'km'], null);
      const vin = pick(v, ['vin', 'niv'], '');
      return `
      <div class="det-cab"><h2>${esc(auto(v))}</h2><div>${m(placa(v))} · <span class="muted">${esc(cl ? nombreCli(cl) : 'Sin propietario')}</span></div></div>
      <div class="det-sec"><h4>Identidad (VIN / NIV)</h4>
        <div class="vin">${esc(vin || 'Sin VIN registrado')}</div>
        ${vin && vin.length !== 17 ? '<div class="alerta warn" style="margin:10px 0 0">El VIN no tiene 17 caracteres. Revísalo.</div>' : ''}
      </div>
      <div class="det-sec"><h4>Datos</h4><div class="grid2">
        ${dato('Kilometraje', km === null ? '—' : `<span class="mono">${Number(km).toLocaleString('es-MX')} km</span>`)}
        ${dato('Color', esc(pick(v, ['color'], '—')))}${dato('Motor', esc(pick(v, ['motor'], '—')))}${dato('Versión', esc(pick(v, ['version'], '—')))}
      </div></div>
      <div class="det-sec"><h4>Historial (${hist.length})</h4>
        ${hist.length ? `<div class="linea-tiempo">${hist.map(q => `<div class="hito"><div>${m(pick(q, ['folio']))} ${badge(pick(q, ['estado_comercial', 'estado']))}</div>
          <div class="muted" style="font-size:12.5px">${fecha(q.created_at)} · <span class="mono">${dinero(pick(q, ['total'], null))}</span></div></div>`).join('')}</div>` : '<div class="muted">Sin servicios registrados.</div>'}
      </div>`;
    }
  });
}

// ======================= TABLAS SIMPLES =======================
function tabla(titulo, subtitulo, nombre, columnas, buscarEn, orden) {
  return async el => {
    el.innerHTML = encabezado(titulo, subtitulo) + '<div id="zona"><div class="cargando">Cargando…</div></div>';
    const zona = el.querySelector('#zona');
    const { data, error } = await leer(nombre, { orden });
    if (error) { zona.innerHTML = errorTabla(nombre, error); return; }
    montarTabla(zona, { titulo: 'Registros', columnas, filas: data || [], buscarEn });
  };
}

export const ingresos = tabla('Ingresos', 'Pagos registrados desde cotizaciones', TABLAS.pagos, [
  { label: 'Fecha', html: p => fecha(p.created_at, true) },
  { label: 'Método', html: p => esc(pick(p, ['metodo', 'metodo_pago'], '—')) },
  { label: 'Referencia', html: p => m(pick(p, ['referencia'])) },
  { label: 'Importe', der: true, html: p => `<strong class="mono">${dinero(pick(p, ['importe', 'monto'], null))}</strong>` },
  { label: 'Estado', html: p => badge(pick(p, ['estado'], 'válido')) }
], p => [p.metodo, p.metodo_pago, p.referencia].join(' '));

export const usuarios = tabla('Usuarios', 'Alta y contraseñas siguen en la V11.8', TABLAS.perfiles, [
  { label: 'Usuario', html: u => m(pick(u, ['username', 'usuario'])) },
  { label: 'Nombre', html: u => esc(pick(u, ['nombre_completo', 'nombre'], '—')) },
  { label: 'Rol', html: u => esc(ROLES[String(u.rol || '').toLowerCase()] || u.rol || '—') },
  { label: 'Estado', html: u => badge(u.activo === false ? 'Inactivo' : 'Activo') }
], u => [u.username, u.nombre, u.nombre_completo, u.rol].join(' '), null);

export const bitacora = tabla('Bitácora', 'Acciones sensibles registradas', TABLAS.bitacora, [
  { label: 'Fecha', html: b => fecha(b.created_at, true) },
  { label: 'Tabla', html: b => m(pick(b, ['tabla'])) },
  { label: 'Acción', html: b => badge(pick(b, ['accion'])) },
  { label: 'Detalle', html: b => { const d = pick(b, ['detalle', 'descripcion'], ''); return esc(typeof d === 'object' ? JSON.stringify(d) : d); } }
], b => JSON.stringify(b));

// ======================= EN MIGRACIÓN =======================
const pendiente = (n, d) => async el => { el.innerHTML = encabezado(n) + enMigracion(n, d); };
export const prospectos = pendiente('Prospectos', 'Detalle del prospecto, bitácora de contacto y "Convertir a cliente y abrir cotización".');
export const ordenes = pendiente('Órdenes de trabajo', 'Técnico asignado, checklist de avance y piezas asignadas.');
export const carga = pendiente('Carga de trabajo', 'Distribución operativa de órdenes. Sin rankings ni evaluaciones de personas.');
export const herramienta = pendiente('Herramienta especial', 'Inventario, custodia e historial de préstamos.');
export const catalogo = pendiente('Catálogo de servicios', 'Servicios, mano de obra, refacciones y combos.');
export const importacion = pendiente('Importación masiva', 'Carga CSV con validación previa.');
