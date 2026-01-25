from pypdf import PdfReader
import pandas as pd
import re
from pathlib import Path

PDF_PATH = "/home/matias/git/mareas_santaana/data/TABLA_DE_MAREAS_2026_COLONIA.pdf"
OUTPUT_DIR = Path("mareas_2026_pypdf")
OUTPUT_DIR.mkdir(exist_ok=True)

reader = PdfReader(PDF_PATH)

# Columnas esperadas
columns = ["DD"] + [str(h) for h in range(24)]

def parse_table_from_text(text):
    rows = []
    lines = text.splitlines()

    for line in lines:
        # Línea típica:
        # 1 64 80 94 103 ... 41
        parts = re.split(r"\s+", line.strip())

        if len(parts) == 25 and parts[0].isdigit():
            try:
                day = int(parts[0])
                values = list(map(int, parts[1:]))
                rows.append([day] + values)
            except ValueError:
                pass

    return pd.DataFrame(rows, columns=columns)

all_months = []

# Página 3 en adelante (índice base 0 → página 3 es índice 2)
for page_idx in range(2, len(reader.pages)):
    page = reader.pages[page_idx]
    text = page.extract_text()

    if not text:
        continue

    df = parse_table_from_text(text)

    if df.empty:
        print(f"⚠️ Página {page_idx + 1}: no se detectó tabla")
        continue

    # Guardar CSV por mes
    month_num = page_idx - 1
    out_csv = OUTPUT_DIR / f"mes_{month_num:02d}.csv"
    df.to_csv(out_csv, index=False)

    all_months.append(df)

# CSV completo
if all_months:
    df_all = pd.concat(
        all_months,
        keys=[f"mes_{i:02d}" for i in range(1, len(all_months) + 1)],
        names=["mes", "fila"]
    )
    df_all.to_csv(OUTPUT_DIR / "mareas_2026_completo.csv")

print("✔ Extracción finalizada con pypdf")
