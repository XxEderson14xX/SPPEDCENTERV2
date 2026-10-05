import { TABLAS } from '../config.js';
import { esc, pick, dinero, relativa, horasDesde, badge, ms, waLink } from '../format.js';
import { encabezado, kpi, errorTabla } from '../ui.js';
import { padron, estadoCot, clienteDeCot, saldoDe, tieneAdeudo, nombreCli, autoDe, placaDe, idVeh, vinDe, pagoValido, importePago } from '../datos.js';

// Etapas del flujo comercial (se cuentan con el estado REAL de cada cotización)
const ETAPAS = [
  { txt: 'Borrador', color: 'gris', f: e => e === 'borrador' },
  { txt: 'Enviada', color: 'azul', f: e => e === 'enviada' },
  { txt: 'Pend. autorización', color: 'naranja', f: e => e.includes('pendiente') },
  { txt: 'Autorizada', color: 'verde', f: e => e === 'autorizada' },
  { txt: 'Cerrada', color: 'morado', f: e => e === 'cerrada' },
  { txt: 'Rechazada / Cancelada', color: 'rojo', f: e => ['rechazada', 'cancelada'].includes(e) }
];

export async function dashboard(el) {
  el.innerHTML = '<div class="cargando">Cargando tablero…</div>';
  const P = await padron(true);
  if (P.err.cotizaciones) { el.innerHTML = errorTabla(TABLAS.cotizaciones, P.err.cotizaciones); return; }

  const cots = P.cotizaciones;
  const abiertas = cots.filter(c => !['cerrada', 'cancelada', 'rechazada'].includes(estadoCot(c)));
  const pendientes = cots.filter(c => estadoCot(c).includes('pendiente'));
  const urgentes = pendientes.filter(c => horasDesde(c.updated_at || c.created_at) > 24);
  const conSaldo = cots.filter(c => tieneAdeudo(P, c));
  const hoy = new Date().toDateString();
  const pagosHoy = P.pagos.filter(p => pagoValido(p) && new Date(p.created_at).toDateString() === hoy);
  const cobradoHoy = pagosHoy.reduce((s, p) => s + importePago(p), 0);
  const suma = l => l.reduce((s, c) => s + (Number(pick(c, ['total'], 0)) || 0), 0);
  const ahora = new Date();

  el.innerHTML = encabezado({
    titulo: 'Vista general del taller',
    extra: `<div class="resumen"><span class="badge verde dot">En vivo</span><span class="muted">${esc(ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }))}</span><span><b>${abiertas.length}</b> cotizaciones en ciclo activo</span></div>`,
    acciones: `<a class="btn sec" href="#/cotizaciones">${ms('request_quote', 's18')} Ver cotizaciones</a><a class="btn" href="#/cotizaciones">${ms('add_circle', 's18')} Nueva cotización</a>`
  }) + `
  <div class="kpis">
    ${kpi({ etq: 'Cotizaciones abiertas', ico: 'request_quote', color: 'rojo', val: abiertas.length, unidad: 'activas', pieIzq: dinero(suma(abiertas)), pieDer: '<span class="badge gris">En cartera</span>' })}
    ${kpi({ etq: 'Pendientes de autorización', ico: 'pending_actions', color: 'naranja', val: pendientes.length, unidad: 'cotizaciones', pieIzq: dinero(suma(pendientes)), pieDer: urgentes.length ? `<span class="badge naranja">${urgentes.length} con +24 h</span>` : '<span class="badge verde">Al día</span>' })}
    ${kpi({ etq: 'Con saldo pendiente', ico: 'account_balance_wallet', color: 'azul', val: conSaldo.length, unidad: 'cuentas', pieIzq: dinero(conSaldo.reduce((s, c) => s + saldoDe(P, c), 0)), pieDer: '<span class="badge azul">Por cobrar</span>' })}
    ${kpi({ etq: 'Ingresos / cobranza del día', ico: 'payments', color: 'verde', val: dinero(cobradoHoy), unidad: 'MXN', pieIzq: `${pagosHoy.length} pago(s) hoy`, pieDer: '<span class="badge verde">Cobrado</span>' })}
  </div>

  <section class="panel">
    <div class="panel-cab"><h3>${ms('conversion_path')} Flujo comercial en tiempo real</h3><span class="muted" style="font-size:13px">${cots.length} cotizaciones registradas</span></div>
    <div class="flujo">${ETAPAS.map(e => { const n = cots.filter(c => e.f(estadoCot(c))).length; const pct = cots.length ? Math.round(n * 100 / cots.length) : 0;
      return `<div class="etapa ${e.color}"><div class="r"><span>${esc(e.txt)}</span><b>${n}</b></div><div class="linea"><i style="width:${pct}%"></i></div></div>`; }).join('')}</div>
  </section>

  <div class="grid-2-1">
    <section class="panel rojo">
      <div class="panel-cab"><h3>${ms('assignment')} Actividad reciente</h3><a class="btn sec sm" href="#/cotizaciones">Ver todas</a></div>
      <div class="tabla-scroll"><table class="tabla click"><thead><tr><th>Folio / Fecha</th><th>Vehículo</th><th>Cliente</th><th class="der">Total</th><th>Estado</th></tr></thead><tbody>
      ${cots.slice(0, 8).map(c => { const v = P.veh.get(idVeh(c)); const cl = clienteDeCot(P, c); return `<tr data-href="#/cotizaciones?id=${encodeURIComponent(c.id)}">
        <td><div class="folio">${esc(c.folio || '—')}</div><div class="sub">${esc(relativa(c.created_at))}</div></td>
        <td><div style="font-weight:600">${esc(autoDe(v))}</div>${v ? `<div class="sub mono">${esc(vinDe(v) || '')}</div>` : ''}</td>
        <td><div>${esc(cl ? nombreCli(cl) : '—')}</div>${v ? `<span class="placa clara">${esc(placaDe(v))}</span>` : ''}</td>
        <td class="der"><div class="importe">${dinero(pick(c, ['total'], null))}</div>${tieneAdeudo(P, c) ? `<div class="sub" style="color:var(--danger)">Saldo ${dinero(saldoDe(P, c))}</div>` : ''}</td>
        <td>${badge(pick(c, ['estado_comercial', 'estado']))}</td></tr>`; }).join('') || '<tr><td colspan="5" class="vacio">Sin cotizaciones.</td></tr>'}
      </tbody></table></div>
    </section>

    <div>
      <section class="panel rojo">
        <div class="panel-cab"><h3>${ms('notification_important')} Cotizaciones por autorizar</h3>${urgentes.length ? `<span class="badge naranja">${urgentes.length} con +24 h</span>` : ''}</div>
        ${pendientes.slice(0, 4).map(c => { const v = P.veh.get(idVeh(c)); const cl = clienteDeCot(P, c); const wa = waLink(cl?.telefono); const h = Math.floor(horasDesde(c.updated_at || c.created_at));
          return `<div class="tarjeta-lat"><div class="r1"><span class="folio">${esc(c.folio || '—')}</span><span style="color:${h > 24 ? 'var(--warn)' : 'var(--muted)'}">${ms('schedule', 's16')} Hace ${h < 24 ? h + ' h' : Math.floor(h / 24) + ' d'}</span></div>
          <div class="r2"><span>${esc(autoDe(v))}</span><span class="mono">${dinero(pick(c, ['total'], null))}</span></div>
          <div class="sub">${esc(cl ? nombreCli(cl) : '')}</div>
          <div class="bts">${wa ? `<a class="btn sec sm" href="${wa}" target="_blank" rel="noopener">${ms('chat', 's16')} WhatsApp</a>` : '<span></span>'}${cl?.telefono ? `<a class="btn sec sm" href="tel:${esc(String(cl.telefono).replace(/[^\d+]/g, ''))}">${ms('call', 's16')} Llamar</a>` : ''}</div></div>`; }).join('') || '<div class="vacio">Nada pendiente de autorizar.</div>'}
        <div style="height:6px"></div>
      </section>
      <section class="panel">
        <div class="panel-cab"><h3>${ms('receipt_long')} Últimos pagos</h3><a class="btn sec sm" href="#/ingresos">Ingresos</a></div>
        ${P.pagos.filter(pagoValido).slice(0, 5).map(p => { const c = P.cot.get(pick(p, ['cotizacion_id', 'id_cotizacion'], null)); return `<div class="tarjeta-lat"><div class="r1"><span class="folio">${esc(c?.folio || '—')}</span><span class="muted">${esc(relativa(p.created_at))}</span></div><div class="r2"><span>${esc(pick(p, ['metodo', 'metodo_pago'], '—'))}</span><span class="mono" style="color:var(--ok)">${dinero(importePago(p))}</span></div></div>`; }).join('') || '<div class="vacio">Sin pagos registrados.</div>'}
        <div style="height:6px"></div>
      </section>
    </div>
  </div>`;

  el.querySelectorAll('tr[data-href]').forEach(tr => tr.addEventListener('click', () => { location.hash = tr.dataset.href; }));
}
