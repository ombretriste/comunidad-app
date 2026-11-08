# Mi comunidad

App web instalable (PWA) para una comunidad de vecinos. Versión 0.1.0.

- **Tablón de anuncios**: solo publican el presidente y el vicepresidente; se pueden fijar y borrar.
- **Contacta con la presidencia**: cada vivienda tiene una conversación privada que solo leen el presidente y el vicepresidente.
- **Chat de vecinos**: abierto a todas las viviendas. Los cargos lo moderan: cerrar/abrir, borrar mensajes y bloquear viviendas.
- **Encuestas**: las crean los cargos con las opciones que quieran y cierre opcional por fecha. Un voto secreto por vivienda. Al cerrarse, el resultado se publica solo en el tablón.
- **Gestión** (cargos): nombre de la comunidad (solo el presidente), código público de la comunidad, solicitudes de código, alta de viviendas por plantas o una a una, códigos imprimibles en tarjetas para el buzón, nuevo código, bloqueo y baja de viviendas, y **cambio de presidente y vicepresidente** (solo el presidente).

## Sin datos personales

Cada vivienda entra con un código propio de 12 caracteres (`XXXX-XXXX-XXXX`) que la presidencia deja en su buzón. Los vecinos se ven solo por su vivienda (p. ej. «3º B»). El servidor guarda únicamente el resumen SHA-256 de cada código: si se pierde, se genera otro y el anterior deja de valer.

Sin código, la app muestra la pantalla para **solicitarlo**: el vecino indica el código de la comunidad (o llega con el enlace `?c=XXXXXX`) y su vivienda, confirma la solicitud y la app le responde que lo recibirá en su buzón en los próximos días. La solicitud aparece en Gestión.

Con código, la app abre directamente la pantalla principal (sin pantalla de entrada).

## Despliegue

Vercel + Upstash Redis (integración de Vercel). La API es `api/comunidad.js` y todas las claves empiezan por `vec:`, así que puede compartir base de datos con otras apps. `GET /api/comunidad` dice si la base de datos está configurada.

Al cambiar archivos: subir `APP_VERSION` en `app.js` (arreglos 0.x.y, novedades 0.x.0), este README y `CACHE` en `sw.js`.
