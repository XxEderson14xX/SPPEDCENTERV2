const MIGRATION_SQL = `-- SPEED CENTER V2 - ESTRUCTURA Y MIGRACIÓN DESDE V1
-- Ejecutar en el SQL Editor de Supabase

-- 1. Tabla de Clientes V2
CREATE TABLE IF NOT EXISTS public.v2_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_v1_id TEXT UNIQUE, -- Permite vincular registros con la V1
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Vehículos V2
CREATE TABLE IF NOT EXISTS public.v2_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_v1_id TEXT UNIQUE,
    client_id UUID REFERENCES public.v2_clients(id) ON DELETE CASCADE,
    plate TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Órdenes de Trabajo V2
CREATE TABLE IF NOT EXISTS public.v2_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_v1_id TEXT UNIQUE,
    vehicle_id UUID REFERENCES public.v2_vehicles(id),
    status TEXT CHECK (status IN ('recepcion', 'diagnostico', 'proceso', 'calidad', 'listo')) DEFAULT 'recepcion',
    bay_number INT,
    total_amount NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Script de Migración de ejemplo desde tablas V1 (Si existen)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        INSERT INTO public.v2_clients (legacy_v1_id, full_name, phone, email)
        SELECT id::text, name, phone, email FROM public.clients
        ON CONFLICT (legacy_v1_id) DO NOTHING;
    END IF;
END $$;
`;

document.addEventListener('DOMContentLoaded', () => {
    const area = document.getElementById('migration-sql-code');
    if (area) area.value = MIGRATION_SQL;
});

function copyMigrationSQL() {
    const area = document.getElementById('migration-sql-code');
    area.select();
    navigator.clipboard.writeText(area.value);
    alert('Script SQL copiado al portapapeles');
}
