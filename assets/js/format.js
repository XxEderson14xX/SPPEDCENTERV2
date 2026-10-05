import { TASA_IVA } from './config.js';

export function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function pick(row, campos, def = '') {
  if (!row) return def;
  for (const c of campos) { const v = row[c]; if (v !== null && v !== undefined && v !== '') return v; }
  return def;
}
const mxn = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dinero = v => { const n = Number(v); return Number.isFinite(n) && v !== null && v !== '' ? '$' + mxn.format(n) : '—'; };
export const num = v => Number(v) || 0;
export function desglosarIVA(total) {
  const t = num(total); const subtotal = Math.round((t / (1 + TASA_IVA)) * 100) / 100;
  return { subtotal, iva: Math.round((t - subtotal) * 100) / 100, total: t };
}
const fF = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
const fH = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });
export function fecha(v, conHora = false) {
  if (!v) return '—'; const d = new Date(v); if (Number.isNaN(d.getTime())) return esc(v);
  return fF.format(d) + (conHora ? ' · ' + fH.format(d) : '');
}
export function relativa(v) {
  if (!v) return '—'; const d = new Date(v); const hoy = new Date();
  const dias = Math.floor((new Date(hoy.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (dias === 0) return 'Hoy, ' + fH.format(d); if (dias === 1) return 'Ayer, ' + fH.format(d);
  return fecha(v);
}
export const horasDesde = v => v ? (Date.now() - new Date(v).getTime()) / 36e5 : 0;
export function iniciales(n) {
  return String(n || '?').replace(/^(ing|lic|dr|dra|tec|téc|sr|sra)\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?';
}
export function waLink(tel) {
  const d = String(tel || '').replace(/\D/g, ''); if (d.length < 10) return null;
  return 'https://wa.me/' + (d.length === 10 ? '52' + d : d);
}
const COLORES = {
  verde: ['autorizada', 'pagada', 'pagado', 'activo', 'activa', 'disponible', 'terminada', 'terminado', 'cerrada', 'valido', 'válido', 'convertido', 'completada', 'entregado'],
  rojo: ['rechazada', 'cancelada', 'cancelado', 'inactivo', 'fuera de servicio', 'descartado', 'eliminar', 'delete'],
  naranja: ['pendiente', 'pendiente de autorización', 'pendiente_autorizacion', 'pendiente de autorizacion', 'con saldo', 'prestada', 'en proceso', 'update'],
  azul: ['enviada', 'diagnóstico', 'diagnostico', 'contactado', 'abierta', 'insert'],
  gris: ['borrador', 'nuevo', 'sin iniciar'],
  morado: ['combo', 'paquete', 'cita agendada']
};
export function colorEstado(e) {
  const s = String(e ?? '').toLowerCase().trim();
  for (const [c, l] of Object.entries(COLORES)) if (l.includes(s)) return c;
  if (s.includes('pendiente')) return 'naranja';
  return 'gris';
}
export function badge(estado, dot = true) {
  if (!estado) return '<span class="badge gris">—</span>';
  let txt = String(estado).replace(/_/g, ' '); if (/^pendiente de autori[zs]aci[oó]n$/i.test(txt)) txt = 'Por autorizar'; return `<span class="badge ${colorEstado(estado)} ${dot ? 'dot' : ''}">${esc(txt.charAt(0).toUpperCase() + txt.slice(1))}</span>`;
}
export const ms = (n, cls = '') => `<span class="ms ${cls}" aria-hidden="true">${n}</span>`;
