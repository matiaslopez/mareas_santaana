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
    
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            day = row['DD']
            month_data['dias'][day] = []
            
            # Obtener todas las alturas del día
            alturas = [int(row[str(h)]) for h in range(24)]
            
            # Identificar máximos y mínimos locales
            maximos_locales = set()
            minimos_locales = set()
            
            for hour in range(24):
                altura_cm = alturas[hour]
                
                # Comparar con vecinos (considerar límites del día)
                if hour == 0:
                    # Primera hora: comparar solo con la siguiente
                    if altura_cm > alturas[hour + 1]:
                        maximos_locales.add(hour)
                    elif altura_cm < alturas[hour + 1]:
                        minimos_locales.add(hour)
                elif hour == 23:
                    # Última hora: comparar solo con la anterior
                    if altura_cm > alturas[hour - 1]:
                        maximos_locales.add(hour)
                    elif altura_cm < alturas[hour - 1]:
                        minimos_locales.add(hour)
                else:
                    # Horas intermedias: comparar con ambos vecinos
                    prev_h = alturas[hour - 1]
                    next_h = alturas[hour + 1]
                    
                    if altura_cm > prev_h and altura_cm > next_h:
                        maximos_locales.add(hour)
                    elif altura_cm < prev_h and altura_cm < next_h:
                        minimos_locales.add(hour)
            
            # Determinar el tipo para cada hora
            for hour in range(24):
                altura_cm = alturas[hour]
                altura_m = altura_cm / 100.0
                
                # Determinar tipo
                if hour in maximos_locales:
                    tipo = 'pleamar'
                elif hour in minimos_locales:
                    tipo = 'bajamar'
                else:
                    # No es extremo local, determinar si está subiendo o bajando
                    # Buscar el próximo extremo hacia adelante
                    siguiente_es_maximo = None
                    for h in range(hour + 1, 24):
                        if h in maximos_locales:
                            siguiente_es_maximo = True
                            break
                        elif h in minimos_locales:
                            siguiente_es_maximo = False
                            break
                    
                    # Si no encontramos extremo hacia adelante, buscar hacia atrás
                    if siguiente_es_maximo is None:
                        for h in range(hour - 1, -1, -1):
                            if h in maximos_locales:
                                siguiente_es_maximo = False  # Venimos de un máximo, vamos bajando
                                break
                            elif h in minimos_locales:
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
