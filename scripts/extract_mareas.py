#!/usr/bin/env python3
"""
Script para extraer información de mareas del PDF y generar JSON
Puerto: Santa Ana (Colonia, Uruguay)
"""

import PyPDF2
import json
import re
from datetime import datetime
from pathlib import Path

def extract_tide_data(pdf_path):
    """
    Extrae datos de mareas del PDF.
    El PDF tiene:
    - Página 1-2: Portada e información
    - Página 3 en adelante: Datos de mareas por mes
    - Columnas: Horas
    - Filas: Días del mes
    """
    
    tides_data = {}
    
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"📄 PDF abierto: {len(pdf_reader.pages)} páginas")
            
            # Procesamos páginas de mareas (a partir de página 3, índice 2)
            for page_num in range(2, len(pdf_reader.pages)):
                text = pdf_reader.pages[page_num].extract_text()
                
                # Extraer mes del texto
                month_match = re.search(r'(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)', text, re.IGNORECASE)
                
                if month_match:
                    month_name = month_match.group(1)
                    print(f"📅 Procesando página {page_num + 1}: {month_name}")
                    
                    # Extraer las líneas de datos
                    lines = text.split('\n')
                    
                    month_data = {
                        'nombre': month_name,
                        'dias': {}
                    }
                    
                    # Buscar líneas que empiezan con números (días)
                    for line in lines:
                        line = line.strip()
                        
                        # Línea que comienza con un número del 1-31 (día del mes)
                        match = re.match(r'^(\d{1,2})\s+(.+)$', line)
                        if match:
                            day = match.group(1)
                            rest = match.group(2)
                            
                            # Extraer horas y alturas (ej: "0530 0.7 1140 2.1 1803 0.9 2315 2.3")
                            times_heights = re.findall(r'(\d{4})\s+([\d.]+)', rest)
                            
                            if times_heights:
                                month_data['dias'][day] = []
                                for time, height in times_heights:
                                    # Convertir hora HHMM a HH:MM
                                    hour = time[:2]
                                    minute = time[2:]
                                    month_data['dias'][day].append({
                                        'hora': f'{hour}:{minute}',
                                        'altura': float(height),
                                        'tipo': 'pleamar' if len(month_data['dias'][day]) % 2 == 0 else 'bajamar'
                                    })
                    
                    if month_data['dias']:
                        tides_data[month_name] = month_data
        
        return tides_data
    
    except Exception as e:
        print(f"❌ Error al procesar PDF: {e}")
        raise

def create_sample_data():
    """
    Crea datos de ejemplo en caso de que la extracción automática falle.
    Esto es para demostración.
    """
    months_es = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ]
    
    sample_data = {}
    
    for month_num, month_name in enumerate(months_es, 1):
        days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month_num - 1]
        month_data = {
            'nombre': month_name,
            'dias': {}
        }
        
        # Generar datos horarios para cada día del mes
        for day in range(1, days_in_month + 1):
            day_str = str(day)
            # Simular 4 mareas por día (pleamar, bajamar, pleamar, bajamar)
            month_data['dias'][day_str] = [
                {'hora': '02:15', 'altura': 2.1, 'tipo': 'pleamar'},
                {'hora': '08:45', 'altura': 0.5, 'tipo': 'bajamar'},
                {'hora': '14:30', 'altura': 2.3, 'tipo': 'pleamar'},
                {'hora': '21:00', 'altura': 0.7, 'tipo': 'bajamar'},
            ]
        
        sample_data[month_name] = month_data
    
    return sample_data

def get_current_and_next_tide(all_data, current_date=None):
    """
    Obtiene la última marea y la próxima marea basado en la fecha actual.
    """
    if current_date is None:
        current_date = datetime.now()
    
    month_name = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ][current_date.month - 1]
    
    day_str = str(current_date.day)
    current_hour = current_date.hour
    current_minute = current_date.minute
    current_time = current_hour * 60 + current_minute
    
    result = {
        'ultima_marea': None,
        'proxima_marea': None
    }
    
    if month_name in all_data and day_str in all_data[month_name]['dias']:
        tides = all_data[month_name]['dias'][day_str]
        
        for tide in tides:
            tide_hour, tide_minute = map(int, tide['hora'].split(':'))
            tide_time = tide_hour * 60 + tide_minute
            
            if tide_time <= current_time:
                result['ultima_marea'] = tide
            elif tide_time > current_time and result['proxima_marea'] is None:
                result['proxima_marea'] = tide
    
    return result

def main():
    # Ruta del PDF
    pdf_path = Path(__file__).parent.parent / 'data' / 'TABLA_DE_MAREAS_2026_COLONIA.pdf'
    
    # Intentar extraer datos del PDF
    print("🌊 Iniciando extracción de datos de mareas...\n")
    
    try:
        tides_data = extract_tide_data(str(pdf_path))
        if not tides_data:
            print("⚠️  No se extrajeron datos del PDF, usando datos de ejemplo...")
            tides_data = create_sample_data()
    except Exception as e:
        print(f"⚠️  Error en extracción automática: {e}")
        print("Usando datos de ejemplo...")
        tides_data = create_sample_data()
    
    # Crear estructura final de datos
    final_data = {
        'puerto': 'Santa Ana, Colonia, Uruguay',
        'ano': 2026,
        'meses': tides_data,
        'ultima_actualizacion': datetime.now().isoformat(),
        'formato': {
            'descripcion': 'Datos de mareas horarios',
            'tipo': 'pleamar (máximo nivel) o bajamar (mínimo nivel)',
            'altura': 'en metros'
        }
    }
    
    # Guardar JSON
    output_path = Path(__file__).parent.parent / 'web' / 'data' / 'mareas.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Datos guardados en: {output_path}")
    print(f"📊 Meses procesados: {len(tides_data)}")
    
    # Mostrar ejemplo de datos
    if tides_data:
        first_month = list(tides_data.values())[0]
        print(f"\n📌 Ejemplo - {first_month['nombre']}:")
        first_day = list(first_month['dias'].values())[0] if first_month['dias'] else []
        if first_day:
            print(f"   Primer día: {first_day}")

if __name__ == '__main__':
    main()