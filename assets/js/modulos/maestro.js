// Maestro-detalle reutilizable: lista con buscador + chips a la izquierda, ficha a la derecha.
import { esc } from '../format.js';

export function maestroDetalle(el, { titulo, filas, item, buscarEn, chips = [], detalle, vacio = 'Selecciona un registro para ver su ficha.' }) {
  el.insertAdjacentHTML('beforeend', `
  <div class="md">
    <section class="panel">
      <div class="panel-cab"><h3>${esc(titulo)} <span class="muted num" style="font-weight:500">(${filas.length})</span></h3></div>
      <div style="padding:0 16px 10px"><input class="input" type="search" placeholder="Buscar…" aria-label="Buscar" /></div>
      ${chips.length ? `<div class="chips">${chips.map((c, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-i="${i}">${esc(c.txt)}</button>`).join('')}</div>` : ''}
      <div class="lista"></div>
    </section>
    <section class="panel detalle"><div class="vacio">${esc(vacio)}</div></section>
  </div>`);

  const md = el.querySelector('.md:last-of-type');
  const lista = md.querySelector('.lista');
  const panel = md.querySelector('.detalle');
  let chip = 0, texto = '', selId = null;

  const visibles = () => filas.filter(f =>
    (!chips[chip] || chips[chip].filtro(f)) &&
    (!texto || (buscarEn ? buscarEn(f) : JSON.stringify(f)).toLowerCase().includes(texto)));

  const pintar = () => {
    const v = visibles();
    lista.innerHTML = v.length
      ? v.map(f => `<div class="item ${f.id === selId ? 'sel' : ''}" data-id="${esc(f.id)}" tabindex="0">${item(f)}</div>`).join('')
      : '<div class="vacio">Sin registros.</div>';
  };

  const abrir = async (id) => {
    selId = id; pintar();
    const fila = filas.find(f => String(f.id) === String(id));
    if (!fila) return;
    panel.innerHTML = '<div class="cargando">Cargando ficha…</div>';
    try { panel.innerHTML = await detalle(fila); }
    catch (e) { panel.innerHTML = `<div class="alerta error" style="margin:16px">${esc(e.message)}</div>`; }
  };

  lista.addEventListener('click', e => { const it = e.target.closest('.item'); if (it) abrir(it.dataset.id); });
  lista.addEventListener('keydown', e => { if (e.key === 'Enter') { const it = e.target.closest('.item'); if (it) abrir(it.dataset.id); } });
  md.querySelector('input').addEventListener('input', e => { texto = e.target.value.trim().toLowerCase(); pintar(); });
  md.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
    chip = Number(b.dataset.i);
    md.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
    pintar();
  }));

  pintar();
  if (filas[0]) abrir(filas[0].id);
}
