import { sb } from './supabase.js';
import { TABLAS } from './config.js';

// Login con correo o con nombre de usuario.
// Para usuario usa la función sc_email_por_usuario (migración 01).
export async function iniciarSesion(identificador, password) {
  let email = identificador.trim();
  if (!email.includes('@')) {
    const { data, error } = await sb.rpc('sc_email_por_usuario', { p_usuario: email.toLowerCase() });
    if (error) throw new Error('No se pudo validar el usuario. ¿Ya corriste la migración 01? Mientras tanto entra con tu correo.');
    if (!data) throw new Error('Usuario o contraseña incorrectos.');
    email = data;
  }
  const { error } = await sb.auth.signInWithPassword({ email, password });
  // Mensaje genérico: no revelar si existe el usuario.
  if (error) throw new Error('Usuario o contraseña incorrectos.');
  return cargarPerfil();
}

export async function cargarPerfil() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: perfil, error } = await sb.from(TABLAS.perfiles).select('*').eq('id', user.id).maybeSingle();
  if (error || !perfil) {
    await sb.auth.signOut();
    throw new Error('Tu usuario no tiene perfil en el sistema. Contacta al administrador.');
  }
  if (perfil.activo === false) {
    await sb.auth.signOut();
    throw new Error('Tu usuario está desactivado. Contacta al administrador.');
  }
  return { user, perfil };
}

export async function cerrarSesion() {
  await sb.auth.signOut();
  location.hash = '';
  location.reload();
}
