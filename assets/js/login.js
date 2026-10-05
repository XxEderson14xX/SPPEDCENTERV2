import { iniciarSesion } from './auth.js';
import { esc, ms } from './format.js';

export function renderLogin(root, alEntrar, mensaje = '') {
  root.innerHTML = `
  <main class="login-fondo">
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-icono">${ms('bolt', 'f s24')}</div>
        <h1>SpeedCenter</h1>
        <p class="sub">Inicia sesión con tu usuario o correo</p>
        <div id="login-msg">${mensaje ? `<div class="alerta error">${esc(mensaje)}</div>` : ''}</div>
        <form id="form-login" novalidate>
          <label class="lbl" for="identificador">Usuario o correo</label>
          <div class="inp-ico">${ms('alternate_email')}
            <input id="identificador" name="username" type="text" autocomplete="username" placeholder="usuario o correo@taller.com" required />
          </div>
          <label class="lbl" for="password">Contraseña</label>
          <div class="inp-ico">${ms('lock')}
            <input id="password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required />
            <button type="button" class="ojo" id="btn-ojo" aria-label="Mostrar contraseña">${ms('visibility')}</button>
          </div>
          <button class="btn-login" type="submit" id="btn-entrar">Ingresar ${ms('arrow_forward')}</button>
        </form>
        <div class="login-pie">
          <span>¿Olvidaste tu contraseña? Pídele al administrador que la restablezca.</span>
          <span class="seg">${ms('verified_user', 'f')} Conexión segura (HTTPS)</span>
        </div>
      </div>
      <p class="login-marca">© SpeedCenter Automotive System</p>
    </div>
  </main>`;

  const pass = root.querySelector('#password'), msg = root.querySelector('#login-msg'), btn = root.querySelector('#btn-entrar');
  root.querySelector('#btn-ojo').addEventListener('click', e => {
    const ver = pass.type === 'password'; pass.type = ver ? 'text' : 'password';
    e.currentTarget.innerHTML = ms(ver ? 'visibility_off' : 'visibility');
  });
  root.querySelector('#form-login').addEventListener('submit', async e => {
    e.preventDefault();
    const id = root.querySelector('#identificador').value.trim();
    if (!id || !pass.value) { msg.innerHTML = '<div class="alerta error">Escribe tu usuario y contraseña.</div>'; return; }
    btn.disabled = true; btn.innerHTML = 'Validando…'; msg.innerHTML = '';
    try { alEntrar(await iniciarSesion(id, pass.value)); }
    catch (err) { msg.innerHTML = `<div class="alerta error">${esc(err.message)}</div>`; btn.disabled = false; btn.innerHTML = `Ingresar ${ms('arrow_forward')}`; pass.value = ''; }
  });
}
