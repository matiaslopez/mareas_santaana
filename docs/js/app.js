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
let mareaSChart = null;

// Elementos del DOM
const mesSelector = document.getElementById('mesSelector');
const diaSelector = document.getElementById('diaSelector');
const tabulaBody = document.getElementById('tabulaBody');
const installBtn = document.getElementById('installBtn');
const estadoActual = document.getElementById('estadoActual');
const horaActual = document.getElementById('horaActual');
const alturaActual = document.getElementById('alturaActual');
const pasadoCercanoLabel = document.getElementById('pasadoCercanoLabel');
const pasadoCercanoHora = document.getElementById('pasadoCercanoHora');
const pasadoCercanoAltura = document.getElementById('pasadoCercanoAltura');
const pasadoLejanoLabel = document.getElementById('pasadoLejanoLabel');
const pasadoLejanoHora = document.getElementById('pasadoLejanoHora');
const pasadoLejanoAltura = document.getElementById('pasadoLejanoAltura');
const futuroCercanoLabel = document.getElementById('futuroCercanoLabel');
const futuroCercanoHora = document.getElementById('futuroCercanoHora');
const futuroCercanoAltura = document.getElementById('futuroCercanoAltura');
const futuroLejanoLabel = document.getElementById('futuroLejanoLabel');
const futuroLejanoHora = document.getElementById('futuroLejanoHora');
const futuroLejanoAltura = document.getElementById('futuroLejanoAltura');
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
    
    // Mostrar mareas de hoy (pasando la hora actual para reorganizar)
    mostrarMareas(mes, dia, ahora);
    
    // Mostrar próxima y última marea
    mostrarProximaYUltimaMarea(mes, dia, ahora);
    
    // Generar gráfico de mareas
    generarGraficoMareas(mes, dia, ahora);
}

// Mostrar mareas de un día específico
function mostrarMareas(mes, dia, hora_actual = null) {
    if (!mareas_data || !mareas_data.meses[mes]) return;
    
    const mareas = mareas_data.meses[mes].dias[dia];
    
    if (!mareas || mareas.length === 0) {
        tabulaBody.innerHTML = '<tr><td colspan="3" class="sin-datos">No hay datos de mareas para este día</td></tr>';
        return;
    }
    
    // Limpiar tabla
    tabulaBody.innerHTML = '';
    
    // Si es el día actual, reorganizar para mostrar desde 3 horas antes
    let mareas_ordenadas = [...mareas];
    let indice_actual = -1;
    
    if (hora_actual !== null) {
        // Encontrar índice de hora actual
        const ahora = new Date();
        const hora = ahora.getHours();
        
        indice_actual = hora;
        
        // Reorganizar: empezar desde 3 horas antes, o desde el inicio si no hay suficientes
        const inicio = Math.max(0, indice_actual - 3);
        mareas_ordenadas = [
            ...mareas.slice(inicio, indice_actual + 1), // Últimas 3 + hora actual
            ...mareas.slice(indice_actual + 1)          // Resto del día actual
        ];
        
        // Calcular cuántas horas faltan para completar la vista
        const horas_mostradas = mareas_ordenadas.length;
        const horas_faltantes = 24 - horas_mostradas;
        
        if (horas_faltantes > 0) {
            // Si faltaban horas al inicio del día (inicio > 0), agregar del inicio del día
            if (inicio > 0) {
                const horas_inicio = Math.min(inicio, horas_faltantes);
                mareas_ordenadas = [...mareas_ordenadas, ...mareas.slice(0, horas_inicio)];
            }
            
            // Si aún faltan horas, buscar en el día siguiente
            const horas_aun_faltantes = 24 - mareas_ordenadas.length;
            if (horas_aun_faltantes > 0) {
                const dia_siguiente = obtenerDiaSiguiente(mes, dia);
                if (dia_siguiente) {
                    const mareas_manana = mareas_data.meses[dia_siguiente.mes].dias[dia_siguiente.dia];
                    if (mareas_manana) {
                        const horas_del_siguiente = mareas_manana.slice(0, horas_aun_faltantes);
                        mareas_ordenadas = [...mareas_ordenadas, ...horas_del_siguiente];
                    }
                }
            }
        }
    }
    
    // Llenar tabla
    mareas_ordenadas.forEach((marea, idx) => {
        const row = document.createElement('tr');
        
        // Determinar si es la hora actual
        const es_hora_actual = hora_actual !== null && marea.hora === `${hora_actual.getHours().toString().padStart(2, '0')}:00`;
        
        if (es_hora_actual) {
            row.className = 'hora-actual';
        }
        
        row.innerHTML = `
            <td><strong>${marea.hora}</strong></td>
            <td>${marea.altura.toFixed(2)}</td>
            <td><span class="tipo-marea">${capitalizarTexto(marea.tipo)}</span></td>
        `;
        tabulaBody.appendChild(row);
    });
}

// Obtener día siguiente
function obtenerDiaSiguiente(mes, dia) {
    const meses_es = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    
    const dias_del_mes = mareas_data.meses[mes] ? Object.keys(mareas_data.meses[mes].dias).map(d => parseInt(d)) : [];
    const dia_num = parseInt(dia);
    
    // Buscar el siguiente día en el mismo mes
    const siguiente_dia = dias_del_mes.find(d => d > dia_num);
    if (siguiente_dia) {
        return { mes: mes, dia: siguiente_dia.toString() };
    }
    
    // Si no hay más días en este mes, buscar en el siguiente mes
    const mes_idx = meses_es.indexOf(mes);
    if (mes_idx < 11) {
        const siguiente_mes = meses_es[mes_idx + 1];
        if (mareas_data.meses[siguiente_mes]) {
            const primer_dia = Math.min(...Object.keys(mareas_data.meses[siguiente_mes].dias).map(d => parseInt(d)));
            return { mes: siguiente_mes, dia: primer_dia.toString() };
        }
    }
    
    return null;
}

// Obtener día anterior
function obtenerDiaAnterior(mes, dia) {
    const meses_es = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    
    const dias_del_mes = mareas_data.meses[mes] ? Object.keys(mareas_data.meses[mes].dias).map(d => parseInt(d)) : [];
    const dia_num = parseInt(dia);
    
    // Buscar el día anterior en el mismo mes
    const dias_anteriores = dias_del_mes.filter(d => d < dia_num);
    if (dias_anteriores.length > 0) {
        const anterior_dia = Math.max(...dias_anteriores);
        return { mes: mes, dia: anterior_dia.toString() };
    }
    
    // Si no hay días anteriores en este mes, buscar en el mes anterior
    const mes_idx = meses_es.indexOf(mes);
    if (mes_idx > 0) {
        const anterior_mes = meses_es[mes_idx - 1];
        if (mareas_data.meses[anterior_mes]) {
            const ultimo_dia = Math.max(...Object.keys(mareas_data.meses[anterior_mes].dias).map(d => parseInt(d)));
            return { mes: anterior_mes, dia: ultimo_dia.toString() };
        }
    }
    
    return null;
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
    
    // Encontrar eventos pasados y futuros (pleamares y bajamares)
    let eventos_pasados = [];
    let eventos_futuros = [];
    
    // Buscar hacia atrás para eventos pasados (en el día actual)
    for (let i = indice_actual; i >= 0; i--) {
        if (mareas[i].tipo === 'pleamar' || mareas[i].tipo === 'bajamar') {
            eventos_pasados.push(mareas[i]);
            if (eventos_pasados.length >= 2) break;
        }
    }
    
    // Si no hay suficientes eventos pasados, buscar en el día anterior
    if (eventos_pasados.length < 2) {
        const dia_anterior = obtenerDiaAnterior(mes, dia);
        if (dia_anterior) {
            const mareas_ayer = mareas_data.meses[dia_anterior.mes].dias[dia_anterior.dia];
            if (mareas_ayer) {
                for (let i = mareas_ayer.length - 1; i >= 0; i--) {
                    if (mareas_ayer[i].tipo === 'pleamar' || mareas_ayer[i].tipo === 'bajamar') {
                        const evento_con_fecha = { ...mareas_ayer[i], fecha: `${dia_anterior.dia}/${dia_anterior.mes}` };
                        eventos_pasados.push(evento_con_fecha);
                        if (eventos_pasados.length >= 2) break;
                    }
                }
            }
        }
    }
    
    // Buscar hacia adelante para eventos futuros (en el día actual)
    for (let i = indice_actual + 1; i < mareas.length; i++) {
        if (mareas[i].tipo === 'pleamar' || mareas[i].tipo === 'bajamar') {
            eventos_futuros.push(mareas[i]);
            if (eventos_futuros.length >= 2) break;
        }
    }
    
    // Si no hay suficientes eventos futuros, buscar en el día siguiente
    if (eventos_futuros.length < 2) {
        const dia_siguiente = obtenerDiaSiguiente(mes, dia);
        if (dia_siguiente) {
            const mareas_manana = mareas_data.meses[dia_siguiente.mes].dias[dia_siguiente.dia];
            if (mareas_manana) {
                for (let i = 0; i < mareas_manana.length; i++) {
                    if (mareas_manana[i].tipo === 'pleamar' || mareas_manana[i].tipo === 'bajamar') {
                        const evento_con_fecha = { ...mareas_manana[i], fecha: `${dia_siguiente.dia}/${dia_siguiente.mes}` };
                        eventos_futuros.push(evento_con_fecha);
                        if (eventos_futuros.length >= 2) break;
                    }
                }
            }
        }
    }
    
    // Mostrar eventos pasados (el más reciente primero, luego el anterior)
    if (eventos_pasados.length > 0) {
        const cercano = eventos_pasados[0];
        pasadoCercanoLabel.textContent = cercano.tipo === 'pleamar' ? '🔵 Pleamar' : '🟢 Bajamar';
        pasadoCercanoHora.textContent = cercano.hora;
        pasadoCercanoAltura.textContent = `${cercano.altura.toFixed(2)} m`;
        
        if (eventos_pasados.length > 1) {
            const lejano = eventos_pasados[1];
            pasadoLejanoLabel.textContent = lejano.tipo === 'pleamar' ? '🔵 Pleamar' : '🟢 Bajamar';
            pasadoLejanoHora.textContent = lejano.hora;
            pasadoLejanoAltura.textContent = `${lejano.altura.toFixed(2)} m`;
        } else {
            pasadoLejanoLabel.textContent = '--';
            pasadoLejanoHora.textContent = '--:--';
            pasadoLejanoAltura.textContent = '-- m';
        }
    } else {
        pasadoCercanoLabel.textContent = '--';
        pasadoCercanoHora.textContent = '--:--';
        pasadoCercanoAltura.textContent = '-- m';
        pasadoLejanoLabel.textContent = '--';
        pasadoLejanoHora.textContent = '--:--';
        pasadoLejanoAltura.textContent = '-- m';
    }
    
    // Mostrar eventos futuros (el próximo primero, luego el siguiente)
    if (eventos_futuros.length > 0) {
        const cercano = eventos_futuros[0];
        futuroCercanoLabel.textContent = cercano.tipo === 'pleamar' ? '🔵 Pleamar' : '🟢 Bajamar';
        futuroCercanoHora.textContent = cercano.hora;
        futuroCercanoAltura.textContent = `${cercano.altura.toFixed(2)} m`;
        
        if (eventos_futuros.length > 1) {
            const lejano = eventos_futuros[1];
            futuroLejanoLabel.textContent = lejano.tipo === 'pleamar' ? '🔵 Pleamar' : '🟢 Bajamar';
            futuroLejanoHora.textContent = lejano.hora;
            futuroLejanoAltura.textContent = `${lejano.altura.toFixed(2)} m`;
        } else {
            futuroLejanoLabel.textContent = '--';
            futuroLejanoHora.textContent = '--:--';
            futuroLejanoAltura.textContent = '-- m';
        }
    } else {
        futuroCercanoLabel.textContent = '--';
        futuroCercanoHora.textContent = '--:--';
        futuroCercanoAltura.textContent = '-- m';
        futuroLejanoLabel.textContent = '--';
        futuroLejanoHora.textContent = '--:--';
        futuroLejanoAltura.textContent = '-- m';
    }
}

// Generar gráfico de mareas
function generarGraficoMareas(mes, dia, fecha_actual) {
    if (!mareas_data || !mareas_data.meses[mes]) return;
    
    const mareas_hoy = mareas_data.meses[mes].dias[dia];
    if (!mareas_hoy || mareas_hoy.length === 0) return;
    
    const hora_actual = fecha_actual.getHours();
    
    // Recopilar datos de 8 horas atrás y 8 horas adelante
    let datos_grafico = [];
    
    // Calcular rango de horas
    const hora_inicio = hora_actual - 8;
    const hora_fin = hora_actual + 8;
    
    // Agregar datos del día anterior si es necesario
    if (hora_inicio < 0) {
        const dia_anterior = obtenerDiaAnterior(mes, dia);
        if (dia_anterior) {
            const mareas_ayer = mareas_data.meses[dia_anterior.mes].dias[dia_anterior.dia];
            if (mareas_ayer) {
                for (let h = 24 + hora_inicio; h < 24; h++) {
                    if (mareas_ayer[h]) {
                        datos_grafico.push({
                            hora: mareas_ayer[h].hora,
                            altura: mareas_ayer[h].altura,
                            tipo: mareas_ayer[h].tipo
                        });
                    }
                }
            }
        }
    }
    
    // Agregar datos del día actual
    const inicio_hoy = Math.max(0, hora_inicio);
    const fin_hoy = Math.min(23, hora_fin);
    
    for (let h = inicio_hoy; h <= fin_hoy; h++) {
        if (mareas_hoy[h]) {
            datos_grafico.push({
                hora: mareas_hoy[h].hora,
                altura: mareas_hoy[h].altura,
                tipo: mareas_hoy[h].tipo
            });
        }
    }
    
    // Agregar datos del día siguiente si es necesario
    if (hora_fin > 23) {
        const dia_siguiente = obtenerDiaSiguiente(mes, dia);
        if (dia_siguiente) {
            const mareas_manana = mareas_data.meses[dia_siguiente.mes].dias[dia_siguiente.dia];
            if (mareas_manana) {
                for (let h = 0; h < hora_fin - 23; h++) {
                    if (mareas_manana[h]) {
                        datos_grafico.push({
                            hora: mareas_manana[h].hora,
                            altura: mareas_manana[h].altura,
                            tipo: mareas_manana[h].tipo
                        });
                    }
                }
            }
        }
    }
    
    // Extraer etiquetas y valores
    const etiquetas = datos_grafico.map(d => d.hora);
    const alturas = datos_grafico.map(d => d.altura);
    
    // Identificar puntos de pleamar y bajamar
    const puntos_pleamar = [];
    const puntos_bajamar = [];
    
    // Calcular posición exacta de la hora actual en el gráfico (con minutos)
    const minuto_actual = fecha_actual.getMinutes();
    const hora_actual_str = `${hora_actual.toString().padStart(2, '0')}:00`;
    let indice_hora_actual = datos_grafico.findIndex(d => d.hora === hora_actual_str);
    
    // Si no se encontró la hora exacta, buscar la más cercana
    if (indice_hora_actual === -1 && datos_grafico.length > 0) {
        indice_hora_actual = Math.floor(datos_grafico.length / 2); // Centro del gráfico como fallback
    }
    
    // Calcular posición exacta interpolando los minutos
    // Si son las 13:54, la línea debe estar a 54/60 = 0.9 entre el índice 13:00 y 14:00
    const posicion_exacta = indice_hora_actual + (minuto_actual / 60);
    
    datos_grafico.forEach((dato, idx) => {
        if (dato.tipo === 'pleamar') {
            puntos_pleamar.push({ x: idx, y: dato.altura });
        } else if (dato.tipo === 'bajamar') {
            puntos_bajamar.push({ x: idx, y: dato.altura });
        }
    });
    
    // Destruir gráfico anterior si existe
    if (mareaSChart) {
        mareaSChart.destroy();
    }
    
    // Crear nuevo gráfico
    const ctx = document.getElementById('mareaSChart');
    if (!ctx) return;
    
    // Registrar plugins
    Chart.register(ChartDataLabels);
    if (typeof window.ChartAnnotation !== 'undefined') {
        Chart.register(window.ChartAnnotation);
    }
    
    mareaSChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: 'Altura de Marea (m)',
                    data: alturas,
                    borderColor: '#1a4d7a',
                    backgroundColor: 'rgba(26, 77, 122, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#1a4d7a'
                },
                {
                    label: 'Pleamar',
                    data: puntos_pleamar.map(p => ({ x: etiquetas[p.x], y: p.y })),
                    borderColor: 'transparent',
                    backgroundColor: '#2196F3',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    pointStyle: 'circle',
                    showLine: false,
                    datalabels: {
                        display: true
                    }
                },
                {
                    label: 'Bajamar',
                    data: puntos_bajamar.map(p => ({ x: etiquetas[p.x], y: p.y })),
                    borderColor: 'transparent',
                    backgroundColor: '#4CAF50',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    pointStyle: 'circle',
                    showLine: false,
                    datalabels: {
                        display: true
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Altura de Marea (m)') {
                                return `Altura: ${context.parsed.y.toFixed(2)} m`;
                            }
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} m`;
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        // Mostrar etiquetas solo para pleamar y bajamar
                        return context.datasetIndex === 1 || context.datasetIndex === 2;
                    },
                    formatter: function(value, context) {
                        if (context.datasetIndex === 1 || context.datasetIndex === 2) {
                            const hora = value.x;
                            const altura = value.y.toFixed(2);
                            return `${hora}\n${altura}m`;
                        }
                        return '';
                    },
                    color: function(context) {
                        return context.datasetIndex === 1 ? '#1976D2' : '#388E3C';
                    },
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    align: 'top',
                    offset: 8,
                    textAlign: 'center'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Hora',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Altura (m)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    beginAtZero: false,
                    grace: '10%'
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Altura de Marea (m)') {
                                return `Altura: ${context.parsed.y.toFixed(2)} m`;
                            }
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} m`;
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        // Mostrar etiquetas solo para pleamar y bajamar
                        return context.datasetIndex === 1 || context.datasetIndex === 2;
                    },
                    formatter: function(value, context) {
                        if (context.datasetIndex === 1 || context.datasetIndex === 2) {
                            const hora = value.x;
                            const altura = value.y.toFixed(2);
                            return `${hora}\n${altura}m`;
                        }
                        return '';
                    },
                    color: function(context) {
                        return context.datasetIndex === 1 ? '#1976D2' : '#388E3C';
                    },
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    align: 'top',
                    offset: 8,
                    textAlign: 'center'
                },
                annotation: indice_hora_actual >= 0 ? {
                    annotations: {
                        horaActualLine: {
                            type: 'line',
                            xMin: posicion_exacta,
                            xMax: posicion_exacta,
                            borderColor: '#ff6b6b',
                            borderWidth: 3,
                            borderDash: [5, 5],
                            label: {
                                display: window.innerWidth > 768,
                                content: `${hora_actual.toString().padStart(2, '0')}:${minuto_actual.toString().padStart(2, '0')}`,
                                position: 'center',
                                backgroundColor: '#ff6b6b',
                                color: 'white',
                                font: {
                                    weight: 'bold',
                                    size: 10
                                },
                                padding: 4
                            }
                        }
                    }
                } : undefined
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
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

// Función para calcular milisegundos hasta el próximo intervalo de 15 minutos
function calcularProximaActualizacion() {
    const ahora = new Date();
    const minutos = ahora.getMinutes();
    const segundos = ahora.getSeconds();
    const milisegundos = ahora.getMilliseconds();
    
    // Calcular minutos hasta el próximo cuarto de hora (0, 15, 30, 45)
    const minutosHastaProximo = 15 - (minutos % 15);
    
    // Convertir a milisegundos total
    const msHastaProximo = (minutosHastaProximo * 60 - segundos) * 1000 - milisegundos;
    
    return msHastaProximo;
}

// Función para programar la próxima actualización
function programarActualizacion() {
    const msHastaProximo = calcularProximaActualizacion();
    
    console.log(`Próxima actualización en ${Math.round(msHastaProximo / 1000)} segundos`);
    
    setTimeout(() => {
        console.log('Actualizando vista...');
        mostrarDatosHoy();
        
        // Programar la siguiente actualización (cada 15 minutos)
        setInterval(() => {
            console.log('Actualizando vista...');
            mostrarDatosHoy();
        }, 15 * 60 * 1000); // 15 minutos
    }, msHastaProximo);
}

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    
    // Programar actualizaciones automáticas cada 15 minutos
    programarActualizacion();
});
