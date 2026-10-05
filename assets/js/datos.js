import { sb } from './supabase.js';
import { TABLAS } from './config.js';
import { pick } from './format.js';

export async function leer(tabla, { orden = 'created_at', limite = 1000, filtro } = {}) {
  const base = () => { let q = sb.from(tabla).select('*').limit(limite); if (filtro) q = filtro(q); return q; };
  let r = orden ? await base().order(orden, { ascending: false }) : await base();
  if (r.error && orden && /column/i.test(r.error.message)) r = await base();
  return r;
}
export async function relacionados(tabla, columnas, valor, opts = {}) {
  for (const col of columnas) { const r = await leer(tabla, { ...opts, filtro: q => q.eq(col, valor) }); if (!r.error) return r.data || []; }
  return [];
}
export const indexar = filas => { const m = new Map(); (filas || []).forEach(f => m.set(f.id, f)); return m; };

// Helpers de dominio (toleran nombres de columna distintos)
export const idCli = r => pick(r, ['cliente_id', 'id_cliente'], null);
export const idVeh = r => pick(r, ['vehiculo_id', 'id_vehiculo'], null);
export const idCot = r => pick(r, ['cotizacion_id', 'id_cotizacion'], null);
export const nombreCli = c => pick(c, ['nombre_completo', 'nombre'], '—');
export const placaDe = v => pick(v, ['placa', 'placas'], '—');
export const vinDe = v => pick(v, ['vin', 'niv'], '');
export const autoDe = v => v ? `${pick(v, ['marca'])} ${pick(v, ['modelo'])} ${pick(v, ['anio', 'año', 'ano'])}`.replace(/\s+/g, ' ').trim() || '—' : '—';
export const estadoCot = c => String(pick(c, ['estado_comercial', 'estado'], '')).toLowerCase();
export const importePago = p => Number(pick(p, ['importe', 'monto'], 0)) || 0;
export const pagoValido = p => !['cancelado', 'cancelada', 'anulado'].includes(String(p.estado || '').toLowerCase());

// Caché de la sesión (se recarga al entrar a cada módulo principal)
let cache = null;
export async function padron(forzar = false) {
  if (cache && !forzar) return cache;
  const [c, v, q, p] = await Promise.all([leer(TABLAS.clientes, { limite: 5000 }), leer(TABLAS.vehiculos, { limite: 5000 }), leer(TABLAS.cotizaciones, { limite: 5000 }), leer(TABLAS.pagos, { limite: 5000 })]);
  const pagosPorCot = new Map();
  (p.data || []).filter(pagoValido).forEach(x => { const k = idCot(x); pagosPorCot.set(k, (pagosPorCot.get(k) || 0) + importePago(x)); });
  cache = {
    clientes: c.data || [], vehiculos: v.data || [], cotizaciones: q.data || [], pagos: p.data || [],
    cli: indexar(c.data), veh: indexar(v.data), cot: indexar(q.data), pagosPorCot,
    err: { clientes: c.error, vehiculos: v.error, cotizaciones: q.error, pagos: p.error }
  };
  return cache;
}
export const limpiarCache = () => { cache = null; };

// Cliente de una cotización: directo o vía vehículo
export const clienteDeCot = (P, c) => P.cli.get(idCli(c)) || P.cli.get(idCli(P.veh.get(idVeh(c))));
// Saldo: usa la columna si existe; si no, total - pagos válidos
export function saldoDe(P, c) {
  const col = pick(c, ['saldo', 'saldo_pendiente'], null);
  if (col !== null) return Number(col) || 0;
  return Math.max((Number(pick(c, ['total'], 0)) || 0) - (P.pagosPorCot.get(c.id) || 0), 0);
}
export const abonadoDe = (P, c) => P.pagosPorCot.get(c.id) || 0;

// Solo hay adeudo real cuando la cotización ya fue autorizada/cerrada o tiene abonos (un borrador no es deuda)
export function tieneAdeudo(P, c) {
  const e = estadoCot(c);
  if (['cancelada', 'rechazada', 'borrador', 'enviada'].includes(e) || e.includes('pendiente')) return abonadoDe(P, c) > 0 && saldoDe(P, c) > 0;
  return saldoDe(P, c) > 0;
}
