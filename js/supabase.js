// Manejo de la conexión con Supabase o fallback a Mock Data
let supabaseClient = null;

function initSupabase() {
    const url = localStorage.getItem('SPEEDCENTER_V2_SUPABASE_URL');
    const key = localStorage.getItem('SPEEDCENTER_V2_SUPABASE_KEY');

    if (url && key && window.supabase) {
        supabaseClient = window.supabase.createClient(url, key);
        document.getElementById('kpi-db-status').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Supabase Conectado`;
    } else {
        document.getElementById('kpi-db-status').innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span> Modo Mock (Local)`;
    }
}

function saveSupabaseConfig() {
    const url = document.getElementById('cfg-url').value.trim();
    const key = document.getElementById('cfg-key').value.trim();

    if (url && key) {
        localStorage.setItem('SPEEDCENTER_V2_SUPABASE_URL', url);
        localStorage.setItem('SPEEDCENTER_V2_SUPABASE_KEY', key);
        alert('Configuración guardada. La página se recargará.');
        window.location.reload();
    } else {
        alert('Por favor, ingresa una URL y Key válidas.');
    }
}

document.addEventListener('DOMContentLoaded', initSupabase);
