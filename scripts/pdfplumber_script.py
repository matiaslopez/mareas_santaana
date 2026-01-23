import pdfplumber
import pandas as pd
import re
from pathlib import Path

# PDF_PATH = "/mnt/data/TABLA_DE_MAREAS_2026_COLONIA.pdf"
PDF_PATH = "/home/matias/git/mareas_santaana/data/TABLA_DE_MAREAS_2026_COLONIA.pdf"

OUTPUT_DIR = Path("mareas_2026_pdfplumber")
OUTPUT_DIR.mkdir(exist_ok=True)

COLUMNS = ["DD"] + [str(h) for h in range(24)]

def extract_table_from_page(page):
    """
    Extrae filas válidas de una página usando texto posicional
    """
    rows = []

    # Ajustes clave: respetar layout
    text = page.extract_text(
        x_tolerance=1.5,
        y_tolerance=3,
        layout=True
    )

    if not text:
        return pd.DataFrame(columns=COLUMNS)

    for line in text.splitlines():
        # Normalizamos espacios
        line = re.sub(r"\s+", " ", line.strip())
        parts = line.split(" ")

        # Esperamos: DD + 24 valores
        if len(parts) == 25 and parts[0].isdigit():
            try:
                day = int(parts[0])
                values = list(map(int, parts[1:]))

                if 1 <= day <= 31:
                    rows.append([day] + values)
            except ValueError:
                continue

    return pd.DataFrame(rows, columns=COLUMNS)

all_months = []

with pdfplumber.open(PDF_PATH) as pdf:
    for page_idx in range(2, len(pdf.pages)):  # desde página 3
        page = pdf.pages[page_idx]

        df = extract_table_from_page(page)

        if df.empty:
            print(f"⚠️ Página {page_idx + 1}: sin tabla detectada")
            continue

        month_num = page_idx - 1
        out_csv = OUTPUT_DIR / f"mes_{month_num:02d}.csv"
        df.to_csv(out_csv, index=False)

        all_months.append(df)

if all_months:
    df_all = pd.concat(
        all_months,
        keys=[f"mes_{i:02d}" for i in range(1, len(all_months) + 1)],
        names=["mes", "fila"]
    )
    df_all.to_csv(OUTPUT_DIR / "mareas_2026_completo.csv")

print("✔ Extracción finalizada con pdfplumber")
