# 🌊 Mareas Santa Ana

Sistema web para consultar las mareas del puerto de Santa Ana, Colonia, Uruguay.

## Características

- 📱 **PWA (Progressive Web App)**: Instalable como app nativa en móviles
- 🌐 **Responsive Design**: Compatible con desktop y móvil
- 🔄 **Offline First**: Funciona sin conexión usando Service Worker
- ⚡ **Rápido y Ligero**: Estático, compatible con GitHub Pages
- 📊 **Datos Horarios**: Información completa de mareas hora a hora

## Estructura del Proyecto

```
.
├── scripts/
│   └── extract_mareas.py      # Script Python para extraer datos del PDF
├── web/
│   ├── index.html              # Página principal
│   ├── manifest.json           # Configuración PWA
│   ├── sw.js                   # Service Worker
│   ├── css/
│   │   └── styles.css          # Estilos
│   ├── js/
│   │   └── app.js              # Lógica principal
│   ├── data/
│   │   └── mareas.json         # Datos de mareas (generado)
│   └── img/
│       └── icon.svg            # Ícono SVG
├── data/
│   └── TABLA_DE_MAREAS_2026_COLONIA.pdf  # PDF con datos originales
└── requerimientos.md           # Requerimientos del sistema
```

## Instalación

### Requisitos

- Python 3.6+
- pip
- npm (opcional, para desarrollo local)

### Setup

1. **Instalar dependencias Python:**

```bash
pip install PyPDF2 Pillow
```

2. **Generar datos de mareas:**

```bash
python scripts/extract_mareas.py
```

Esto creará el archivo `web/data/mareas.json` con todos los datos de mareas.

## Desarrollo Local

### Servir localmente

```bash
# Con Python 3
python -m http.server 8000 --directory web

# O con Node.js
npx http-server web
```

Luego abre `http://localhost:8000` en tu navegador.

## Despliegue en GitHub Pages

### Pasos

1. Asegúrate que `web/` contiene todos los archivos compilados
2. Configura GitHub Pages para servir desde la rama `main`/`master` carpeta `web`
3. La URL será: `https://usuario.github.io/mareas_santaana/`

### Configuración especial

Para que funcione correctamente en GitHub Pages, verifica:

- El archivo `manifest.json` tiene `"start_url": "/index.html"`
- El archivo `sw.js` usa rutas relativas correctas
- Los archivos están en la carpeta `web/`

## Datos de Mareas

### Formato JSON

```json
{
  "puerto": "Santa Ana, Colonia, Uruguay",
  "ano": 2026,
  "meses": {
    "ENERO": {
      "nombre": "ENERO",
      "dias": {
        "1": [
          {
            "hora": "02:15",
            "altura": 2.1,
            "tipo": "pleamar"
          },
          ...
        ]
      }
    }
  }
}
```

### Actualizar datos

Para actualizar los datos de mareas desde un nuevo PDF:

1. Reemplaza el PDF en `data/TABLA_DE_MAREAS_2026_COLONIA.pdf`
2. Ejecuta: `python scripts/extract_mareas.py`
3. Verifica que se generó correctamente: `web/data/mareas.json`
4. Deploy

## Funcionalidades de PWA

### Instalación

- Botón "⬇️ Instalar App" visible en navegadores compatibles
- Se puede instalar en móvil como app nativa
- Accesibilidad desde homescreen

### Offline

- Service Worker cachea la aplicación
- Funciona sin conexión después de la primera carga
- Sincronización automática cuando hay conexión

### Performance

- Assets cacheados para carga rápida
- Estrategia "cache first" con fallback a red
- Compresión automática de contenido

## Navegadores Soportados

- ✅ Chrome 51+
- ✅ Firefox 50+
- ✅ Safari 15+
- ✅ Edge 79+
- ✅ Android Browser

## Problemas Comunes

### El sitio no se instala en móvil

- Verifica que está servido por HTTPS (o localhost)
- Comprueba que `manifest.json` es válido
- Revisa la consola del navegador

### Los datos de mareas no cargan

- Verifica que `web/data/mareas.json` existe
- Comprueba que el servidor CORS está configurado
- Revisa la consola para errores

### Service Worker no funciona

- Limpiar caché: DevTools → Application → Clear storage
- Verificar que `sw.js` está en la raíz
- Revisar logs en DevTools → Application → Service Workers

## Licencia

Este proyecto está disponible bajo licencia MIT.

## Contacto

Para reportes de bugs o sugerencias, abre un issue en GitHub.

---

**Última actualización:** 2026
**Desarrollado por:** Matías López