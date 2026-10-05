// Clientes y Vehículos (diseño "Directorio de Clientes" y "Padrón Maestro de Vehículos" V12)
import { TABLAS } from '../config.js';
import { esc, pick, dinero, fecha, badge, ms, iniciales, waLink } from '../format.js';
import { encabezado, kpi, errorTabla, fase2 } from '../ui.js';
import { padron, estadoCot, saldoDe, tieneAdeudo, nombreCli, autoDe, placaDe, vinDe, idCli, idVeh } from '../datos.js';

const activa = c => !['cerrada', 'cancelada', 'rechazada'].includes(estadoCot(c));
const cotsDeVeh = (P, v) => P.cotizaciones.filter(c => String(idVeh(c)) === String(v.id));
const cotsDeCli = (P, cl) => P.cotizaciones.filter(c => String(idCli(c)) === String(cl.id) || P.vehiculos.some(v => String(idCli(v)) === String(cl.id) && String(idVeh(c)) === String(v.id)));
const autosDe = (P, cl) => P.vehiculos.filter(v => String(idCli(v)) === String(cl.id));
const km = v => { const k = pick(v, ['kilometraje', 'km'], ''); return k === '' ? '—' : Number(k).toLocaleString('es-MX') + ' km'; };
const total = c => Number(pick(c, ['total'], 0)) || 0;

function vinBloque(v) {
  const vin = vinDe(v);
  const ok = vin.length === 17 && !/[IOQ]/i.test(vin);
  return `<div class="kk" style="display:flex;justify-content:space-between;align-items:center">Identidad inmutable del vehículo (VIN / NIV)
    ${vin ? (ok ? '<span class="badge verde">17 caracteres</span>' : '<span class="badge naranja">Revisar VIN</span>') : '<span class="badge gris">Sin VIN</span>'}</div>
    <div class="vin-box"><span class="vin">${esc(vin || 'Sin VIN registrado')}</span>${vin ? `<button class="btn sec sm" data-copiar="${esc(vin)}">${ms('content_copy', 's16')} Copiar</button>` : ''}</div>
    ${vin && !ok ? '<div class="sub" style="margin-top:6px;color:var(--warn)">Un VIN válido tiene 17 caracteres y no usa I, O ni Q. Es aviso, no bloqueo.</div>' : ''}`;
}
function historial(P, cots, actual) {
  if (!cots.length) return '<div class="vacio">Sin servicios registrados para este VIN.</div>';
  return `<div class="timeline">${cots.map((c, i) => { const e = estadoCot(c); const col = activa(c) ? 'naranja' : e === 'cerrada' ? 'verde' : '';
    return `<div class="hito"><div class="pt ${col}">${cots.length - i}</div><div class="card ${i === 0 && activa(c) ? 'act' : ''}">
      <div class="r1"><span><a class="folio" href="#/cotizaciones?id=${encodeURIComponent(c.id)}" style="text-decoration:none">${esc(c.folio || '—')}</a> ${badge(pick(c, ['estado_comercial', 'estado']))}</span><span class="sub">${fecha(c.created_at)}</span></div>
      <div class="r1" style="margin-top:6px"><span class="sub">${tieneAdeudo(P, c) ? `Saldo ${dinero(saldoDe(P, c))}` : (activa(c) ? 'Aún sin cobro' : 'Sin adeudo')}</span><span class="importe">${dinero(total(c))} <small class="muted" style="font-size:11px">MXN</small></span></div>
    </div></div>`; }).join('')}</div>`;
}
function copiar(el) {
  el.querySelectorAll('[data-copiar]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copiar); b.innerHTML = `${ms('check', 's16')} Copiado`; } catch { /* sin permiso */ }
  }));
}
function lista(el, filas, itemHtml, onSel, selId) {
  const cont = el.querySelector('#lista');
  const pintar = l => { cont.innerHTML = l.map(f => `<div class="item ${String(f.id) === String(selId) ? 'sel' : ''}" data-id="${esc(f.id)}" tabindex="0">${itemHtml(f)}</div>`).join('') || '<div class="vacio">Sin registros.</div>'; };
  return { pintar, cont, set: id => { selId = id; } };
}

// =============================== CLIENTES ===============================
export async function clientes(el, params) {
  el.innerHTML = '<div class="cargando">Cargando clientes…</div>';
  const P = await padron(true);
  if (P.err.clientes) { el.innerHTML = errorTabla(TABLAS.clientes, P.err.clientes); return; }
  const C = P.clientes;
  const mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
  const nuevosMes = C.filter(c => c.created_at && new Date(c.created_at) >= mes).length;
  const enCiclo = new Set(P.cotizaciones.filter(activa).map(c => String(idVeh(c))));
  const conAdeudo = C.filter(cl => cotsDeCli(P, cl).some(c => tieneAdeudo(P, c)));
  const cerr = P.cotizaciones.filter(c => estadoCot(c) === 'cerrada');
  const ticket = cerr.length ? cerr.reduce((s, c) => s + total(c), 0) / cerr.length : 0;

  el.innerHTML = encabezado({
    eyebrow: 'Padrón maestro 2.0', titulo: 'Directorio de Clientes y Expediente Vehicular',
    desc: 'Historial permanente anclado al VIN / NIV (17 caracteres) e identidad única por ID de cliente.',
    acciones: fase2('Nuevo cliente / vehículo', 'person_add', '')
  }) + `
  <div class="kpis">
    ${kpi({ etq: 'Clientes registrados', ico: 'group', color: 'rojo', val: C.length, pieIzq: '', pieDer: `<span class="badge verde">+${nuevosMes} este mes</span>` })}
    ${kpi({ etq: 'Parque vehicular (VIN)', ico: 'directions_car', val: P.vehiculos.length, pieIzq: 'Unidades con historial permanente' })}
    ${kpi({ etq: 'Vehículos en ciclo activo', ico: 'car_repair', color: 'naranja', val: enCiclo.size, unidad: 'activos', pieIzq: 'Con cotización abierta' })}
    ${kpi({ etq: 'Ticket promedio (cerradas)', ico: 'sell', color: 'verde', val: dinero(ticket), unidad: 'MXN', pieIzq: `${conAdeudo.length} cliente(s) con adeudo` })}
  </div>
  <div class="grid-md cli">
    <section class="panel">
      <div class="toolbar"><div class="campo-bus">${ms('search')}<input id="q" type="search" placeholder="Buscar por nombre, teléfono, VIN o placa…" /></div></div>
      <div class="chips" id="chips"><button class="chip on" data-f="todos">Todos (${C.length})</button><button class="chip" data-f="ciclo">En ciclo activo</button><button class="chip" data-f="adeudo">Con adeudo (${conAdeudo.length})</button></div>
      <div class="lista" id="lista"></div>
    </section>
    <section class="panel rojo sticky" id="detalle"><div class="vacio">Selecciona un cliente.</div></section>
  </div>`;

  let sel = params.get('id') || C[0]?.id, q = '', f = 'todos';
  const L = lista(el, C, cl => {
    const autos = autosDe(P, cl); const v = autos[0]; const cs = cotsDeCli(P, cl); const ab = cs.find(activa); const deuda = cs.some(c => tieneAdeudo(P, c));
    return `<div class="l1"><span class="n">${esc(nombreCli(cl))}</span>${ab ? badge(pick(ab, ['estado_comercial', 'estado'])) : ''}</div>
      <div class="l2"><span class="mono">${ms('call', 's16')} ${esc(cl.telefono || '—')}</span><span>${ms('directions_car', 's16')} ${autos.length} vinculado(s)</span></div>
      ${v ? `<div class="mini-auto"><span>${esc(autoDe(v))} · <span class="mono">${esc(placaDe(v))}</span></span><span style="color:${deuda ? 'var(--danger)' : 'var(--ok)'}">${deuda ? 'Con adeudo' : 'Sin adeudos'}</span></div>` : ''}`;
  }, null, sel);
  const filtrar = () => {
    let l = C;
    if (f === 'ciclo') l = l.filter(cl => autosDe(P, cl).some(v => enCiclo.has(String(v.id))));
    if (f === 'adeudo') l = conAdeudo;
    if (q) l = l.filter(cl => [nombreCli(cl), cl.telefono, cl.correo, cl.email, cl.rfc, ...autosDe(P, cl).flatMap(v => [placaDe(v), vinDe(v), autoDe(v)])].join(' ').toLowerCase().includes(q));
    L.pintar(l);
  };
  const det = el.querySelector('#detalle');
  const abrir = id => {
    sel = id; L.set(id); filtrar();
    const cl = P.cli.get(id) || C.find(x => String(x.id) === String(id)); if (!cl) return;
    const autos = autosDe(P, cl); const wa = waLink(cl.telefono);
    const pintarAuto = vid => {
      const v = autos.find(a => String(a.id) === String(vid));
      det.querySelector('#auto-det').innerHTML = v ? `
        <div style="padding:16px 18px;border-top:1px solid var(--line)">${vinBloque(v)}
          <div class="specs">
            <div class="spec"><div class="kk">Placa actual</div><div class="v"><span class="placa">${esc(placaDe(v))}</span></div></div>
            <div class="spec"><div class="kk">Odómetro</div><div class="v mono">${km(v)}</div></div>
            <div class="spec"><div class="kk">Motor</div><div class="v">${esc(pick(v, ['motor'], '—'))}</div></div>
            <div class="spec"><div class="kk">Color</div><div class="v">${esc(pick(v, ['color'], '—'))}</div></div>
          </div></div>
        <div style="padding:4px 18px 18px"><div class="sec-tit">${ms('history', 's18')} Historial cronológico de servicios<span class="sub">${cotsDeVeh(P, v).length} evento(s) vinculados a este VIN</span></div>${historial(P, cotsDeVeh(P, v))}</div>` : '';
      det.querySelectorAll('.auto-card').forEach(b => b.classList.toggle('on', b.dataset.v === String(vid)));
      copiar(det);
    };
    det.innerHTML = `
      <div class="perfil"><div class="avatar dark lg">${esc(iniciales(nombreCli(cl)))}</div>
        <div class="grow"><h2>${esc(nombreCli(cl))}</h2><div class="uuid">ID ${esc(String(cl.id).slice(0, 18))}… <button class="btn-icono" style="padding:2px" data-copiar="${esc(cl.id)}" aria-label="Copiar ID">${ms('content_copy', 's16')}</button></div></div>
        <div class="acciones">${wa ? `<a class="btn sec sm" href="${wa}" target="_blank" rel="noopener" style="color:#15803D">${ms('chat', 's16')} WhatsApp</a>` : ''}</div></div>
      <div class="datos3">
        <div><div class="kk">Teléfono registrado</div><div class="v mono">${esc(cl.telefono || '—')}</div></div>
        <div><div class="kk">Correo</div><div class="v">${esc(cl.correo || cl.email || '—')}</div></div>
        <div><div class="kk">Facturación (RFC)</div><div class="v mono">${esc(cl.rfc || '—')}</div><div class="sub">${esc(cl.direccion || '')}</div></div>
      </div>
      ${cl.observaciones ? `<div style="padding:14px 18px 0"><div class="aviso">${ms('warning')}<div><b>Nota del cliente</b><div>${esc(cl.observaciones)}</div></div></div></div>` : ''}
      <div style="padding:16px 18px 12px"><div class="sec-tit" style="margin-top:0">${ms('directions_car', 's18')} Vehículos asociados (${autos.length})</div>
        <div class="autos">${autos.map(v => `<button class="auto-card" data-v="${esc(v.id)}">${ms('directions_car', 's24')}<div><div style="font-weight:700">${esc(autoDe(v))}</div><div class="sub mono">${esc(placaDe(v))} · VIN …${esc(vinDe(v).slice(-6) || '—')}</div></div></button>`).join('') || '<div class="vacio">Sin vehículos.</div>'}</div></div>
      <div id="auto-det"></div>`;
    det.querySelectorAll('.auto-card').forEach(b => b.addEventListener('click', () => pintarAuto(b.dataset.v)));
    copiar(det);
    if (autos[0]) pintarAuto(autos[0].id);
  };
  L.cont.addEventListener('click', e => { const it = e.target.closest('.item'); if (it) abrir(it.dataset.id); });
  el.querySelector('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); filtrar(); });
  el.querySelector('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; el.querySelectorAll('#chips .chip').forEach(x => x.classList.toggle('on', x === b)); filtrar(); });
  filtrar(); if (sel) abrir(sel);
}

// =============================== VEHÍCULOS ===============================
export async function vehiculos(el, params) {
  el.innerHTML = '<div class="cargando">Cargando padrón…</div>';
  const P = await padron(true);
  if (P.err.vehiculos) { el.innerHTML = errorTabla(TABLAS.vehiculos, P.err.vehiculos); return; }
  const V = P.vehiculos;
  const enCiclo = new Set(P.cotizaciones.filter(activa).map(c => String(idVeh(c))));
  const kms = V.map(v => Number(pick(v, ['kilometraje', 'km'], NaN))).filter(Number.isFinite);
  const prom = kms.length ? Math.round(kms.reduce((a, b) => a + b, 0) / kms.length) : 0;
  const recurrentes = V.filter(v => cotsDeVeh(P, v).filter(c => estadoCot(c) === 'cerrada').length >= 2).length;
  const sinVin = V.filter(v => vinDe(v).length !== 17).length;

  el.innerHTML = encabezado({
    eyebrow: 'Módulo · control de activos', titulo: 'Padrón Maestro de Vehículos',
    desc: 'Expediente técnico anclado al VIN / NIV (17 caracteres) e historial de placas volátiles.',
    acciones: fase2('Nuevo registro vehicular', 'add_circle', '')
  }) + `
  <div class="kpis">
    ${kpi({ etq: 'Total parque vehicular', ico: 'garage', color: 'rojo', val: V.length, unidad: 'unidades', pieIzq: `${P.clientes.length} propietarios` })}
    ${kpi({ etq: 'Activos en ciclo hoy', ico: 'car_repair', color: 'naranja', val: enCiclo.size, unidad: 'en servicio', valColor: 'warn', pieIzq: 'Con cotización abierta' })}
    ${kpi({ etq: 'Kilometraje promedio', ico: 'speed', color: 'azul', val: prom.toLocaleString('es-MX'), unidad: 'km', pieIzq: `${kms.length} con odómetro` })}
    ${kpi({ etq: 'Recurrencia', ico: 'loyalty', color: 'verde', val: recurrentes, unidad: '≥2 servicios', valColor: 'ok', pieIzq: '', pieDer: sinVin ? `<span class="badge naranja">${sinVin} VIN por revisar</span>` : '<span class="badge verde">VIN completos</span>' })}
  </div>
  <div class="grid-md cli">
    <section class="panel rojo">
      <div class="panel-cab"><h3>Directorio vehicular <span class="cnt">${V.length} reg.</span></h3></div>
      <div class="toolbar" style="padding-top:0"><div class="campo-bus">${ms('search')}<input id="q" type="search" placeholder="Buscar por VIN (17), placas, cliente…" /></div></div>
      <div class="chips" id="chips"><button class="chip on" data-f="todos">Todos (${V.length})</button><button class="chip" data-f="ciclo">En ciclo (${enCiclo.size})</button><button class="chip naranja" data-f="vin">VIN por revisar (${sinVin})</button></div>
      <div class="lista" id="lista"></div>
    </section>
    <section class="panel rojo sticky" id="detalle"><div class="vacio">Selecciona un vehículo.</div></section>
  </div>`;

  let sel = params.get('id') || V[0]?.id, q = '', f = 'todos';
  const L = lista(el, V, v => {
    const cl = P.cli.get(idCli(v)); const ab = cotsDeVeh(P, v).find(activa);
    return `<div class="l1"><span class="n">${esc(autoDe(v))}</span>${ab ? badge(pick(ab, ['estado_comercial', 'estado'])) : ''}</div>
      <div class="l2"><span><span class="placa clara">${esc(placaDe(v))}</span> <span class="mono">${esc(vinDe(v) || 'Sin VIN')}</span></span></div>
      <div class="l2"><span>${ms('person', 's16')} ${esc(cl ? nombreCli(cl) : '—')}</span><span class="mono">${km(v)}</span></div>`;
  }, null, sel);
  const filtrar = () => {
    let l = V;
    if (f === 'ciclo') l = l.filter(v => enCiclo.has(String(v.id)));
    if (f === 'vin') l = l.filter(v => vinDe(v).length !== 17);
    if (q) l = l.filter(v => [placaDe(v), vinDe(v), autoDe(v), P.cli.get(idCli(v)) && nombreCli(P.cli.get(idCli(v)))].join(' ').toLowerCase().includes(q));
    L.pintar(l);
  };
  const det = el.querySelector('#detalle');
  const abrir = id => {
    sel = id; L.set(id); filtrar();
    const v = P.veh.get(id) || V.find(x => String(x.id) === String(id)); if (!v) return;
    const cl = P.cli.get(idCli(v)); const cs = cotsDeVeh(P, v); const ab = cs.find(activa);
    const facturado = cs.filter(c => estadoCot(c) === 'cerrada').reduce((s, c) => s + total(c), 0);
    det.innerHTML = `
      <div class="perfil"><div class="ico-box rojo" style="width:52px;height:52px">${ms('directions_car', 's24')}</div>
        <div class="grow"><h2>${esc(autoDe(v))}</h2><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap"><span class="placa">${esc(placaDe(v))}</span>${ab ? badge(pick(ab, ['estado_comercial', 'estado'])) : '<span class="badge gris">Sin servicio activo</span>'}</div>
        <div class="sub" style="margin-top:6px">${esc([pick(v, ['version'], ''), pick(v, ['color'], '')].filter(Boolean).join(' · '))}</div></div></div>
      <div style="padding:0 18px 16px">${vinBloque(v)}</div>
      <div class="grid-2-1" style="padding:0 18px;gap:12px;grid-template-columns:1fr 1fr">
        <div class="caja" style="margin:0"><div class="kk">Placa actual</div><div style="margin-top:6px"><span class="placa">${esc(placaDe(v))}</span></div><div class="sub" style="margin-top:6px">El historial de placas anteriores se agregará en Fase 2 (placa única solo entre activas).</div></div>
        <div class="caja" style="margin:0"><div class="kk">Propietario asociado</div>${cl ? `<div class="cliente-fila" style="margin-top:8px"><div class="avatar dark">${esc(iniciales(nombreCli(cl)))}</div><div class="grow"><div class="n">${esc(nombreCli(cl))}</div><div class="sub mono">${esc(cl.telefono || '')}</div></div><a class="btn sec sm" href="#/clientes?id=${encodeURIComponent(cl.id)}">Ver perfil</a></div>` : '<div class="sub">Sin propietario.</div>'}</div>
      </div>
      <div style="padding:16px 18px 0"><div class="sec-tit" style="margin-top:0">${ms('tune', 's18')} Especificaciones</div>
        <div class="specs">
          <div class="spec"><div class="kk">Motor</div><div class="v">${esc(pick(v, ['motor'], '—'))}</div></div>
          <div class="spec"><div class="kk">Odómetro</div><div class="v mono">${km(v)}</div></div>
          <div class="spec"><div class="kk">Servicios</div><div class="v mono">${cs.length}</div></div>
          <div class="spec"><div class="kk">Facturado (cerradas)</div><div class="v mono">${dinero(facturado)}</div></div>
        </div></div>
      ${v.observaciones ? `<div style="padding:14px 18px 0"><div class="aviso">${ms('warning')}<div><b>Nota técnica permanente</b><div>${esc(v.observaciones)}</div></div></div></div>` : ''}
      <div style="padding:6px 18px 18px"><div class="sec-tit">${ms('history', 's18')} Bitácora histórica de servicios<span class="sub">${cs.length} intervención(es)</span></div>${historial(P, cs)}</div>`;
    copiar(det);
  };
  L.cont.addEventListener('click', e => { const it = e.target.closest('.item'); if (it) abrir(it.dataset.id); });
  el.querySelector('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); filtrar(); });
  el.querySelector('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; el.querySelectorAll('#chips .chip').forEach(x => x.classList.toggle('on', x === b)); filtrar(); });
  filtrar(); if (sel) abrir(sel);
}
