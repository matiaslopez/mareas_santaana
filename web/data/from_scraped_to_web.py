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
            
            # Procesar cada hora (0-23)
            for hour in range(24):
                altura_cm = int(row[str(hour)])
                altura_m = altura_cm / 100.0
                
                # Determinar tipo basado en patrones
                # Analizar si es máximo o mínimo local
                prev_h = int(row[str(hour-1)]) if hour > 0 else altura_cm
                next_h = int(row[str(hour+1)]) if hour < 23 else altura_cm
                
                if altura_cm > prev_h and altura_cm > next_h:
                    tipo = 'pleamar'
                elif altura_cm < prev_h and altura_cm < next_h:
                    tipo = 'bajamar'
                else:
                    tipo = 'pleamar' if altura_cm > 80 else 'bajamar'
                
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
EOF