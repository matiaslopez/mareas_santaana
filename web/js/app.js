// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registrado:', registration);
            })
            .catch(error => {
                console.log('Error al registrar Service Worker:', error);
            });
    });
}

// Variables globales
let mareas_data = null;
let deferredPrompt = null;

// Elementos del DOM
const mesSelector = document.getElementById('mesSelector');
const diaSelector = document.getElementById('diaSelector');
const tabulaBody = document.getElementById('tabulaBody');
const installBtn = document.getElementById('installBtn');
const estadoActual = document.getElementById('estadoActual');
const horaActual = document.getElementById('horaActual');
const alturaActual = document.getElementById('alturaActual');
const previaPleamarHora = document.getElementById('previaPleamarHora');
const previaPleamarAltura = document.getElementById('previaPleamarAltura');
const proximaPleamarHora = document.getElementById('proximaPleamarHora');
const proximaPleamarAltura = document.getElementById('proximaPleamarAltura');
const previaBajamarHora = document.getElementById('previaBajamarHora');
const previaBajamarAltura = document.getElementById('previaBajamarAltura');
const proximaBajamarHora = document.getElementById('proximaBajamarHora');
const proximaBajamarAltura = document.getElementById('proximaBajamarAltura');
const fechaActualizacion = document.getElementById('fechaActualizacion');

// Cargar datos de mareas
async function cargarDatos() {
    try {
        const response = await fetch('data/mareas.json');
        if (!response.ok) throw new Error('Error al cargar datos');
        
        mareas_data = await response.json();
        console.log('Datos cargados:', mareas_data);
        
        // Actualizar fecha
        if (mareas_data.ultima_actualizacion) {
            const fecha = new Date(mareas_data.ultima_actualizacion);
            fechaActualizacion.textContent = fecha.toLocaleDateString('es-UY');
        }
        
        // Llenar selector de meses
        llenarMeses();
        
        // Mostrar datos de hoy
        mostrarDatosHoy();
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        tabulaBody.innerHTML = '<tr><td colspan="3" class="sin-datos">Error al cargar datos</td></tr>';
    }
}

// Llenar selector de meses
function llenarMeses() {
    if (!mareas_data || !mareas_data.meses) return;
    
    const meses = Object.keys(mareas_data.meses);
    
    // Crear opción para cada mes
    meses.forEach(mes => {
        const option = document.createElement('option');
        option.value = mes;
        option.textContent = mes;
        mesSelector.appendChild(option);
    });
    
    // Seleccionar mes actual por defecto
    const ahora = new Date();
    const meses_es = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const mes_actual = meses_es[ahora.getMonth()];
    
    if (meses.includes(mes_actual)) {
        mesSelector.value = mes_actual;
        llenarDias(mes_actual);
        diaSelector.value = ahora.getDate().toString();
    }
}

// Llenar selector de días cuando se selecciona un mes
mesSelector.addEventListener('change', (e) => {
    const mes = e.target.value;
    if (mes) {
        llenarDias(mes);
    }
});

// Llenar selector de días
function llenarDias(mes) {
    if (!mareas_data || !mareas_data.meses[mes]) return;
    
    diaSelector.innerHTML = '<option value="">Seleccionar día...</option>';
    diaSelector.disabled = false;
    
    const dias = Object.keys(mareas_data.meses[mes].dias).sort((a, b) => parseInt(a) - parseInt(b));
    
    dias.forEach(dia => {
        const option = document.createElement('option');
        option.value = dia;
        option.textContent = `${dia} de ${mes}`;
        diaSelector.appendChild(option);
    });
    
    // Seleccionar día actual si es del mes actual
    const ahora = new Date();
    const meses_es = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    
    if (meses_es[ahora.getMonth()] === mes) {
        diaSelector.value = ahora.getDate().toString();
    }
}

// Mostrar datos cuando se selecciona un día
diaSelector.addEventListener('change', (e) => {
    const mes = mesSelector.value;
    const dia = e.target.value;
    
    if (mes && dia) {
        mostrarMareas(mes, dia);
    }
});

// Mostrar datos de hoy
function mostrarDatosHoy() {
    const ahora = new Date();
    const meses_es = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const mes = meses_es[ahora.getMonth()];
    const dia = ahora.getDate().toString();
    
    // Mostrar mareas de hoy
    mostrarMareas(mes, dia);
    
    // Mostrar próxima y última marea
    mostrarProximaYUltimaMarea(mes, dia, ahora);
}

// Mostrar mareas de un día específico
function mostrarMareas(mes, dia) {
    if (!mareas_data || !mareas_data.meses[mes]) return;
    
    const mareas = mareas_data.meses[mes].dias[dia];
    
    if (!mareas || mareas.length === 0) {
        tabulaBody.innerHTML = '<tr><td colspan="3" class="sin-datos">No hay datos de mareas para este día</td></tr>';
        return;
    }
    
    // Limpiar tabla
    tabulaBody.innerHTML = '';
    
    // Llenar tabla
    mareas.forEach(marea => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${marea.hora}</strong></td>
            <td>${marea.altura.toFixed(2)}</td>
            <td><span class="tipo-marea">${capitalizarTexto(marea.tipo)}</span></td>
        `;
        tabulaBody.appendChild(row);
    });
}

// Mostrar próxima y última marea
function mostrarProximaYUltimaMarea(mes, dia, fecha_actual) {
    if (!mareas_data || !mareas_data.meses[mes]) return;
    
    const mareas = mareas_data.meses[mes].dias[dia];
    
    if (!mareas || mareas.length === 0) return;
    
    const hora_actual = fecha_actual.getHours();
    const minuto_actual = fecha_actual.getMinutes();
    const tiempo_actual = hora_actual * 60 + minuto_actual;
    
    // Encontrar hora actual o más cercana
    let marea_actual = null;
    let indice_actual = -1;
    
    for (let i = 0; i < mareas.length; i++) {
        const [h, m] = mareas[i].hora.split(':').map(Number);
        const tiempo_marea = h * 60 + m;
        
        if (tiempo_marea <= tiempo_actual) {
            marea_actual = mareas[i];
            indice_actual = i;
        } else {
            break;
        }
    }
    
    // Si no hay marea actual (antes de la primera hora), tomar la primera
    if (!marea_actual && mareas.length > 0) {
        marea_actual = mareas[0];
        indice_actual = 0;
    }
    
    // Mostrar estado actual
    if (marea_actual) {
        horaActual.textContent = `${hora_actual.toString().padStart(2, '0')}:${minuto_actual.toString().padStart(2, '0')}`;
        alturaActual.textContent = `${marea_actual.altura.toFixed(2)} m`;
        
        const tipo = marea_actual.tipo.toLowerCase();
        let estado = '';
        let emoji = '';
        
        if (tipo === 'pleamar') {
            estado = '🔵 En Pleamar';
        } else if (tipo === 'bajamar') {
            estado = '🟢 En Bajamar';
        } else if (tipo === 'subiendo') {
            estado = '⬆️ Subiendo';
        } else if (tipo === 'bajando') {
            estado = '⬇️ Bajando';
        }
        
        estadoActual.textContent = estado;
    }
    
    // Buscar pleamares y bajamares previas y próximas
    let previa_pleamar = null;
    let proxima_pleamar = null;
    let previa_bajamar = null;
    let proxima_bajamar = null;
    
    // Buscar hacia atrás para pleamar y bajamar previas
    for (let i = indice_actual; i >= 0; i--) {
        if (!previa_pleamar && mareas[i].tipo === 'pleamar') {
            previa_pleamar = mareas[i];
        }
        if (!previa_bajamar && mareas[i].tipo === 'bajamar') {
            previa_bajamar = mareas[i];
        }
        if (previa_pleamar && previa_bajamar) break;
    }
    
    // Buscar hacia adelante para pleamar y bajamar próximas
    for (let i = indice_actual + 1; i < mareas.length; i++) {
        if (!proxima_pleamar && mareas[i].tipo === 'pleamar') {
            proxima_pleamar = mareas[i];
        }
        if (!proxima_bajamar && mareas[i].tipo === 'bajamar') {
            proxima_bajamar = mareas[i];
        }
        if (proxima_pleamar && proxima_bajamar) break;
    }
    
    // Mostrar pleamar previa
    if (previa_pleamar) {
        previaPleamarHora.textContent = previa_pleamar.hora;
        previaPleamarAltura.textContent = `${previa_pleamar.altura.toFixed(2)} m`;
    } else {
        previaPleamarHora.textContent = '--:--';
        previaPleamarAltura.textContent = '-- m';
    }
    
    // Mostrar próxima pleamar
    if (proxima_pleamar) {
        proximaPleamarHora.textContent = proxima_pleamar.hora;
        proximaPleamarAltura.textContent = `${proxima_pleamar.altura.toFixed(2)} m`;
    } else {
        proximaPleamarHora.textContent = '--:--';
        proximaPleamarAltura.textContent = '-- m';
    }
    
    // Mostrar bajamar previa
    if (previa_bajamar) {
        previaBajamarHora.textContent = previa_bajamar.hora;
        previaBajamarAltura.textContent = `${previa_bajamar.altura.toFixed(2)} m`;
    } else {
        previaBajamarHora.textContent = '--:--';
        previaBajamarAltura.textContent = '-- m';
    }
    
    // Mostrar próxima bajamar
    if (proxima_bajamar) {
        proximaBajamarHora.textContent = proxima_bajamar.hora;
        proximaBajamarAltura.textContent = `${proxima_bajamar.altura.toFixed(2)} m`;
    } else {
        proximaBajamarHora.textContent = '--:--';
        proximaBajamarAltura.textContent = '-- m';
    }
}

// Capitalizar texto
function capitalizarTexto(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// PWA: Detectar evento de instalación
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.removeAttribute('hidden');
});

// PWA: Manejar click en botón de instalación
installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Usuario respondió al prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.setAttribute('hidden', '');
    }
});

// PWA: Detectar cuando la app se instala
window.addEventListener('appinstalled', () => {
    console.log('App instalada exitosamente');
    installBtn.setAttribute('hidden', '');
});

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});