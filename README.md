# Mi comunidad

App web instalable (PWA) para una comunidad de vecinos. Versión 0.4.1.

- **Tablón de anuncios**: solo publican el presidente y el vicepresidente; se pueden fijar y borrar.
- **Contacta con la presidencia**: cada vivienda tiene una conversación privada que solo leen el presidente y el vicepresidente.
- **Chat de vecinos**: abierto a todas las viviendas. Los cargos lo moderan: cerrar/abrir, borrar mensajes y bloquear viviendas.
- **Encuestas**: las crean los cargos con las opciones que quieran y cierre opcional por fecha. Un voto secreto por vivienda. Al cerrarse, el resultado se publica solo en el tablón.
- **Gestión** (cargos): nombre e **icono de la comunidad** (solo el presidente; el icono sale en la app y en todos los PDF), código público de la comunidad, solicitudes de código, alta de viviendas y locales (por plantas con puertas A/B/C/D, Izquierda/Derecha o Izquierda/Centro/Derecha, bajos y locales, o una por línea), cambio de nombre de una vivienda o local (sin cambiar su código), nuevo código, bloqueo y baja de viviendas, y **cambio de presidente y vicepresidente** (solo el presidente).
- **Tarjetas de códigos en PDF** para el buzón (4 por A4): icono y nombre de la comunidad, vivienda, código, aviso de que es personal e intransferible y cómo volver a pedirlo desde la app.
- **Documentos** (cargos, menú ⋯ o Gestión): PDF formales con cabecera de la comunidad y letra grande, con parte fija y datos opcionales: aviso de la nueva app (enlace y código bien visibles), convocatoria de Junta General Ordinaria y Extraordinaria (con autorización de representación para recortar), reunión de la comisión de obras, listado de asistencia (vivienda, presente, representado, representado por, firma) y comunicado libre. Al crearlos se ven dentro de la app (visor propio, con ampliar y compartir/guardar/imprimir) o se publican en el tablón con el PDF adjunto.
- **Archivos en el tablón**: hasta 5 por anuncio, 10 MB cada uno (actas, circulares…).
- **Avisos push**: al abrir la app se piden si no están activados, hay un aviso en la pantalla principal mientras no lo estén y se activan o desactivan desde el menú ⋯. Avisan de anuncios, encuestas y resultados, chat, respuestas de la presidencia y, a los cargos, de mensajes y solicitudes de código. En el iPhone requieren la app añadida a la pantalla de inicio.

## Sin datos personales

Cada vivienda entra con un código propio de 12 caracteres (`XXXX-XXXX-XXXX`) que la presidencia deja en su buzón. Los vecinos se ven solo por su vivienda (p. ej. «3º B»). El servidor guarda únicamente el resumen SHA-256 de cada código: si se pierde, se genera otro y el anterior deja de valer.

Sin código, la app muestra la pantalla para **solicitarlo**: el vecino indica el código de la comunidad (o llega con el enlace `?c=XXXXXX`) y su vivienda, confirma la solicitud y la app le responde que lo recibirá en su buzón en los próximos días. La solicitud aparece en Gestión.

Con código, la app abre directamente la pantalla principal (sin pantalla de entrada).

## Despliegue

Vercel + Upstash Redis (integración de Vercel). La API es `api/comunidad.js` y todas las claves empiezan por `vec:`, así que puede compartir base de datos con otras apps. `GET /api/comunidad` dice si la base de datos está configurada.

Al cambiar archivos: subir `APP_VERSION` en `app.js` (arreglos 0.x.y, novedades 0.x.0), este README y `CACHE` en `sw.js`.
