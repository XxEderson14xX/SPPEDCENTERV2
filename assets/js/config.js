// ============================================================
// SpeedCenter 2.0 · CONFIGURACIÓN (lo ÚNICO que debes editar)
// Usa los MISMOS valores de tu Supabase actual de SpeedCenter.
// La anon key es pública por diseño de Supabase: la seguridad real es RLS.
// NUNCA pongas aquí la service_role key.
// ============================================================
export const SUPABASE_URL = 'https://qchtyxzgzgotjosqmyyq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaHR5eHpnemdvdGpvc3FteXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNzczMTIsImV4cCI6MjEwNjY1MzMxMn0.DFSq8H8IwuN8qC6rOZx3XZL-VSBXbvo_ph4j-MZD04k';
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
export const TASA_IVA = 0.16; // el total INCLUYE IVA y se desglosa
