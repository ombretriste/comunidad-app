# Mi comunidad

App web instalable (PWA) para una comunidad de vecinos. Versión 0.17.0.

- **Tablón de anuncios**: solo publican el presidente y el vicepresidente; se pueden fijar y borrar.
- **Contacta con la presidencia**: cada vivienda tiene una conversación privada que solo leen el presidente y el vicepresidente. Se borra cuando entra alguien nuevo en los cargos (no si solo se intercambian).
- **Chat «Presidencia»**: fijo, solo para el presidente y el vicepresidente de cada momento (al entrar alguien nuevo en los cargos se borra y empieza vacío); no se puede editar, cerrar ni borrar.
- **Chats de vecinos**: no hay ninguno por defecto; los crean los cargos, para todas las viviendas (también las que se den de alta después) o solo para algunas (p. ej. la comisión de obras). Los cargos están en todos y los moderan: cerrar/abrir, borrar mensajes y bloquear viviendas.
- **Adjuntos en chats y conversaciones**: fotos (se comprimen a 1600 px) y archivos de hasta 10 MB, cualquier vivienda; se ven dentro de la app. Duran un mes en el servidor.
- **Llamadas en grupo en los chats** (botón de teléfono para solo voz y de cámara para vídeo, hasta 6 personas, cada móvil conectado con los demás como en MeetCTRL); quien la empieza avisa a los miembros y el chat muestra «Unirse».
- **Llamadas con la presidencia** (voz y vídeo, WebRTC como en ChatCTRL) desde «Contacta con la presidencia» y, para los cargos, desde cada conversación. Con datos móviles hace falta TURN: variables `CF_TURN_KEY_ID` y `CF_TURN_API_TOKEN` (Cloudflare) en Vercel; `GET /api/comunidad` dice `turn: ok | sin-claves`.
- **Encuestas**: las crean los cargos con las opciones que quieran y cierre opcional por fecha. Un voto secreto por vivienda. Al cerrarse, el resultado se publica solo en el tablón.
- **Gestión** (cargos): nombre e **icono de la comunidad** (el icono sale en la app y en todos los PDF), código público de la comunidad, solicitudes de código, alta de viviendas y locales (por plantas con puertas A/B/C/D, Izquierda/Derecha o Izquierda/Centro/Derecha, bajos y locales, o una por línea), cambio de nombre de una vivienda o local (sin cambiar su código), marca de vivienda alquilada (avisa de entregar el código al propietario y lo pone en su tarjeta), nuevo código, bloqueo y baja de viviendas, y **cambio de presidente y vicepresidente**. El presidente y el vicepresidente tienen exactamente los mismos permisos.
- **Administrador de la app**: un vecino de confianza para mantener la app. La presidencia lo configura en Gestión con una clave (PBKDF2 en el servidor, ≥8 caracteres; el administrador puede cambiarla). Entra con el código de la comunidad + su clave desde «Acceso de administrador» (una sesión a la vez; 10 intentos fallidos por IP/15 min y 30 por comunidad/h). Tiene los permisos de gestión, firma como «Administración de la app», no vota, no es una vivienda y no ve el chat «Presidencia».
- **Tarjetas de códigos en PDF** para el buzón (4 por A4): icono y nombre de la comunidad, vivienda, código, aviso de que es personal e intransferible y cómo volver a pedirlo desde la app.
- **Tarjetas de todas las viviendas**: en Documentos, un PDF con las tarjetas de todos los códigos (4 por A4). Desde la 0.7.0 el servidor guarda los códigos para los cargos; a las viviendas anteriores se les puede generar uno nuevo desde ahí.
- **Documentos** (cargos, menú ⋯ o Gestión): PDF formales con cabecera de la comunidad y letra grande, con parte fija y datos opcionales: aviso de la nueva app (enlace y código bien visibles), convocatoria de Junta General Ordinaria y Extraordinaria (con autorización de representación para recortar), reunión de la comisión de obras, listado de asistencia (vivienda, presente, representado, representado por, firma) y comunicado libre. Al crearlos se ven dentro de la app (visor propio, con ampliar y compartir/guardar/imprimir) o se publican en el tablón con el PDF adjunto.
- **Acta de reunión** (menú ⋯, cargos): formulario con tipo de junta, fecha, hora, convocatoria, lugar, asistentes (ausente / presente / representada y por quién), orden del día con textos tipo para cada punto, texto libre y hora de cierre. Se rellena con la última convocatoria del tablón (las publicadas desde Documentos guardan sus datos; las antiguas se leen del texto) y el borrador se guarda en el móvil. Crea un PDF formal con firmas y lo publica en el tablón (y en el Archivo, «Actas»).
- **Firma en pantalla**: en Documentos (firma de quien usa el móvil, guardada solo en él) y en las actas (presidente y secretario, guardadas con el borrador); se dibuja con el dedo y sale en el PDF sobre la línea de firma.
- **Archivo** (menú ⋯): documentos importantes de la comunidad clasificados por tipo (Actas, Presupuestos…), con filtro y búsqueda; los cargos ordenan los documentos arrastrándolos por su asa (los nuevos entran arriba). Todos lo consultan; solo los cargos añaden, clasifican o quitan. Los adjuntos del tablón (y los PDF de Documentos publicados en él) entran solos, también los publicados antes de existir el Archivo (se incorporan una vez, con el tipo deducido del título o nombre); si falta el tipo, la app avisa antes de publicar. Los archivos del Archivo no caducan y no se borran al borrar el anuncio.
- **Archivos en el tablón**: hasta 5 por anuncio, 10 MB cada uno (actas, circulares…). Al tocarlos se ven dentro de la app: PDF con pdf.js 3.11.174 (`vendor/`, Apache 2.0, igual que DocCTRL), imágenes y textos; desde el visor se comparten o descargan.
- **Avisos push**: al abrir la app se piden si no están activados, hay un aviso en la pantalla principal mientras no lo estén y se activan o desactivan desde el menú ⋯. Avisan de anuncios, encuestas y resultados, chat, respuestas de la presidencia y, a los cargos, de mensajes y solicitudes de código. En el iPhone requieren la app añadida a la pantalla de inicio.

## Sin datos personales

Cada vivienda entra con un código propio de 12 caracteres (`XXXX-XXXX-XXXX`) que la presidencia deja en su buzón. Pueden usarlo a la vez todas las personas de la vivienda, cada una en su móvil: todo (mensajes, conversación con la presidencia, voto) cuenta como la misma vivienda. Los vecinos se ven solo por su vivienda (p. ej. «3º B»). El servidor guarda únicamente el resumen SHA-256 de cada código: si se pierde, se genera otro y el anterior deja de valer.

Sin código, la app muestra la pantalla para **solicitarlo**: el vecino indica el código de la comunidad (o llega con el enlace `?c=XXXXXX`) y su vivienda, confirma la solicitud y la app le responde que lo recibirá en su buzón en los próximos días. La solicitud aparece en Gestión.

Con código, la app abre directamente la pantalla principal (sin pantalla de entrada).

## Seguridad

- **Cabeceras** (vercel.json): CSP estricta (solo scripts propios, sin `eval`, sin scripts en línea; conexiones solo al propio servidor), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY` / `frame-ancestors 'none'` y `Permissions-Policy` (cámara y micrófono solo para la propia app; sin ubicación ni pagos).
- **Permisos en el servidor**: todo lo que no es de cualquier vecino (tablón, encuestas, gestión, moderación, documentos, cargos) se comprueba en `api/comunidad.js` según el cargo de la vivienda que llama; la app solo oculta botones.
- **Códigos**: 12 caracteres (≈60 bits); 20 intentos fallidos por IP cada 15 min. Se guardan legibles solo para los cargos (tarjetas); entrar se comprueba con su SHA-256.
- **Límites**: comunidades nuevas 5/día por IP, solicitudes de código 10/h, consultas de código de comunidad 60/h, mensajes 20/min por vivienda, archivos 60/h por vivienda, señales de llamada limitadas.
- **Entradas**: textos recortados y limpiados, identificadores validados con patrones; las viviendas se guardan en objetos sin prototipo (un identificador `__proto__` no pasa por una vivienda).
- **Avisos push**: solo se aceptan direcciones de los servicios de Apple, Google, Mozilla y Microsoft.
- **En la app**: todo texto de usuario se escapa al pintarlo; los archivos se ven con pdf.js sin `eval`, imágenes en `<img>` y textos como texto; los enlaces abren aparte con `noopener`.
- **Puntos abiertos**: no hay cifrado de extremo a extremo (la presidencia y quien administre la base de datos pueden leer los datos); un archivo se puede descargar por cualquiera de la comunidad que conozca su identificador (aleatorio de 128 bits, solo aparece en los mensajes que puede ver).

## Despliegue

Vercel + Upstash Redis (integración de Vercel). La API es `api/comunidad.js` y todas las claves empiezan por `vec:`, así que puede compartir base de datos con otras apps. `GET /api/comunidad` dice si la base de datos está configurada.

Al cambiar archivos: subir `APP_VERSION` en `app.js` (arreglos 0.x.y, novedades 0.x.0), este README y `CACHE` en `sw.js`.
