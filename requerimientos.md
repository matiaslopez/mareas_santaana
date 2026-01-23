# Web de mareas de Uruguay

Requerimientos del sistema.

- Debe publicarse una página web mobile y desktop que muestre las mareas del puerto de Santa Ana.
- La página deberá ofrecer la instalación en el dispositivo móvil como PWA (Progressive Web App).
- La página deberá ser sencilla, mostrar la última plea/bajamar y la próxima.
- Además deberá ofrecer en pequeño todas las medidas hora a hora.


Para la construcción deberá hacerse un script que extraiga la información del pdf que está en data. La información de las mareas está desde la página 3 en adelante, una página por mes. La información está tabulada en un cuadro que tiene las horas en las columnas y los días en las filas.

El script deberá generar un archivo JSON con la información de las mareas para que la página web pueda consumirla.

Los script necesarios deberán estar en Python en la carpeta scripts.

La web en la carpeta web, que será puesta pública en github pages, así que deberá ser estática, usando HTML, CSS y JavaScript y otras características que necesite github pages.