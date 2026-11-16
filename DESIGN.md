# Sistema de diseño web: registro de decisiones (v1 · 15 nov 2026)

Base: Manual de identidad v5 y Kit v3 (tokens `theme-tokens-v3`). Este archivo documenta las adaptaciones y patrones nuevos que salieron del desarrollo web, para reutilizarlos en otras piezas de la marca.

## Dirección
**Explorador riguroso → cuaderno de campo técnico**, aplicado como página editorial: mucho papel, reglas finas, una sola ilustración protagonista y un trazo que recorre la página como una ruta en un mapa. Modo *Persuade* (Impeccable): la oferta y la acción se entienden en la primera pantalla.

## Patrones nuevos
1. **Sendero de página (firma de movimiento).** Un trazo cobre fino en el margen izquierdo conecta las secciones. Se revela con el scroll nativo y cada sección es un hito que emite un pulso una sola vez. Es la traducción de «rutas y topografía» a la interacción. Se puede reutilizar en presentaciones (barra de progreso con forma de ruta) y en video (rótulo que avanza).
2. **Escena registrada sobre el arte.** El hero usa la pareja 19 / 19L sin modificar los píxeles. Sobre la ilustración, un SVG con el mismo `viewBox` (1536×1024) marca los nodos cobre con un brillo que respira (ciclos de 5 a 8 s) y lanza un pulso por sesión a lo largo del sendero hasta la estrella. La animación nunca dibuja líneas nuevas encima del grabado.
3. **Texto sobre el cielo.** En escritorio, el arte va a sangre y se funde con el fondo mediante una máscara superior. Así el texto queda en el cielo vacío y no en un panel. En móvil van primero el texto y la acción, y después el arte.
4. **Casos como filas editoriales.** Sustituyen a las tres tarjetas numeradas de la plantilla `website-hero`. Cada fila tiene el sector en mono, el título, el resumen, la contribución, el stack y un detalle desplegable con una invitación de contacto propia del caso.
5. **Diagrama STEAM.** Tres conjuntos con trazo de tinta, los cruces numerados y explicados debajo, «Diego» en el centro y la creatividad como órbita punteada en cobre que los une.
6. **Ilustraciones sin fondo con pareja derivada** (22 *La arquitectura del criterio*, en «Forma de trabajo»). El original no se modifica; el sitio usa dos derivados:
   - **Claro:** se extrae el trazo como máscara alfa y se pinta con los tokens (`--dm-text` para el grabado, `--dm-accent` para el cobre). Queda sin fondo sobre Papel.
   - **Oscuro:** se recorta la silueta del busto y se conserva el mármol iluminado sobre Tinta. El trazo exterior de la red se pasa a salvia claro y el cobre a Cobre luz.
   - Las dos tienen fundido inferior y derecho, y solo se descarga la variante del tema activo. Es una adaptación hecha a mano, no `invert()`, y la aprueba Diego como excepción a la regla de «sin pareja» del kit. El mismo método sirve para otras piezas del catálogo.

7. **Selector de casos (divulgación progresiva).** Los casos destacados se muestran como una lista de títulos a la izquierda y un panel a la derecha (en móvil, el panel va bajo la lista). El panel tiene una frase, un diagrama de tres pasos («Cómo funciona»), la contribución y el stack. El texto completo queda tras «Ver el proyecto». «Más proyectos» está colapsado por defecto.
8. **Capacidades como índice con lámina.** A la izquierda, las capacidades como entradas editoriales: título, una frase y etiquetas en mono. A la derecha, una lámina fija que se dibuja con la capacidad activa. La entrada activa la marca el scroll nativo (la que cruza el centro de la pantalla), el cursor o el foco, y un punto cobre compartido viaja hasta ella. Las láminas son dibujos de línea en el vocabulario de la marca:
   - Plataformas: estratos y un lago de datos.
   - Predicción: una ruta que continúa en un cono de incertidumbre.
   - Ciencia de datos: constelaciones de clústeres.
   - IA: un nodo central conectado a sistemas.
   - Arquitectura: relieve con un sendero dev → test → prod y una órbita de CI/CD.
   Se tiñen con los tokens del tema, sin imágenes rasterizadas. En móvil, cada entrada lleva su lámina en pequeño y estática. No hay CTA grande; solo una invitación terciaria: «¿Tu reto no encaja del todo aquí? Cuéntamelo».
9. **Nube en una franja ligera.** Va sobre el mismo fondo, sin caja: los nombres de las plataformas (o los logos oficiales en monocromo) y AWS destacado como plataforma principal.
10. **Jerarquía de botones.** Primario relleno (Bosque/Papel). Secundario con contorno de tinta de 1,5 px que se rellena al pasar el cursor. Terciario como texto subrayado de 1,5 px. Cada bloque tiene una sola acción primaria.

11. **Cambio de sección con curvas de nivel.** Entre secciones va una franja de cinco curvas de nivel, eco de las líneas de la base del hero. Se trazan con el scroll y un pulso cobre las recorre una vez, como continuación del sendero de la entrada. Separa las secciones sin bloques de color, y los titulares de sección crecen a `clamp(2rem … 3.25rem)` con revelado por máscara.
12. **Casos con scroll (escritorio).** El selector queda fijo (sticky) en un recorrido de 250vh. El scroll nativo avanza de un caso al siguiente, con una barra de progreso cobre junto a la lista. Pulsar un caso desplaza hasta su tramo. Al abrir «Ver el proyecto» el recorrido se desactiva y la sección vuelve al flujo normal. En móvil se mantienen las pestañas manuales.
13. **Capacidades sin saltos.** La entrada activa es la más cercana al centro de la pantalla en cada frame de scroll, y cada entrada ocupa al menos 34vh en escritorio.

## Ajustes al manual
| Tema | Antes | Ahora | Motivo |
|---|---|---|---|
| Etiqueta sobre el titular | Plantilla con «DATOS · IA · CLOUD» encima del H1 | El nombre forma parte del H1; la etiqueta se elimina | Jerarquía más limpia (una «eyebrow» es un patrón genérico) y mejor SEO |
| Numeración 01/02/03 | En tarjetas de proyectos | Eliminada | Los números no aportan información |
| Divisores | Salvia (2,21:1) | Tinta al 14 % (claro) / Papel al 14 % (oscuro) | Reglas más finas y uniformes en ambos temas; siguen siendo decorativas |
| Error, texto | No definido | Claro `#8C2F1B` (7,21:1 sobre Papel) · Oscuro `#F0A58C` (7,37:1 sobre Tinta) | El estado de error necesita un color accesible distinto del cobre decorativo |
| Iconos | Trazo de 1,5 a 2 px | 1,6 px en una retícula de 24, terminales redondeados | Un solo valor consistente |
| Favicon | DM | La D sola más el punto cobre, adaptativo claro/oscuro | El manual ya preveía la versión micro de la D |
| Texto secundario importante | Pizarra (5,0:1) | Nuevo `--dm-text-2`: claro `#34474A` (8,5:1), oscuro `#CBD6CF` (9,9:1). Pizarra/Salvia quedan para etiquetas y metadatos | Más contraste en los textos que importan |
| Mono | Anotaciones | Solo sectores, stacks, áreas y etiquetas técnicas | Evitar el mono como disfraz «técnico» |

## Movimiento
| Elemento | Valor |
|---|---|
| Curva de la interfaz | `cubic-bezier(0.23, 1, 0.32, 1)` (ease-out fuerte) |
| Hover de botones y enlaces | 200 ms; flecha +3 px; subrayado que se dibuja |
| Pulsación | `scale(0.97)` en 160 ms |
| Entrada cinematográfica (1.ª visita por sesión) | La ilustración completa se ajusta a la pantalla (por altura en portátiles anchos, con los bordes fundidos) y se acerca lentamente. Curvas sine y power3 y unos 12 s en total. Un pulso cobre recorre el sendero de las rocas hasta el caminante y sigue por la constelación. Cada estrella se enciende con su palabra: Problema de negocio → Estrategia → Valor agregado → Solución en producción. Las palabras se apagan y la imagen se congela y baja a su lugar (FLIP, 1,5 s, expo.inOut) mientras aparece el texto. Dura unos 7 s; cualquier scroll, toque o tecla la acelera ×6 |
| Entrada del sitio (visitas siguientes) | El titular emerge línea a línea desde una máscara (1 s, expo.out, escalonado 90 ms). El paisaje se descubre de abajo hacia arriba con clip-path (1,7 s). Después, el pulso recorre el sendero. Un solo gesto, unos 2,6 s |
| Transición entre secciones | Cada titular de sección repite el gesto de máscara al entrar en pantalla (0,9 s, una vez), sincronizado con el hito del sendero |
| Detalle de casos | Transición de `grid-template-rows` en 320 ms |
| Sendero | Scrub de 0,4 s; pulso del hito de 1 s; máximo 2 pulsos simultáneos |
| Lenis | **No se usa**: el documento maestro exige scroll nativo y no capturar la rueda ni los gestos |

`prefers-reduced-motion: reduce` siempre manda. El control «Animación de fondo» solo afecta a la escena y al sendero; si está desactivado, el sendero se muestra completo y estático.

## Tipografía web
- Display: `clamp(2.25rem, 1.35rem + 3.6vw, 4rem)`, interlineado 1,04, tracking −0,03 em.
- Sección: `clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem)`.
- Cuerpo: 17–18 px, interlineado 1,6.
- Mono: 13 px.
- Medida máxima del texto: 62 caracteres por línea.
- Fuentes variables autoalojadas: Manrope y Source Sans 3; IBM Plex Mono en 400 y 500.

## Retícula
Contenedor de 1200 px, 12 columnas en escritorio, márgenes `clamp(24px … 48px)` y secciones de 80 a 96 px.
