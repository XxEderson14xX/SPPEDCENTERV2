// Datos de prueba para el renderizado local (Mock Data)
const mockBays = [
    { id: 1, name: 'Bahía 1', vehicle: 'Mitsubishi Lancer (2011)', status: 'proceso', tech: 'Técnico A' },
    { id: 2, name: 'Bahía 2', vehicle: 'Nissan Sentra (2018)', status: 'diagnostico', tech: 'Técnico B' },
    { id: 3, name: 'Bahía 3', vehicle: 'Disponible', status: 'disponible', tech: '-' }
];

function renderBays() {
    const container = document.getElementById('bays-container');
    if (!container) return;

    container.innerHTML = mockBays.map(bay => `
        <div class="bg-[#161F30] border ${bay.status === 'disponible' ? 'border-gray-800' : 'border-red-500/30'} p-4 rounded-xl">
            <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold uppercase text-gray-400">${bay.name}</span>
                <span class="text-xs px-2 py-0.5 rounded ${getStatusBadgeClass(bay.status)}">${bay.status}</span>
            </div>
            <h4 class="text-sm font-bold text-white">${bay.vehicle}</h4>
            <p class="text-xs text-gray-500 mt-1">Asignado: ${bay.tech}</p>
        </div>
    `).join('');

    // Actualizar KPIs
    document.getElementById('kpi-orders').innerText = '2';
    document.getElementById('kpi-bays').innerText = '2 / 3';
    document.getElementById('kpi-quotes').innerText = '5';
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'proceso': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
        case 'diagnostico': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
        default: return 'bg-gray-800 text-gray-400';
    }
}

function toggleModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderBays();
});
