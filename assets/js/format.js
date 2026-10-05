import { TASA_IVA } from './config.js';

// Escapa TODO texto que venga de la base antes de meterlo al HTML (anti XSS).
export function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Toma el primer campo que exista (tolera nombres de columna distintos).
export function pick(row, campos, def = '') {
  if (!row) return def;
  for (const c of campos) {
    const v = row[c];
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return def;
}

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export function dinero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? mxn.format(n) : '—';
}

// Regla única de IVA: el total INCLUYE IVA, se desglosa.
export function desglosarIVA(total) {
  const t = Number(total) || 0;
  const subtotal = Math.round((t / (1 + TASA_IVA)) * 100) / 100;
  const iva = Math.round((t - subtotal) * 100) / 100;
  return { subtotal, iva, total: t };
}

const fFecha = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
const fFechaHora = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export function fecha(v, conHora = false) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return esc(v);
  return (conHora ? fFechaHora : fFecha).format(d);
}

export function iniciales(nombre) {
  return String(nombre || '?').replace(/^(ing|lic|dr|dra|tec|sr|sra)\.?\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?';
}

const COLORES = {
  verde: ['autorizada', 'pagada', 'pagado', 'activo', 'disponible', 'terminada', 'cerrada', 'valido', 'válido', 'convertido'],
  rojo: ['rechazada', 'cancelada', 'cancelado', 'inactivo', 'fuera de servicio', 'descartado'],
  naranja: ['pendiente', 'pendiente de autorización', 'pendiente_autorizacion', 'con saldo', 'prestada', 'en proceso'],
  azul: ['enviada', 'diagnóstico', 'diagnostico', 'contactado', 'abierta'],
  gris: ['borrador', 'nuevo', 'sin iniciar'],
  morado: ['combo', 'paquete', 'cita agendada']
};
export function badge(estado) {
  const e = String(estado ?? '').toLowerCase().trim();
  if (!e) return '<span class="badge gris">—</span>';
  let color = 'gris';
  for (const [c, lista] of Object.entries(COLORES)) if (lista.includes(e)) { color = c; break; }
  return `<span class="badge ${color}">${esc(estado)}</span>`;
}
