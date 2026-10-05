// ============================================================
// SpeedCenter 2.0 · CONFIGURACIÓN (lo ÚNICO que debes editar)
// Pega aquí tu URL y tu anon/publishable key (las mismas de la V11.8).
// La anon key es pública por diseño de Supabase: la seguridad real es RLS.
// NUNCA pongas aquí la service_role / secret key.
// ============================================================
export const SUPABASE_URL = 'https://qchtyxzgzgotjosqmyyq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhd2V2Z2x4ZWFvZ3lva3B4b3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTAwNzEsImV4cCI6MjEwMzAyNjA3MX0.aJeeopq8tb5FgBY3OXLFNvDupuyrcyOg2wo0eaqWygw';

// Nombres de tablas (ajústalos si 00_diagnostico.sql muestra otros)
export const TABLAS = {
  perfiles: 'perfiles',
  clientes: 'clientes',
  vehiculos: 'vehiculos',
  cotizaciones: 'cotizaciones',
  detalle: 'detalle_cotizacion',
  pagos: 'pagos',
  bitacora: 'bitacora',
  ordenes: 'ordenes_trabajo',
  herramientas: 'herramientas',
  catalogo: 'servicios',
  prospectos: 'prospectos'
};

export const ROLES = { administrador: 'Administrador', admin: 'Administrador', asesor: 'Asesor de servicio', tecnico: 'Técnico', consulta: 'Consulta' };
export const ROLES_ADMIN = ['administrador', 'admin'];
export const TASA_IVA = 0.16;      // el total INCLUYE IVA y se desglosa
export const ANTICIPO = 0.50;      // anticipo obligatorio
