import { TABLAS, ANTICIPO } from '../config.js';
import { esc, pick, dinero, fecha, relativa, horasDesde, badge, ms, iniciales, desglosarIVA, waLink } from '../format.js';
import { encabezado, kpi, errorTabla, fase2, paginar } from '../ui.js';
import { padron, relacionados, estadoCot, clienteDeCot, saldoDe, abonadoDe, nombreCli, autoDe, placaDe, vinDe, idVeh, pagoValido, importePago } from '../datos.js';

const POR_PAG = 8;
const CHIPS = [
  { txt: 'Todas', f: () => true },
  { txt: 'Borrador', f: e => e === 'borrador' },
  { txt: 'Enviadas', f: e => e === 'enviada' },
  { txt: 'Pendiente autorización', f: e => e.includes('pendiente'), cls: 'naranja' },
  { txt: 'Autorizadas', f: e => e === 'autorizada' },
  { txt: 'Cerradas', f: e => e === 'cerrada' },
  { txt: 'Rechazadas / Canceladas', f: e => ['rechazada', 'cancelada'].includes(e) }
];

export async function cotizaciones(el, params) {
  el.innerHTML = '<div class="cargando">Cargando cotizaciones…</div>';
  const P = await padron(true);
  if (P.err.cotizaciones) { el.innerHTML = errorTabla(TABLAS.cotizaciones, P.err.cotizaciones); return; }
  const cots = P.cotizaciones;
  const suma = l => l.reduce((s, c) => s + (Number(pick(c, ['total'], 0)) || 0), 0);
  const grupo = f => cots.filter(c => f(estadoCot(c)));
  const borr = grupo(e => e === 'borrador'), env = grupo(e => e === 'enviada'), pend = grupo(e => e.includes('pendiente')), aut = grupo(e => e === 'autorizada');
  const urg = pend.filter(c => horasDesde(c.updated_at || c.created_at) > 24);
  const activas = cots.filter(c => !['cerrada', 'cancelada', 'rechazada'].includes(estadoCot(c)));
  const cerradasOAut = cots.filter(c => ['autorizada', 'cerrada'].includes(estadoCot(c))).length;
  const decididas = cerradasOAut + cots.filter(c => ['rechazada', 'cancelada'].includes(estadoCot(c))).length;

  el.innerHTML = encabezado({
    titulo: 'Gestión de Cotizaciones',
    extra: `<div class="chip-ciclo">Ciclo completo: crear, autorizar, dar seguimiento y cerrar</div>
      <div class="resumen"><span><b>${activas.length}</b> cotizaciones en ciclo activo</span><span class="mono">${dinero(suma(activas))} MXN en cartera</span>
      ${decididas ? `<span style="color:var(--ok)">${ms('trending_up', 's16')} Tasa de conversión: ${Math.round(cerradasOAut * 100 / decididas)}%</span>` : ''}</div>`,
    acciones: fase2('Nueva Cotización', 'add_circle', '')
  }) + `
  <div class="kpis">
    ${kpi({ etq: 'Borradores / diagnóstico', ico: 'edit_document', val: borr.length, unidad: 'cotizaciones', pieIzq: dinero(suma(borr)), pieDer: '<span class="badge gris">En revisión</span>' })}
    ${kpi({ etq: 'Enviadas al cliente', ico: 'outgoing_mail', color: 'azul', val: env.length, unidad: 'cotizaciones', pieIzq: dinero(suma(env)), pieDer: '<span class="badge azul">Esperando respuesta</span>' })}
    ${kpi({ etq: 'Por autorizar (>24 h)', ico: 'pending_actions', color: 'naranja', val: urg.length, unidad: urg.length ? 'urgentes' : 'al día', valColor: urg.length ? 'warn' : '', pieIzq: dinero(suma(urg)), pieDer: urg.length ? '<span class="badge naranja">Requiere llamada</span>' : '' })}
    ${kpi({ etq: 'Autorizadas (anticipo 50%)', ico: 'check_circle', color: 'verde', val: aut.length, unidad: 'cotizaciones', valColor: 'ok', pieIzq: dinero(suma(aut)), pieDer: '<span class="badge verde">Listas para OT</span>' })}
  </div>
  <div class="grid-md">
    <section class="panel rojo">
      <div class="toolbar">
        <div class="campo-bus">${ms('search')}<input id="q" type="search" placeholder="Buscar folio, cliente, placa o VIN…" /></div>
        <label class="muted" style="font-size:13px">Ordenar:</label>
        <select class="select" id="orden"><option value="rec">Recientes primero</option><option value="ant">Antiguas primero</option><option value="may">Mayor importe</option><option value="sal">Mayor saldo</option></select>
      </div>
      <div class="chips" id="chips">${CHIPS.map((c, i) => `<button class="chip ${c.cls || ''} ${i === 0 ? 'on' : ''}" data-i="${i}">${esc(c.txt)} (${cots.filter(x => c.f(estadoCot(x))).length})</button>`).join('')}</div>
      <div class="tabla-scroll"><table class="tabla click"><thead><tr><th>Folio / Fecha</th><th>Vehículo y placas</th><th>Cliente</th><th class="der">Total / Anticipo 50%</th><th>Estado</th></tr></thead><tbody id="tb"></tbody></table></div>
      <div id="pag"></div>
    </section>
    <section class="panel rojo sticky" id="detalle"><div class="vacio">Selecciona una cotización.</div></section>
  </div>`;

  let chip = 0, q = '', orden = 'rec', pag = 1, sel = params.get('id') || cots[0]?.id;
  const tb = el.querySelector('#tb'), pagEl = el.querySelector('#pag'), det = el.querySelector('#detalle');

  const lista = () => {
    let l = cots.filter(c => CHIPS[chip].f(estadoCot(c)));
    if (q) l = l.filter(c => { const v = P.veh.get(idVeh(c)); const cl = clienteDeCot(P, c); return [c.folio, cl && nombreCli(cl), v && placaDe(v), v && vinDe(v), v && autoDe(v)].join(' ').toLowerCase().includes(q); });
    const tot = c => Number(pick(c, ['total'], 0)) || 0;
    if (orden === 'ant') l = [...l].reverse(); else if (orden === 'may') l = [...l].sort((a, b) => tot(b) - tot(a)); else if (orden === 'sal') l = [...l].sort((a, b) => saldoDe(P, b) - saldoDe(P, a));
    return l;
  };
  const pintar = () => {
    const l = lista(); const pg = paginar(l.length, pag, POR_PAG); pag = pg.p;
    tb.innerHTML = l.slice((pag - 1) * POR_PAG, pag * POR_PAG).map(c => {
      const v = P.veh.get(idVeh(c)); const cl = clienteDeCot(P, c); const t = Number(pick(c, ['total'], 0)) || 0; const ab = abonadoDe(P, c);
      return `<tr data-id="${esc(c.id)}" class="${String(c.id) === String(sel) ? 'sel' : ''}">
        <td><div class="folio">${esc(c.folio || '—')}</div><div class="sub">${esc(relativa(c.created_at))}</div></td>
        <td><div style="font-weight:600">${esc(autoDe(v))}</div><div class="sub mono">${esc(v ? placaDe(v) : '')}</div></td>
        <td><div>${esc(cl ? nombreCli(cl) : '—')}</div></td>
        <td class="der"><div class="importe">${dinero(t)}</div>${ab > 0 ? `<div class="sub" style="color:var(--ok)">Pagado: ${dinero(ab)}</div>` : `<div class="sub" style="color:var(--danger)">Req. 50%: ${dinero(t * ANTICIPO)}</div>`}</td>
        <td>${badge(pick(c, ['estado_comercial', 'estado']))}</td></tr>`;
    }).join('') || '<tr><td colspan="5" class="vacio">Sin cotizaciones con ese filtro.</td></tr>';
    pagEl.innerHTML = pg.html;
  };
  const abrir = async id => {
    sel = id; pintar();
    const c = P.cot.get(id) || cots.find(x => String(x.id) === String(id)); if (!c) return;
    det.innerHTML = '<div class="cargando">Cargando detalle…</div>';
    det.innerHTML = await detalleCot(P, c);
    det.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
      det.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b));
      det.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('oculto', p.dataset.panel !== b.dataset.t));
    }));
  };

  tb.addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) abrir(tr.dataset.id); });
  pagEl.addEventListener('click', e => { const b = e.target.closest('button[data-pag]'); if (b && !b.disabled) { pag = Number(b.dataset.pag); pintar(); } });
  el.querySelector('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); pag = 1; pintar(); });
  el.querySelector('#orden').addEventListener('change', e => { orden = e.target.value; pintar(); });
  el.querySelector('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; chip = Number(b.dataset.i); pag = 1; el.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); pintar(); });

  pintar(); if (sel) abrir(sel);
}

async function detalleCot(P, c) {
  const v = P.veh.get(idVeh(c)); const cl = clienteDeCot(P, c);
  const [conceptos, pagos] = await Promise.all([
    relacionados(TABLAS.detalle, ['cotizacion_id', 'id_cotizacion'], c.id, { orden: null }),
    relacionados(TABLAS.pagos, ['cotizacion_id', 'id_cotizacion'], c.id)
  ]);
  const total = Number(pick(c, ['total'], 0)) || 0;
  const { subtotal, iva } = desglosarIVA(total);
  const validos = pagos.filter(pagoValido);
  const abonado = validos.reduce((s, p) => s + importePago(p), 0);
  const anticipo = Math.round(total * ANTICIPO * 100) / 100;
  const saldo = Math.max(total - abonado, 0);
  const cubierto = total > 0 && abonado >= anticipo;
  const pct = total > 0 ? Math.min(100, Math.round(abonado * 10000 / total) / 100) : 0;
  const wa = waLink(cl?.telefono);
  const tipoTag = d => { const t = String(pick(d, ['tipo', 'categoria'], '')).toLowerCase();
    return t.includes('refac') || t.includes('pieza') || t.includes('consum') ? '<span class="tag ref">REF</span>' : t.includes('combo') || t.includes('paquete') ? '<span class="tag" style="background:var(--special-bg);color:var(--special)">PAQ</span>' : '<span class="tag">M.O.</span>'; };

  return `
  <div class="det">
    <div class="det-top"><span class="folio">${esc(c.folio || '—')}</span>${badge(pick(c, ['estado_comercial', 'estado']))}</div>
    <h2>Detalle y Aprobación de Presupuesto</h2>
    <div class="sub">Creada el ${fecha(c.created_at, true)}</div>
    <div class="caja">
      <div class="cliente-fila"><div class="avatar dark">${esc(iniciales(cl ? nombreCli(cl) : '?'))}</div>
        <div class="grow"><div class="n">${esc(cl ? nombreCli(cl) : 'Cliente no encontrado')}</div><div class="sub">${esc(cl?.correo || cl?.email || '')}</div></div>
        ${wa ? `<a class="tel" href="${wa}" target="_blank" rel="noopener">${ms('chat', 's16')} ${esc(cl.telefono)}</a>` : ''}</div>
      ${v ? `<div class="vehiculo-box"><div class="l1"><span>${esc(autoDe(v))}</span><span class="placa">${esc(placaDe(v))}</span></div>
        <div class="l2"><span class="kk">Número VIN</span><span class="kk der">Kilometraje</span>
        <span class="mono">${esc(vinDe(v) || '—')}</span><span class="mono der">${pick(v, ['kilometraje', 'km'], '') !== '' ? Number(pick(v, ['kilometraje', 'km'])).toLocaleString('es-MX') + ' km' : '—'}</span></div></div>` : ''}
    </div>
  </div>
  <div class="tabs" role="tablist">
    <button class="tab on" data-t="conceptos">${ms('list_alt')} Datos y Conceptos</button>
    <button class="tab" data-t="pagos">${ms('payments')} Pagos y Anticipo <span class="n ${cubierto ? 'ok' : 'wa'}">${Math.round(pct)}%</span></button>
    <button class="tab" data-t="archivos">${ms('photo_library')} Evidencia</button>
  </div>

  <div class="det" data-panel="conceptos">
    <div class="sec-tit">Conceptos presupuestados (${conceptos.length})<span class="sub">Mano de obra y refacciones</span></div>
    ${conceptos.map(d => `<div class="concepto">${tipoTag(d)}<div class="grow"><div class="t">${esc(pick(d, ['descripcion', 'nombre', 'concepto'], '—'))}</div>
      <div class="sub">${pick(d, ['cantidad'], '') !== '' ? 'Cant. ' + esc(pick(d, ['cantidad'])) : ''} ${pick(d, ['precio_unitario', 'precio'], '') !== '' ? '· P.U. ' + dinero(pick(d, ['precio_unitario', 'precio'])) : ''}</div></div>
      <div class="imp">${dinero(pick(d, ['importe', 'total', 'subtotal'], null))}</div></div>`).join('') || '<div class="vacio">Sin conceptos registrados.</div>'}
    <div class="totales">
      <div class="f"><span>Subtotal neto</span><span>${dinero(subtotal)} MXN</span></div>
      <div class="f"><span>I.V.A. (16% desglosado)</span><span>${dinero(iva)} MXN</span></div>
      <div class="tot"><b>TOTAL NETO:</b><span class="grande">${dinero(total)} <small>MXN</small></span></div>
      <div class="anticipo ${cubierto ? 'ok' : ''}"><div class="l1"><span>${ms(cubierto ? 'verified' : 'shield', 's18')} Anticipo requerido (50%)</span><span class="mono">${dinero(anticipo)}</span></div>
        <p>${cubierto ? 'Anticipo cubierto. La cotización puede pasar a Orden de Trabajo.' : 'La Orden de Trabajo se habilita al registrar el 50% de anticipo.'}</p>
        <p style="display:flex;justify-content:space-between"><span>Saldo contra entrega de unidad:</span><span class="mono">${dinero(saldo)}</span></p></div>
    </div>
    <div class="botonera">
      <div class="full">${fase2(`Registrar anticipo (${dinero(anticipo)}) y autorizar`, 'check_circle', 'verde bloque')}</div>
      ${wa ? `<a class="btn sec" href="${wa}" target="_blank" rel="noopener">${ms('chat', 's18')} Enviar por WhatsApp</a>` : fase2('Enviar por WhatsApp', 'chat')}
      ${fase2('PDF y firma', 'print')}
    </div>
    <div class="nota-fase">Autorizar, cobrar y generar PDF siguen en la V11.8 hasta la Fase 2.</div>
  </div>

  <div class="det oculto" data-panel="pagos">
    <div class="mini-kpis">
      <div class="mini"><div class="kk">Total cotizado</div><div class="v">${dinero(total)}</div></div>
      <div class="mini"><div class="kk">Anticipo (50%) ${cubierto ? '<span class="badge verde">Cubierto</span>' : ''}</div><div class="v" style="color:var(--warn)">${dinero(anticipo)}</div></div>
      <div class="mini"><div class="kk">Total abonado</div><div class="v" style="color:var(--ok)">${dinero(abonado)}</div><div class="sub">${validos.length} pago(s) válido(s)</div></div>
      <div class="mini"><div class="kk">Saldo pendiente</div><div class="v" style="color:var(--danger)">${dinero(saldo)}</div></div>
    </div>
    <div class="sec-tit">Balance de amortización<span class="mono sub">${pct.toFixed(2)}% completado</span></div>
    <div class="barra"><i style="width:${pct}%"></i></div>
    <div class="sec-tit">Historial de transacciones<span class="sub">${pagos.length} movimiento(s)</span></div>
    ${pagos.map(p => `<div class="concepto"><span class="ms s18" style="color:${pagoValido(p) ? 'var(--ok)' : 'var(--danger)'}">${pagoValido(p) ? 'check_circle' : 'cancel'}</span><div class="grow"><div class="t">${esc(pick(p, ['metodo', 'metodo_pago'], '—'))} ${pick(p, ['referencia'], '') ? `<span class="mono sub">· ${esc(p.referencia)}</span>` : ''}</div><div class="sub">${fecha(p.created_at, true)}</div></div><div class="imp">${dinero(importePago(p))}</div></div>`).join('') || '<div class="vacio">Sin pagos registrados.</div>'}
    <div class="aviso" style="margin-top:12px">${ms('gavel')}<div><b>Regla operativa:</b> el 50% de anticipo es obligatorio para autorizar refacciones y pasar el vehículo a OT. La entrega requiere liquidar el saldo o autorización del administrador.</div></div>
  </div>

  <div class="det oculto" data-panel="archivos">
    <div class="migracion" style="padding:30px 10px"><div class="ico-box azul">${ms('photo_camera')}</div><h3>Evidencia fotográfica · Fase 1</h3>
    <p>Primero se hará privado el bucket de evidencias (enlaces temporales). Mientras tanto consulta y sube archivos desde la V11.8.</p></div>
  </div>`;
}
