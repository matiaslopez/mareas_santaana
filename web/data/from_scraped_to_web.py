import csv
import json
from pathlib import Path
from datetime import datetime

# Leer datos de los CSV
csv_dir = Path('scripts/mareas_2026_pdfplumber')
output_path = Path('web/data/mareas.json')

meses_es = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

# Procesar cada mes
data_by_month = {}

for mes_num in range(1, 13):
    csv_file = csv_dir / f'mes_{mes_num:02d}.csv'
    
    if not csv_file.exists():
        continue
        
    mes_name = meses_es[mes_num - 1]
    month_data = {'nombre': mes_name, 'dias': {}}
    
    # Leer todos los datos del mes en una lista
    rows_list = []
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows_list.append(row)
    
    # Crear un array continuo con todas las alturas del mes
    todas_alturas = []
    for row in rows_list:
        alturas_dia = [int(row[str(h)]) for h in range(24)]
        todas_alturas.extend(alturas_dia)
    
    # Identificar máximos y mínimos locales en el continuo del mes
    # Manejo de mesetas (empates): el primer punto de una meseta que cambia de tendencia
    maximos_locales = set()
    minimos_locales = set()
    
    i = 0
    while i < len(todas_alturas):
        altura_actual = todas_alturas[i]
        
        # Buscar el final de una posible meseta (valores iguales consecutivos)
        j = i
        while j < len(todas_alturas) - 1 and todas_alturas[j + 1] == altura_actual:
            j += 1
        
        # Obtener altura anterior y siguiente a la meseta
        prev_altura = todas_alturas[i - 1] if i > 0 else None
        next_altura = todas_alturas[j + 1] if j < len(todas_alturas) - 1 else None
        
        # Determinar si es máximo o mínimo local
        if prev_altura is not None and next_altura is not None:
            # Caso general: comparar con ambos lados
            if altura_actual > prev_altura and altura_actual > next_altura:
                # Máximo local - marcar el primer punto de la meseta
                maximos_locales.add(i)
            elif altura_actual < prev_altura and altura_actual < next_altura:
                # Mínimo local - marcar el primer punto de la meseta
                minimos_locales.add(i)
        elif prev_altura is None and next_altura is not None:
            # Primera hora del mes
            if altura_actual > next_altura:
                maximos_locales.add(i)
            elif altura_actual < next_altura:
                minimos_locales.add(i)
        elif next_altura is None and prev_altura is not None:
            # Última hora del mes
            if altura_actual > prev_altura:
                maximos_locales.add(i)
            elif altura_actual < prev_altura:
                minimos_locales.add(i)
        
        # Avanzar al siguiente valor diferente
        i = j + 1
    
    # Asignar tipos a cada hora considerando el continuo temporal
    for dia_idx, row in enumerate(rows_list):
        day = row['DD']
        month_data['dias'][day] = []
        
        for hour in range(24):
            # Calcular índice global en el mes
            indice_global = dia_idx * 24 + hour
            
            altura_cm = todas_alturas[indice_global]
            altura_m = altura_cm / 100.0
            
            # Determinar tipo
            if indice_global in maximos_locales:
                tipo = 'pleamar'
            elif indice_global in minimos_locales:
                tipo = 'bajamar'
            else:
                # No es extremo local, determinar si está subiendo o bajando
                # Buscar el próximo extremo hacia adelante
                siguiente_es_maximo = None
                for i in range(indice_global + 1, len(todas_alturas)):
                    if i in maximos_locales:
                        siguiente_es_maximo = True
                        break
                    elif i in minimos_locales:
                        siguiente_es_maximo = False
                        break
                
                # Si no encontramos extremo hacia adelante, buscar hacia atrás
                if siguiente_es_maximo is None:
                    for i in range(indice_global - 1, -1, -1):
                        if i in maximos_locales:
                            siguiente_es_maximo = False  # Venimos de un máximo, vamos bajando
                            break
                        elif i in minimos_locales:
                            siguiente_es_maximo = True  # Venimos de un mínimo, vamos subiendo
                            break
                
                # Determinar tipo basado en la tendencia
                if siguiente_es_maximo:
                    tipo = 'subiendo'
                else:
                    tipo = 'bajando'
            
            month_data['dias'][day].append({
                'hora': f'{hour:02d}:00',
                'altura': round(altura_m, 2),
                'tipo': tipo
            })
    
    data_by_month[mes_name] = month_data

# Crear estructura final
final_data = {
    'puerto': 'Santa Ana, Colonia, Uruguay',
    'ano': 2026,
    'meses': data_by_month,
    'ultima_actualizacion': datetime.now().isoformat(),
    'formato': {
        'descripcion': 'Datos de mareas horarios',
        'tipo': 'pleamar (máximo nivel) o bajamar (mínimo nivel)',
        'altura': 'en metros'
    }
}

# Guardar JSON
output_path.parent.mkdir(parents=True, exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"✅ Datos convertidos: {len(data_by_month)} meses")
print(f"📁 Guardado en: {output_path}")
print(f"📊 Total días procesados: {sum(len(m['dias']) for m in data_by_month.values())}")
