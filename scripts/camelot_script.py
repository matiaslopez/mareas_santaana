import camelot
import pandas as pd
from pathlib import Path

PDF_PATH = "/home/matias/git/mareas_santaana/data/TABLA_DE_MAREAS_2026_COLONIA.pdf"
OUTPUT_DIR = Path("mareas_2026")
OUTPUT_DIR.mkdir(exist_ok=True)

# Extraemos desde la página 3 hasta el final
tables = camelot.read_pdf(
    PDF_PATH,
    pages="3",
    # pages="3-end",
    flavor="lattice"   # importante para tablas con grilla
)

print(f"Tablas detectadas: {len(tables)}")

dfs = []

for i, table in enumerate(tables, start=1):
    print(i)
    df = table.df

    # Limpieza básica
    df = df.rename(columns=df.iloc[0]).drop(df.index[0])
    df = df.reset_index(drop=True)

    # Guardar una tabla por mes
    out_csv = OUTPUT_DIR / f"mes_{i:02d}.csv"
    df.to_csv(out_csv, index=False)

    dfs.append(df)

print(f"Van {len(dfs)} meses extraídos y guardados en {OUTPUT_DIR}")

# Opcional: un solo DataFrame con todos los meses
df_all = pd.concat(
    dfs,
    keys=[f"mes_{i:02d}" for i in range(1, len(dfs) + 1)],
    names=["mes", "fila"]
)

df_all.to_csv(OUTPUT_DIR / "mareas_2026_completo.csv")

print("Extracción finalizada.")
