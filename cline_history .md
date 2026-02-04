# Historial de cline

Este proyecto fue únicamente codeado por IAs, acá van los prompts pasado a cline:


1. `Hola, en la carpeta actual se encuentra los requerimientos del sistema que quiero hacer, en el archivo @/requerimientos.md, ¿lo podrás hacer?`
1. _Como no hacía nada ChatGPT me dijo que ponga_:
   
   `Usá las herramientas de escritura de archivos.
   No describas lo que vas a hacer.
   Creá el archivo web/manifest.json y escribilo en el filesystem.
   Si necesitás confirmación, pedila.`

1. `En el directorio @/scripts/mareas_2026_pdfplumber están la data parseada. Adaptá la página para que de la última plea/baja y la próxima, además de que se vea pequeño el avance hora por hora. Mové los datos a donde creas conveniente.`

1. `En el directorio @/scripts/mareas_2026_pdfplumber están la data parseada. Adaptá la página para que de la última plea/baja y la próxima, además de que se vea pequeño el avance hora por hora. Mové los datos a donde creas conveniente.`

1. _Nuevo hilo_:

   `Quiero que modifiques el script @/web/data/from_scraped_to_web.py para que tome como pleamar el máximo local y como bajamar el mínimo local. Todos los demás puntos deberán llamarse "subiendo" si va rumbo a una pleamar o bajando, si va rumbo a una bajamar.`


1. `Bien, ahora quiero que la web tenga:
   el estado para la hora actual: subiendo, bajando, en pleamar, en bajamar.
    Y que en los recuadros indique cuál es la próxima pleamar/bajamar, y la previa.`

    `¿Podés hacer los cambios?`

1. `Buenísimo. Ahora quiero únicamente 2 recuadros, uno para lo pasado y otro para lo futuro, que den, de manera compacta el próximo/pasado evento más cercano, y un poco más pequeño el siguiente más lejano.`

    `¿Podés hacer el cambio?`

1. `Genial! un pequeño bug quedó. Puede ser que el día no termine en una pleamar, sino, que esté subiendo y la pleamar sea el día siguiente. Es decir, el tiempo debe ser un continuo a lo largo de los días y los meses. Creo que hay que modificar el @/web/data/from_scraped_to_web.py , ¿no?¿podés modificarlo?`

    `Quizás también hay que modificar la web para que pueda mostrar eventos del día siguiente o el anterior.`

1. `Casi casi bien, para el día de hoy, 25 de enero, los valores que tengo  anotados son:`
    
    `94 90 83 77 71 67 66 70 75 75 73 67 61 52 45 38 35 34 37 48 63 77 87 94`

    `Los puntos notables son:`

    `pleamar: 23:00 del día anterior`

    `bajamar:  6:00 con 66.`

    `pleamar: 8:00 con 75`

    `bajamar: 17:00 con 34`

    `pleamar: 00 del día siguiente.`

    `Se entiende, en caso de empate debe quedarse con el primer valor. ¿Podés arreglarlo? Actualmente se está salteando la pleamar de las 8`

1. `Fantástico, un último cambio, en la tabla de horarios de abajo dejar los últimos 3 antes de la hora actual. La fila de la hora actual distinguida, y después las filas hasta completar las 24hs.`

1. `Ahí cambié la carpeta web a docs para publicar en githubpages. Pero no anda que te ofrezca la opción de "instalar" la app/página desde mobile, ¿es muy dificil de cambiar?`

1. `Logra instalar la app, pero al abrirla falla. Dice "There isn't a github pages site here". Cuando en realidad debería ofrecer la misma página, pero con versión disponible sin internet.`

1. `Fantástico. Me gustaría 2 cambios más:`

   `1- que en la versión mobile, el cuadro de próximos eventos aparezca antes del de los eventos pasados`

   `2- que cada 15 minutos se actualice la vista (a las 00, 15, 30 y 45 minutos)`

   `¿Podés hacer los cambios?`
