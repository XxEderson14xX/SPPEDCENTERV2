import { sb } from './supabase.js';

// Lee una tabla sin romperse si la columna de orden no existe.
export async function leer(tabla, { orden = 'created_at', limite = 500, filtro } = {}) {
  const base = () => { let q = sb.from(tabla).select('*').limit(limite); if (filtro) q = filtro(q); return q; };
  let r = orden ? await base().order(orden, { ascending: false }) : await base();
  if (r.error && orden && /column/i.test(r.error.message)) r = await base();
  return r;
}

// Busca filas relacionadas probando varios nombres de columna (ej. cliente_id / id_cliente).
export async function relacionados(tabla, columnas, valor, opts = {}) {
  for (const col of columnas) {
    const r = await leer(tabla, { ...opts, filtro: q => q.eq(col, valor) });
    if (!r.error) return r.data || [];
  }
  return [];
}

export function indexar(filas) { const m = new Map(); (filas || []).forEach(f => m.set(f.id, f)); return m; }
