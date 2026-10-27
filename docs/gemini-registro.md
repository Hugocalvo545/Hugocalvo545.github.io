# Registro de cambios (rama gemini/cv-ciberseguridad)

Fecha: 2026-10-27

## Paso 1: Currículum en español (curriculum.html, css/cv.css, js/cv.js)
- Actualizado `<title>` a `Hugo Calvo García | Desarrollador full-stack · IA aplicada · Ciberseguridad`, `<meta name="description">` y el titular a `Desarrollador full-stack · IA aplicada · Máster en Ciberseguridad (en curso)`.
- Eliminadas todas las frases que indicaban o insinuaban cobros o usuarios de pago en los productos propios.
- Actualizado el titular de introducción a `Del producto al soporte: construyo y lanzo software de principio a fin.` y el resumen con el bloque de IA aplicada y el Máster en Ciberseguridad (2026 - 2027).
- Actualizadas las cifras destacadas a: `3 productos en producción (GEOPilot, Gestolio y DadoManía)`, `1 plataforma en desarrollo con foco en seguridad (Hostiva)` y `C1 inglés con estancia académica en Canadá`.
- Cambiado el título de la sección de productos a `Productos propios en producción y en desarrollo.`
- Eliminada la tarjeta de Tu Casa en Jerez.
- Actualizadas las tarjetas de GEOPilot (validación con Gestolio en Google IA y Perplexity) y Gestolio (acceso sin contraseña con passkeys WebAuthn).
- Añadidas las tarjetas de Hostiva (`Plataforma propia · En desarrollo (fase 1 completada)`, con `Demo bajo petición`) y DadoManía (`Juego propio · En producción`, enlace a `https://dadomania.com`), manteniendo el orden: GEOPilot, Gestolio, Hostiva, DadoManía.
- Añadido el bloque de logro destacado `Caso real: Gestolio citado por la IA de Google y por Perplexity` con las capturas `gestolio-google-ia.png` y `gestolio-geopilot-medicion.png` en miniatura, carga diferida, texto alternativo descriptivo y ampliación mediante `<dialog>` al pulsar.
- Añadida la categoría `Seguridad` y renombrada/ampliada la categoría `IA aplicada` en el stack técnico.
- Actualizada la experiencia como autónomo con el sistema propio de agentes de IA con cola de aprobación humana.
- Añadido el `Máster en Ciberseguridad · Digitech FP · En curso` (2026 - 2027) al inicio de la formación.
- Limpiados los parámetros de seguimiento del enlace de LinkedIn.

## Paso 2: Currículum en inglés (curriculum_english.html)
- Aplicados todos los cambios equivalentes del Paso 1 traducidos al inglés profesional (`Full-stack developer · Applied AI · Cybersecurity`, `Full-stack developer · Applied AI · Cybersecurity Master's (in progress)`, tarjetas de GEOPilot, Gestolio, Hostiva y DadoManía, bloque de caso real con miniaturas ampliables, categorías `Security` y `Applied AI`, experiencia y formación).

## Paso 3: Versión imprimible para PDF (css/cv.css)
- El repositorio no incluye script automatizado de generación de PDF.
- Ajustadas las reglas `@media print` en `css/cv.css` para que la impresión ("Guardar como PDF") salga en modo claro, limpia, sin sombras ni efectos, ocultando las miniaturas e incluyendo únicamente el texto del logro destacado.

## Paso 4: Caso real en la portada (index.html, css/home.css, js/home.js)
- Añadida la sección `#caso-real` (`Mi propio producto, citado por la IA de Google y por Perplexity`) justo después de los servicios, con la galería de las cuatro capturas de `assets/casos/` (`gestolio-google-ia.png`, `gestolio-google-fuente.png`, `gestolio-perplexity.png`, `gestolio-geopilot-medicion.png`), carga diferida, ampliación al pulsar, nota legal de descargo de garantías y botón de consulta hacia `#contacto`.
- Eliminada la tarjeta de Tu Casa en Jerez en `index.html` y sustituida por DadoManía dentro de los tres productos en producción.
- Eliminadas las menciones a `pagos reales` / `usuarios que pagan` y corregido el guion largo en el bloque JSON-LD de `index.html` y en `css/home.css`.

## Paso 5: Efecto de partículas y alineación del portfolio (assets/js/particulas.js, portfolio/portfolio.html, portfolio/portfolio_eng.html, portfolio/css/portfolio_Hugo.css)
- Creado `assets/js/particulas.js` en `<canvas>` y JavaScript nativo sin librerías externas, cargado en `index.html`, `portfolio/portfolio.html` y `portfolio/portfolio_eng.html`.
- Implementados anillos de trazos alargados orientados hacia el centro del campo, con degradado entre colores del tema (adaptable a tema claro y oscuro), respiración suave en reposo, desplazamiento del centro con inercia hacia el puntero, repulsión elástica en trazos cercanos al ratón o al toque en móvil, atenuación detrás del texto del hero, reducción de partículas en móvil, pausa con `visibilitychange` y soporte para `prefers-reduced-motion`.
- Alineados `portfolio/portfolio.html` y `portfolio/portfolio_eng.html`: eliminada Tu Casa en Jerez, añadidas Hostiva y DadoManía en el orden GEOPilot, Gestolio, Hostiva, DadoManía, eliminadas referencias a `pagos reales` / `usuarios que pagan` y limpiados los enlaces de LinkedIn.

## Paso 6: Comprobación y registro
- Revisada la paridad de contenido entre `curriculum.html` y `curriculum_english.html`.
- Comprobada la ausencia de menciones a `Tu Casa en Jerez`, `pagos reales`, `usuarios que pagan` y guiones largos en los archivos actualizados.
- Verificadas las rutas y atributos `alt` / `loading="lazy"` de las cuatro imágenes en `assets/casos/`.
- Ajuste final de textos en `index.html`: actualizado el subtítulo del hero (`trabajo tu presencia online para que los buscadores de IA conozcan mejor tu negocio y tengan más motivos para citarlo`) y el subtítulo de `#productos` (`Productos propios en producción, hechos de principio a fin: producto, código, seguridad y despliegue.`).
