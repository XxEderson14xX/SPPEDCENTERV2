import { iniciarSesion } from './auth.js';
import { esc } from './format.js';

export function renderLogin(root, alEntrar, mensaje = '') {
  root.innerHTML = `
  <main class="login-fondo">
    <div>
      <div class="login-card">
        <header>
          <img src="assets/img/logo-claro.svg" alt="SpeedCenter" />
          <p>Inicia sesión con tu usuario o correo</p>
        </header>
        <div id="login-msg">${mensaje ? `<div class="alerta error">${esc(mensaje)}</div>` : ''}</div>
        <form id="form-login" autocomplete="on" novalidate>
          <div class="campo">
            <label for="identificador">Usuario o correo</label>
            <input class="input" id="identificador" name="username" type="text" autocomplete="username" placeholder="usuario o nombre@taller.com" required />
          </div>
          <div class="campo">
            <label for="password">Contraseña</label>
            <div class="input-wrap">
              <input class="input" id="password" name="password" type="password" autocomplete="current-password" required />
              <button type="button" class="btn-ojo" id="btn-ojo" aria-label="Mostrar contraseña">👁</button>
            </div>
          </div>
          <button class="btn bloque" type="submit" id="btn-entrar">Ingresar →</button>
        </form>
        <div class="login-pie">¿Olvidaste tu contraseña? Pídele al administrador que la restablezca.</div>
      </div>
      <p class="login-marca">© SpeedCenter</p>
    </div>
  </main>`;

  const form = root.querySelector('#form-login');
  const pass = root.querySelector('#password');
  const msg = root.querySelector('#login-msg');
  const btn = root.querySelector('#btn-entrar');

  root.querySelector('#btn-ojo').addEventListener('click', (e) => {
    const ver = pass.type === 'password';
    pass.type = ver ? 'text' : 'password';
    e.currentTarget.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = root.querySelector('#identificador').value.trim();
    if (!id || !pass.value) {
      msg.innerHTML = '<div class="alerta error">Escribe tu usuario y contraseña.</div>';
      return;
    }
    btn.disabled = true; btn.textContent = 'Validando…'; msg.innerHTML = '';
    try {
      const sesion = await iniciarSesion(id, pass.value);
      alEntrar(sesion);
    } catch (err) {
      msg.innerHTML = `<div class="alerta error">${esc(err.message)}</div>`;
      btn.disabled = false; btn.textContent = 'Ingresar →';
      pass.value = '';
    }
  });
}
